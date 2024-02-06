/* eslint-disable @typescript-eslint/no-var-requires */
import { randomUUID } from "crypto";
import { and, Db, eq } from "@golf-district/database";
import { bookings } from "@golf-district/database/schema/bookings";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { donations } from "@golf-district/database/schema/donations";
import { lists } from "@golf-district/database/schema/lists";
import { promoCodes } from "@golf-district/database/schema/promoCodes";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { userPromoCodeLink } from "@golf-district/database/schema/userPromoCodeLink";
import Logger from "@golf-district/shared/src/logger";
import { Client } from "@upstash/qstash/.";
import { BookingService } from "../booking/booking.service";
import {
  AuctionProduct,
  CharityProduct,
  CustomerCart,
  FirstHandProduct,
  Offer,
  SecondHandProduct,
  SensibleProduct,
} from "../checkout/types";
import { NotificationService } from "../notification/notification.service";
import { ProviderService } from "../tee-sheet-provider/providers.service";
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
  private readonly qStashClient: Client;
  /**
   * Creates an instance of `HyperSwitchWebhookService`.
   *
   * @param {TokenizeService} tokenizeService - The `TokenizeService` instance for handling tokenization and transfer of bookings.
   */
  constructor(
    private readonly database: Db,
    private readonly tokenizeService: TokenizeService,
    private readonly providerService: ProviderService,
    private readonly notificationService: NotificationService,
    private readonly bookingService: BookingService,
    upStashClientToken: string
  ) {
    this.qStashClient = new Client({
      token: upStashClientToken,
    });
  }

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
    this.logger.info(`Processing webhook: ${req.event_id}`);
    const paymentId = req.content.object.payment_id;
    const amountReceived = req.content.object.amount_received;
    const customer_id = req.content.object.customer_id;
    if (!customer_id) throw new Error("Customer id not found");
    if (!paymentId) throw new Error("Payment id not found");
    if (!amountReceived) throw new Error("Amount received not found");
    const customerCart = await this.getCustomerCartData(paymentId);
    if (customerCart.promoCode) await this.usePromoCode(customerCart.promoCode, customer_id);

    //@TODO validate payment amount

    switch (req.event_type) {
      case "payment_succeeded":
        return this.paymentSuccessHandler(customerCart, amountReceived);
      case "payment_failed":
        return this.paymentFailureHandler(customer_id);
      default:
        this.logger.warn(`Unhandled event type: ${req.event_type}`);
        throw new Error("Unhandled event type.");
    }
  };

  usePromoCode = async (promoCode: string, customerId: string) => {
    const [promoCodeData] = await this.database
      .select({ id: promoCodes.id })
      .from(promoCodes)
      .where(and(eq(promoCodes.code, promoCode), eq(promoCodes.isDeleted, false)))
      .execute();
    if (!promoCodeData || !promoCodeData.id) return;
    await this.database
      .insert(userPromoCodeLink)
      .values({
        promoCodeId: promoCode,
        userId: customerId,
      })
      .execute();
  };

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

  paymentSuccessHandler = async (customerCart: CustomerCart, amountReceived: number) => {
    const customer_id: string = customerCart.customerId;
    for (const item of customerCart.cart) {
      switch (item.product_data.metadata.type) {
        case "first_hand":
          await this.handleFirstHandItem(item as FirstHandProduct, amountReceived, customer_id);
          break;
        case "second_hand":
          await this.handleSecondHandItem(item as SecondHandProduct, amountReceived, customer_id);
          break;
        case "offer":
          await this.handleOfferItem(item as Offer, amountReceived, customer_id);
          break;
        case "auction":
          await this.handleAuctionItem(item as AuctionProduct, amountReceived, customer_id);
          break;
        case "charity":
          await this.handleCharityItem(item as CharityProduct, amountReceived, customer_id);
          break;
        case "sensible": //sensible is handled last
          await this.handleSensibleItem(item as SensibleProduct, amountReceived, customer_id);
          break;
      }
    }
  };
  handleFirstHandItem = async (item: FirstHandProduct, amountReceived: number, customer_id: string) => {
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
    const pricePerBooking = amountReceived / item.product_data.metadata.number_of_bookings / 100;

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
    this.tokenizeService
      .tokenizeBooking(
        customer_id,
        pricePerBooking,
        item.product_data.metadata.number_of_bookings,
        bookingIds,
        item.product_data.metadata.tee_time_id,
        true
      )
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
  };
  handleSecondHandItem = async (item: SecondHandProduct, amountReceived: number, customer_id: string) => {
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
    //transfer bookings to new owner
    const idToTransfer = bookingsForListing.map((booking) => booking.id);
    const price = amountReceived / idToTransfer.length / 100;
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
    //create message to give to update old owners balance
    //@TODO create a constant for account hold wait time based on environment
    //@TODO funds to user must be calculated sub fees
    const accountHoldWait = 60 * 1000;
    this.notificationService.createNotification(
      firstBooking.ownerId,
      "Listing Sold",
      `Your teetime has been sold for $${price} the funds will be withdrawable from your account in ${"1 min"}`,
      firstBooking.courseId
    );

    const res = await this.qStashClient.publishJSON({
      url: `https://golf-district-platform-git-foreup-int-solidity-frontend.vercel.app/api/balance`,
      method: "POST",
      body: {
        userId: firstBooking.ownerId,
        amount: price,
      },
      delay: 30, // 10 second processing delay @TODO update to 1 min
      retries: 3,
    });
    console.log(res);
  };
  handleOfferItem = async (item: Offer, amountReceived: number, customer_id: string) => {
    await this.bookingService.createOfferOnBookings(
      customer_id,
      item.product_data.metadata.booking_ids,
      amountReceived,
      item.product_data.metadata.expires_at
    );
  };
  handleAuctionItem = async (item: AuctionProduct, amountReceived: number, customer_id: string) => {
    // Logic for handling first-hand items
    // ...
  };

  handleCharityItem = async (item: CharityProduct, amountReceived: number, customer_id: string) => {
    // Logic for handling first-hand items
    const [courseCharity] = await this.database
      .select({ courseCharityId: charityCourseLink.charityId })
      .from(charityCourseLink)
      .where(eq(charityCourseLink.courseId, item.product_data.metadata.charity_id))
      .limit(1)
      .execute();
    if (!courseCharity || !courseCharity.courseCharityId) {
      this.logger.fatal(
        `no course charity id found for charity id: ${item.product_data.metadata.charity_id}, courseId: ${item.product_data.metadata.charity_id}`
      );
      throw new Error(`Error finding course charity id`);
    }
    await this.database.insert(donations).values({
      id: randomUUID(),
      amount: amountReceived,
      userId: customer_id,
      charityId: item.product_data.metadata.charity_id,
      courseCharityId: courseCharity.courseCharityId,
    });
  };

  handleSensibleItem = async (item: SensibleProduct, amountReceived: number, customer_id: string) => {
    // Logic for handling first-hand items
    // ...
  };

  getCustomerCartData = async (paymentId: string) => {
    const [customerCartData] = await this.database
      .select({ cart: customerCarts.cart })
      .from(customerCarts)
      .where(eq(customerCarts.paymentId, paymentId))
      .execute();

    if (!customerCartData || !customerCartData.cart) {
      throw new Error("Invalid webhook source. Cart missing.");
    }
    return customerCartData.cart as CustomerCart;
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
  paymentFailureHandler = async (customer_id: string) => {
    await this.notificationService.createNotification(
      customer_id,
      "Payment Failed",
      "Your payment has failed",
      undefined
    );
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
