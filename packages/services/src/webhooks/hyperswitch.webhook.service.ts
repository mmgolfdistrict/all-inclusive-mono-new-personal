/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { and, Db, eq, sql } from "@golf-district/database";
import { bookings } from "@golf-district/database/schema/bookings";
import { lists } from "@golf-district/database/schema/lists";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import {
  InsertUserProviderCourseLink,
  userProviderCourseLink,
} from "@golf-district/database/schema/userProviderCourseLink";
import { users } from "@golf-district/database/schema/users";
import Logger from "@golf-district/shared/src/logger";
import { CustomerCart } from "../checkout/types";
import { NotificationService } from "../notification/notification.service";
import { ProviderService } from "../tee-sheet-provider/providers.service";
import { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import { CustomerCreationData } from "../tee-sheet-provider/sheet-providers/types/foreup.type";
import { TokenizeService } from "../token/tokenize.service";
import type { HyperSwitchEvent } from "./types/hyperswitch";

/**
 * `HyperSwitchWebhookService` - A service for processing webhooks from HyperSwitch.
 *
 * The `HyperSwitchWebhookService` class handles various webhook events from HyperSwitch,
 * such as payment success and failure. It uses the `Logger` utility for logging warnings and errors.
 *
 * @example
 * ```typescript
 * const hyperSwitchWebhookService = new HyperSwitchWebhookService(tokenizeService);
 * hyperSwitchWebhookService.processWebhook(req);
 * ```
 *
 * @see {@link Logger}
 * @see {@link TokenizeService}
 */
export class HyperSwitchWebhookService {
  private readonly logger = Logger(HyperSwitchWebhookService.name);
  /**
   * Creates an instance of `HyperSwitchWebhookService`.
   *
   * @param {TokenizeService} tokenizeService - The `TokenizeService` instance for handling tokenization and transfer of bookings.
   */
  constructor(
    private readonly database: Db,
    private readonly tokenizeService: TokenizeService,
    private readonly providerService: ProviderService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Processes the HyperSwitch webhook event and performs the necessary actions based on the event type.
   *
   * @param {HyperSwitchEvent} req - The incoming webhook event from HyperSwitch.
   * @returns {Promise<void>} - A promise that resolves once the webhook event is processed.
   * @throws {Error} - Throws an error if the event type is unhandled.
   *
   * @example
   * ```typescript
   * const webhook = { event_type: "payment_succeeded", ... };
   * hyperSwitchWebhookService.processWebhook(webhook);
   * ```
   */
  processWebhook = async (req: HyperSwitchEvent) => {
    console.log("called");
    // if (!this.isFromValidDomain(req)) {
    //   throw new Error("Invalid webhook source.");
    // }
    const webhook = req;
    switch (webhook.event_type) {
      case "payment_succeeded":
        return this.paymentSuccessHandler(webhook);
      case "payment_failed":
        return this.paymentFailureHandler(webhook);
      default:
        this.logger.warn(`Unhandled event type: ${webhook.event_type}`);
        throw new Error("Unhandled event type.");
    }
  };

  //@TODO handle failed transactions
  /**
   * Handles the payment success webhook event from HyperSwitch.
   *
   * @param {HyperSwitchEvent} webhook - The incoming webhook event for payment success.
   * @returns {Promise<void>} - A promise that resolves once the payment success event is handled.
   *
   * @example
   * ```typescript
   * const webhook = { event_type: "payment_succeeded", ... };
   * hyperSwitchWebhookService.paymentSuccessHandler(webhook);
   * ```
   */
  paymentSuccessHandler = async (webhook: HyperSwitchEvent) => {
    console.log("payment success");
    //get metadata from payment
    const metadata: CustomerCart = webhook.content.object.metadata;
    const customer_id: string = webhook.content.object.customer_id!;

    const amount_received: number = webhook.content.object.amount_received!;
    console.log("metadata", metadata);
    console.log("customer_id", customer_id);
    console.log("amount_received", amount_received);

    //@TODO validate amount revived vs amount expected
    for (const item of metadata.cart) {
      switch (item.product_data.metadata.type) {
        case "first_hand":
          const [teeTime] = await this.database
            .select({
              id: teeTimes.id,
              courseId: teeTimes.courseId,
              entityId: teeTimes.entityId,
              date: teeTimes.date,
              providerCourseId: providerCourseLink.providerCourseId,
              providerTeeSheetId: providerCourseLink.providerTeeSheetId,
              providerId: teeTimes.soldByProvider,
              internalId: providerCourseLink.internalId,
              providerDate: teeTimes.providerDate,
              holes: teeTimes.numberOfHoles,
            })
            .from(teeTimes)
            .leftJoin(
              providerCourseLink,
              and(
                eq(providerCourseLink.courseId, teeTimes.courseId),
                eq(providerCourseLink.providerId, teeTimes.soldByProvider)
              )
            )
            .where(eq(teeTimes.id, item.product_data.metadata.tee_time_id))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error finding tee time id`);
            });
          if (!teeTime) {
            this.logger.fatal(`tee time not found id: ${item.product_data.metadata.tee_time_id}`);
            throw new Error(`Error finding tee time id`);
          }
          const { provider, token } = await this.providerService.getProviderAndKey(
            teeTime.internalId!,
            teeTime.courseId
          );
          const providerCustomer = await this.providerService.createCustomer(
            teeTime.courseId,
            teeTime.providerId!,
            teeTime.providerCourseId!,
            customer_id,
            provider,
            token
          );

          //purchased from provider
          const pricePerBooking = amount_received / item.product_data.metadata.number_of_bookings / 100;

          //create a provider booking for each player
          const bookingIds: string[] = [];
          for (let i = 0; i < item.product_data.metadata.number_of_bookings; i++) {
            const booking = await provider
              .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, {
                data: {
                  type: "bookings",
                  attributes: {
                    start: teeTime.providerDate,
                    holes: teeTime.holes,
                    players: 1,
                    bookedPlayers: [
                      {
                        accountNumber: providerCustomer.playerNumber,
                      },
                    ],
                    event_type: "tee_time",
                    details: "GD Booking",
                  },
                },
              })
              .catch((err) => {
                this.logger.error(err);
                //@TODO this email should be removed
                this.notificationService.createNotification(
                  customer_id,
                  "Error creating booking",
                  "An error occurred while creating booking with provider",
                  teeTime.courseId
                );
                throw new Error(`Error creating booking`);
              });
            bookingIds.push(booking.data.id);
          }
          //create tokenized bookings
          this.tokenizeService.tokenizeBooking(
            customer_id,
            pricePerBooking,
            item.product_data.metadata.number_of_bookings,
            bookingIds,
            item.product_data.metadata.tee_time_id,
            true
          );
          break;
        case "second_hand":
          const listingId = item.product_data.metadata.second_hand_id;
          const bookingsForListing = await this.database
            .select({
              id: bookings.id,
              ownerId: bookings.ownerId,
              courseId: bookings.courseId,
              providerBookingId: bookings.providerBookingId,
              providerId: teeTimes.soldByProvider,
              providerCourseId: providerCourseLink.providerCourseId,
              internalId: providerCourseLink.internalId,
              providerTeeSheetId: providerCourseLink.providerTeeSheetId,
            })
            .from(bookings)
            .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
            .leftJoin(
              providerCourseLink,
              and(
                eq(providerCourseLink.courseId, bookings.courseId),
                eq(providerCourseLink.providerId, teeTimes.soldByProvider)
              )
            )
            .where(eq(bookings.listId, listingId))
            .execute();
          if (bookingsForListing.length === 0) {
            this.logger.fatal(`no bookings found for listing id: ${listingId}`);
            //@TODO refund user
            throw new Error(`Error finding bookings for listing id`);
          }
          const firstBooking = bookingsForListing[0];
          if (!firstBooking) {
            throw new Error(`Error finding first booking for listing id`);
          }
          const second = await this.providerService.getProviderAndKey(
            firstBooking.internalId!,
            firstBooking.courseId
          );
          const secondHandCustomer = await this.providerService.createCustomer(
            firstBooking.courseId,
            firstBooking.providerId!,
            firstBooking.providerCourseId!,
            customer_id,
            second.provider,
            second.token
          );
          const providerId = bookingsForListing.map((booking) => booking.providerBookingId);
          //update bookings with provider
          providerId.forEach(async (booking) => {
            await second.provider.updateTeeTime(
              second.token,
              firstBooking.providerCourseId!,
              firstBooking.providerTeeSheetId!,
              booking as string,
              {
                data: {
                  type: "bookedPlayer",
                  id: booking,
                  attributes: {
                    name: secondHandCustomer.name,
                    personId: secondHandCustomer.customerId,
                  },
                },
              }
            );
          });
          // attributes: {
          //   bookedPlayers: [
          //     {
          //       accountNumber: secondHandCustomer.playerNumber,
          //     },
          //   ],
          // }
          // // transfer bookings to new owner
          const idToTransfer = bookingsForListing.map((booking) => booking.id);
          const price = amount_received / idToTransfer.length / 100;
          await this.tokenizeService.transferBookings(firstBooking.ownerId, idToTransfer, customer_id, price);
          //delete listing
          await this.database.transaction(async (trx) => {
            await trx
              .update(lists)
              .set({
                isDeleted: true,
              })
              .where(eq(lists.id, listingId))
              .execute()
              .catch((err) => {
                this.logger.error(`Error deleting listing: ${err}`);
                trx.rollback();
              });
            for (const booking of idToTransfer) {
              await trx
                .update(bookings)
                .set({
                  isListed: false,
                  listId: null,
                })
                .where(eq(bookings.id, booking))
                .execute()
                .catch((err) => {
                  this.logger.error(`Error updating bookingId: ${booking}: ${err}`);
                  trx.rollback();
                });
            }
          });

          break;
      }
    }
  };

  // if (metadata.type === "first_hand") {
  //   //tokenize booking on tee time
  // }
  //tokenize or transfer booking
  //acceptQuote from sensible
  //if either fails, create a refund for the paymen

  /**
   * Handles the payment failure webhook event from HyperSwitch.
   *
   * @param {HyperSwitchEvent} webhook - The incoming webhook event for payment failure.
   * @returns {Promise<void>} - A promise that resolves once the payment failure event is handled.
   *
   * @example
   * ```typescript
   * const webhook = { event_type: "payment_failed", ... };
   * hyperSwitchWebhookService.paymentFailureHandler(webhook);
   * ```
   */
  paymentFailureHandler = async (webhook: HyperSwitchEvent) => {
    //warn admin of payment failure
  };

  /**
   * Checks if the incoming request is from a valid domain based on the referrer or host.
   *
   * @param {any} req - The incoming request object.
   * @returns {boolean} - Returns true if the request is from a valid domain, otherwise false.
   *
   * @example
   * ```typescript
   * const isValidDomain = this.isFromValidDomain(req);
   * ```
   */
  // private isFromValidDomain = (req: any): boolean => {
  //   const isProduction = process.env.NODE_ENV === "production";
  //   const validHost = isProduction ? "api.hyperswitch.io" : "sandbox.hyperswitch.io";
  //   const referrer = req.get("Referrer") || req.get("Host");
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  //   return referrer?.startsWith(validHost) || false;
  // };
}
