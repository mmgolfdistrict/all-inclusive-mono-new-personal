import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, eq, not } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { donations } from "@golf-district/database/schema/donations";
import { entities } from "@golf-district/database/schema/entities";
import { lists } from "@golf-district/database/schema/lists";
import { promoCodes } from "@golf-district/database/schema/promoCodes";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { transfers } from "@golf-district/database/schema/transfers";
import type { InsertTransfer } from "@golf-district/database/schema/transfers";
import { userPromoCodeLink } from "@golf-district/database/schema/userPromoCodeLink";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { Client } from "@upstash/qstash/.";
import dayjs from "dayjs";
import { B } from "vitest/dist/reporters-5f784f42";
import type { BookingService } from "../booking/booking.service";
import type {
  AuctionProduct,
  CharityProduct,
  ConvenienceFeeProduct,
  CustomerCart,
  FirstHandProduct,
  MarkupProduct,
  Offer,
  ProductData,
  SecondHandProduct,
  SensibleProduct,
  TaxProduct,
} from "../checkout/types";
import type { NotificationService } from "../notification/notification.service";
import type { SensibleService } from "../sensible/sensible.service";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { BookingResponse } from "../tee-sheet-provider/sheet-providers/types/foreup.type";
import { BookingCreationData } from "../tee-sheet-provider/sheet-providers/types/foreup.type";
import type { TokenizeService } from "../token/tokenize.service";
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
    private readonly sensibleService: SensibleService,
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
   * @throws {Error} - Throws an error if the event type is unhandled.f
   *
   * @example
   * ```typescript
   * const webhook = { event_type: "payment_succeeded", ... };
   * hyperSwitchWebhookService.processWebhook(webhook);
   * ```
   */
  processWebhook = async (req: HyperSwitchEvent) => {
    // req = {
    //   merchant_id: "merchant_1696865645",
    //   event_id: "evt_018e5b62dc537401aa556bc43defb805",
    //   event_type: "payment_succeeded",
    //   content: {
    //     type: "payment_details",
    //     object: {
    //       payment_id: "pay_PSTxnkeBFyANU1DuS2QM",
    //       merchant_id: "merchant_1696865645",
    //       status: "succeeded",
    //       amount: 9000,
    //       net_amount: 9000,
    //       amount_capturable: 0,
    //       amount_received: 9000,
    //       connector: "stripe_test",
    //       client_secret: "pay_PSTxnkeBFyANU1DuS2QM_secret_TfIKtmUJBDmZaOBlrzJz",
    //       created: "2024-03-20T10:22:57.155Z",
    //       currency: "USD",
    //       customer_id: "292531e6-4c20-4705-a35d-4e71a3679467",
    //       description: null,
    //       refunds: null,
    //       disputes: null,
    //       mandate_id: null,
    //       mandate_data: null,
    //       setup_future_usage: null,
    //       off_session: null,
    //       capture_on: null,
    //       capture_method: null,
    //       payment_method: "card",
    //       payment_method_data: {
    //         card: {
    //           last4: "4242",
    //           card_type: "CREDIT",
    //           card_network: "Visa",
    //           card_issuer: "STRIPE PAYMENTS UK LIMITED",
    //           card_issuing_country: "UNITEDKINGDOM",
    //           card_isin: "424242",
    //           card_extended_bin: "42424242",
    //           card_exp_month: "04",
    //           card_exp_year: "2029",
    //           card_holder_name: "",
    //         },
    //         billing: null,
    //       },
    //       payment_token: "token_xUMxXTHLBUDWqLtpGNP6",
    //       shipping: null,
    //       billing: {
    //         address: {
    //           city: "ny",
    //           country: "IN",
    //           line1: "new york",
    //           line2: "new york",
    //           line3: null,
    //           zip: "46204",
    //           state: "Andaman and Nicobar Islands",
    //           first_name: "superstar",
    //           last_name: "",
    //         },
    //         phone: null,
    //         email: null,
    //       },
    //       order_details: null,
    //       email: "tifeye2359@gexige.com",
    //       name: "robert kiosiki",
    //       phone: "9898989898",
    //       return_url:
    //         "http://localhost:3000/5df5581f-6e5c-49af-a360-a7c9fd733f22/checkout/confirmation?teeTimeId=3dae6df2-a76f-430f-9938-63f182b19008",
    //       authentication_type: "no_three_ds",
    //       statement_descriptor_name: null,
    //       statement_descriptor_suffix: null,
    //       next_action: null,
    //       cancellation_reason: null,
    //       error_code: null,
    //       error_message: null,
    //       unified_code: null,
    //       unified_message: null,
    //       payment_experience: null,
    //       payment_method_type: null,
    //       connector_label: null,
    //       business_country: null,
    //       business_label: null,
    //       business_sub_label: null,
    //       allowed_payment_method_types: null,
    //       ephemeral_key: null,
    //       manual_retry_allowed: false,
    //       connector_transaction_id: "dummy_pay_SMvZTkfPc8vNEWxKLYTJ",
    //       frm_message: null,
    //       metadata: "5df5581f-6e5c-49af-a360-a7c9fd733f22",
    //       connector_metadata: null,
    //       feature_metadata: null,
    //       reference_id: null,
    //       payment_link: null,
    //       profile_id: "pro_CIxMbY7icck1tMgCx15x",
    //       surcharge_details: null,
    //       attempt_count: 1,
    //       merchant_decision: null,
    //       merchant_connector_id: "mca_mDVWcIgwz7kQNRcc1U7F",
    //       incremental_authorization_allowed: null,
    //       authorization_count: null,
    //       incremental_authorizations: null,
    //       external_authentication_details: null,
    //       external_3ds_authentication_attempted: null,
    //       expires_on: "2024-03-20T10:37:57.155Z",
    //       fingerprint: null,
    //       payment_method_id: "e027c5e7-8a38-49f2-ae00-85ea3e42ec53",
    //       payment_method_status: "active",
    //     },
    //   },
    //   timestamp: "2024-03-20T10:23:09.396Z",
    // };

    this.logger.info(`Processing webhook: ${req.event_id}`);
    const paymentId = req.content.object.payment_id;
    const amountReceived = req.content.object.amount_received;
    const customer_id = req.content.object.customer_id;
    if (!customer_id) throw new Error("Customer id not found");
    if (!paymentId) throw new Error("Payment id not found");
    if (!amountReceived) throw new Error("Amount received not found");
    const customerCart = await this.getCustomerCartData(paymentId);
    if (customerCart.promoCode) await this.usePromoCode(customerCart.promoCode, customer_id);
    // console.log(JSON.stringify(customerCart));
    //@TODO validate payment amount

    switch (req.event_type) {
      case "payment_succeeded":
        return this.paymentSuccessHandler(customerCart, amountReceived, paymentId, customer_id);
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
    if (!promoCodeData?.id) return;
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

  paymentSuccessHandler = async (
    customerCart: CustomerCart,
    amountReceived: number,
    paymentId: string,
    customer_id: string
  ) => {
    // const customer_id: string = customerCart.customerId;
    const isFirstHandBooking = customerCart.cart.some(
      (item) => item.product_data.metadata.type === "first_hand"
    );
    if (isFirstHandBooking) {
      await this.bookingService.confirmBooking(paymentId, customer_id);
      const weatherGuaranteeData = customerCart.cart.filter(
        (item) => item.product_data.metadata.type === "sensible"
      );
      if(weatherGuaranteeData.length){
        await this.handleSensibleItem(weatherGuaranteeData[0] as SensibleProduct, amountReceived, customer_id, customerCart);
      }
      return;
    }
    for (const item of customerCart.cart) {
      switch (item.product_data.metadata.type) {
        case "second_hand":
          await this.handleSecondHandItem(item as SecondHandProduct, amountReceived, customer_id, paymentId);
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
          await this.handleSensibleItem(item as SensibleProduct, amountReceived, customer_id, customerCart);
          break;
        case "taxes": //taxes is handled last
          await this.handleTaxItem(item as TaxProduct, amountReceived, customer_id);
          break;
        case "convenience_fee": //convenience is handled last
          await this.handleConvenienceFeeItem(item as ConvenienceFeeProduct, amountReceived, customer_id);
          break;
        case "markup": //markup is handled last
          await this.handleMarkupItem(item as MarkupProduct, amountReceived, customer_id);
          break;
      }
    }
  };
  handleFirstHandItem = async (
    item: FirstHandProduct,
    amountReceived: number,
    customer_id: string,
    paymentId: string
  ) => {
    const [teeTime] = await this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        entityId: teeTimes.entityId,
        date: teeTimes.date,
        providerCourseId: providerCourseLink.providerCourseId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        providerId: teeTimes.soldByProvider,
        internalId: providers.internalId,
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
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
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
    const providerCustomer = await this.providerService.findOrCreateCustomer(
      teeTime.courseId,
      teeTime.providerId,
      teeTime.providerCourseId!,
      customer_id,
      provider,
      token
    );
    if (!providerCustomer?.playerNumber) {
      this.logger.error(`Error creating customer`);
      throw new Error(`Error creating customer`);
    }

    //purchased from provider
    const pricePerBooking = amountReceived / item.product_data.metadata.number_of_bookings / 100;

    //create a provider booking for each player
    const bookedPLayers: { accountNumber: number }[] = [
      {
        accountNumber: providerCustomer.playerNumber,
      },
    ];

    const booking = await provider
      .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, {
        data: {
          type: "bookings",
          attributes: {
            start: teeTime.providerDate,
            holes: teeTime.holes,
            players: item.product_data.metadata.number_of_bookings,
            bookedPlayers: bookedPLayers,
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
    //create tokenized bookings
    await this.tokenizeService
      .tokenizeBooking(
        customer_id,
        pricePerBooking,
        item.product_data.metadata.number_of_bookings,
        booking.data.id,
        item.product_data.metadata.tee_time_id,
        paymentId,
        true,
        provider,
        token,
        teeTime
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

  getCartData = async ({ courseId = "", ownerId = "", paymentId = "" }) => {
    const [customerCartData]: any = await this.database
      .select({ cart: customerCarts.cart, cartId: customerCarts.id })
      .from(customerCarts)
      .where(
        and(
          eq(customerCarts.courseId, courseId),
          eq(customerCarts.userId, ownerId),
          eq(customerCarts.paymentId, paymentId)
        )
      )
      .execute();

    const primaryGreenFeeCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "first_hand")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const convenienceCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "convenience_fee")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const taxCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "taxes")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const sensibleCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "sensible")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const charityCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "charity")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const charityId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "charity"
    )?.product_data.metadata.charity_id;

    const weatherQuoteId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "sensible"
    )?.product_data.metadata.sensible_quote_id;

    const taxes = taxCharge + sensibleCharge + charityCharge + convenienceCharge;

    const total = customerCartData?.cart?.cart
      .filter(({ product_data }: ProductData) => product_data.metadata.type !== "markup")
      .reduce((acc: number, i: any) => {
        return acc + i.price;
      }, 0);

    console.log(
      "@@@@",
      primaryGreenFeeCharge,
      taxCharge,
      sensibleCharge,
      charityCharge,
      convenienceCharge,
      total
    );

    return {
      primaryGreenFeeCharge,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      taxes,
      total,
      cartId: customerCartData?.cartId,
      charityId,
      weatherQuoteId,
    };
  };

  handleSecondHandItem = async (
    item: SecondHandProduct,
    amountReceived: number,
    customer_id: string,
    paymentId: string
  ) => {
    const listingId = item.product_data.metadata.second_hand_id;

    const listedSlots = await this.database
      .select({
        listedSlotsCount: lists.slots,
        listedPrice: lists.listPrice,
      })
      .from(lists)
      .where(eq(lists.id, listingId))
      .execute();

    const listedSlotsCount: number | undefined = listedSlots?.length ? listedSlots[0]?.listedSlotsCount : 0;
    const listPrice: number | undefined = listedSlots?.length ? listedSlots[0]?.listedPrice : 0;

    const listedBooking = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        courseId: teeTimes.courseId,
        providerBookingId: bookings.providerBookingId,
        providerId: teeTimes.soldByProvider,
        providerCourseId: providerCourseLink.providerCourseId,
        providerDate: teeTimes.providerDate,
        internalId: providers.internalId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        teeTimeId: bookings.teeTimeId,
        slotId: bookingslots.slotnumber,
        time: teeTimes.time,
        numberOfHoles: bookings.numberOfHoles,
        includesCart: bookings.includesCart,
        entityId: teeTimes.entityId,
        purchasedPrice: bookings.purchasedPrice,
        weatherGuaranteeId: bookings.weatherGuaranteeId,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        listId: bookings.listId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(bookingslots, eq(bookings.id, bookingslots.bookingId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, teeTimes.soldByProvider)
        )
      )
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(bookings.listId, listingId))
      .execute();

    if (listedBooking.length === 0) {
      this.logger.fatal(`no bookings found for listing id: ${listingId}`);
      throw new Error(`Error finding bookings for listing id`);
    }
    const firstBooking = listedBooking[0];
    if (!firstBooking) {
      throw new Error(`Error finding first booking for listing id`);
    }

    const { provider, token } = await this.providerService.getProviderAndKey(
      firstBooking.internalId!,
      firstBooking.courseId ?? ""
    );

    const buyerCustomer = await this.providerService.findOrCreateCustomer(
      firstBooking.courseId ?? "",
      firstBooking.providerId!,
      firstBooking.providerCourseId!,
      customer_id,
      provider,
      token
    );

    if (!buyerCustomer?.playerNumber) {
      this.logger.error(`Error creating or finding customer`);
      throw new Error(`Error creating or finding customer`);
    }

    const sellerCustomer = await this.providerService.findOrCreateCustomer(
      firstBooking.courseId ?? "",
      firstBooking.providerId!,
      firstBooking.providerCourseId!,
      firstBooking.ownerId,
      provider,
      token
    );

    if (!sellerCustomer?.playerNumber) {
      this.logger.error(`Error creating or finding customer`);
      throw new Error(`Error creating or finding customer`);
    }

    try {
      await provider
        .deleteBooking(
          token,
          firstBooking.providerCourseId!,
          firstBooking.providerTeeSheetId!,
          firstBooking.providerBookingId
        )
        .catch((err) => {
          this.logger.error(`Error deleting booking: ${err}`);
          throw new Error(`Error deleting booking`);
        });

      // disable on our db
      await this.database
        .update(bookings)
        .set({
          isActive: false,
          isListed: false,
        })
        .where(eq(bookings.providerBookingId, firstBooking.providerBookingId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error deleting booking: ${err}`);
          throw new Error(`Error deleting booking`);
        });
    } catch (err) {
      this.logger.error(`Error deleting booking: ${err}`);
    }

    await this.database
      .update(lists)
      .set({
        isDeleted: true,
      })
      .where(eq(lists.id, firstBooking.listId ?? ""))
      .execute();

    const newBookings: BookingResponse[] = [];

    try {
      const newBooking = await provider.createBooking(
        token,
        firstBooking.providerCourseId!,
        firstBooking.providerTeeSheetId!,
        {
          data: {
            type: "bookings",
            attributes: {
              start: firstBooking.providerDate,
              holes: firstBooking.numberOfHoles,
              players: listedSlotsCount,
              bookedPlayers: [
                {
                  personId: buyerCustomer.customerId,
                },
              ],
              event_type: "tee_time",
              details: "GD Booking",
            },
          },
        }
      );
      newBooking.data.purchasedFor = amountReceived / (listedSlotsCount || 1) / 100;
      newBooking.data.ownerId = customer_id;
      newBooking.data.name = buyerCustomer.name || "";
      newBooking.data.bookingType = "FIRST";
      newBookings.push(newBooking);

      if (listedSlotsCount && listedSlotsCount < listedBooking.length) {
        const newBookingSecond = await provider.createBooking(
          token,
          firstBooking.providerCourseId!,
          firstBooking.providerTeeSheetId!,
          {
            data: {
              type: "bookings",
              attributes: {
                start: firstBooking.providerDate,
                holes: firstBooking.numberOfHoles,
                players: listedBooking.length - listedSlotsCount,
                bookedPlayers: [
                  {
                    personId: sellerCustomer.customerId,
                  },
                ],
                event_type: "tee_time",
                details: "GD Booking",
              },
            },
          }
        );
        newBookingSecond.data.ownerId = firstBooking.ownerId;
        newBookingSecond.data.purchasedFor = firstBooking.purchasedPrice;
        newBooking.data.weatherGuaranteeId = firstBooking.weatherGuaranteeId || "";
        newBooking.data.weatherGuaranteeAmount = firstBooking.weatherGuaranteeAmount || 0;
        newBookingSecond.data.bookingType = "SECOND";
        newBookingSecond.data.name = sellerCustomer.name || "";
        newBookings.push(newBookingSecond);
      }
    } catch (err) {
      this.logger.error(`Error creating booking: ${err}`);
    }

    if (!newBookings.length) {
      this.logger.error(`Error creating booking`);
      return;
    }

    const [existingTeeTime] = await this.database
      .select({
        id: teeTimes.id,
        entityId: teeTimes.entityId,
        date: teeTimes.date,
        courseId: teeTimes.courseId,
        numberOfHoles: teeTimes.numberOfHoles,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFee,
        courseName: courses.name,
        entityName: entities.name,
        cdn: assets.cdn,
        cdnKey: assets.key,
        extension: assets.extension,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
      })
      .from(teeTimes)
      .where(eq(teeTimes.id, firstBooking.teeTimeId))
      .leftJoin(entities, eq(teeTimes.entityId, entities.id))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        return [];
      });

    const { taxes, sensibleCharge, charityCharge, total, cartId, charityId, weatherQuoteId } =
      await this.getCartData({
        courseId: existingTeeTime?.courseId,
        ownerId: customer_id,
        paymentId,
      });

    for (const booking of newBookings) {
      const newBooking = booking;
      const bookingsToCreate: InsertBooking[] = [];
      const transfersToCreate: InsertTransfer[] = [];
      const bookingId = randomUUID();
      bookingsToCreate.push({
        id: bookingId,
        purchasedAt: currentUtcTimestamp(),
        purchasedPrice: newBooking?.data.purchasedFor || 0,
        providerBookingId: newBooking?.data.id || "",
        isListed: false,
        numberOfHoles: firstBooking.numberOfHoles,
        minimumOfferPrice: 0,
        ownerId: booking.data.ownerId || "",
        // courseId: firstBooking.courseId??"",
        teeTimeId: firstBooking.teeTimeId,
        nameOnBooking: newBooking.data.name || "",
        includesCart: firstBooking.includesCart,
        listId: null,
        // entityId: firstBooking.entityId,
        weatherGuaranteeAmount: firstBooking.weatherGuaranteeAmount,
        weatherGuaranteeId: firstBooking.weatherGuaranteeId,
        cartId: cartId,
        playerCount: listedSlotsCount || 0,
        greenFeePerPlayers: listPrice && listedSlotsCount ? listPrice / listedSlotsCount : 0,
        taxesPerPlayer: (taxes / (listedSlotsCount || 0)) * 100 || 0,
        charityId: charityId || null,
        totalCharityAmount: charityCharge * 100 || 0,
        totalAmount: total * 100 || 0,
        providerPaymentId: paymentId,
        weatherQuoteId: weatherQuoteId || null,
      });

      const bookingSlots =
        (await provider?.getSlotIdsForBooking(
          bookingId,
          booking.data.attributes.playerCount,
          booking.data.ownerId || "",
          newBooking?.data?.id || "",
          provider.providerId,
          firstBooking.courseId ?? ""
        )) || [];

      for (let i = 0; i < bookingSlots.length; i++) {
        if (i != 0) {
          await provider?.updateTeeTime(
            token || "",
            firstBooking?.providerCourseId || "",
            firstBooking?.providerTeeSheetId || "",
            newBooking?.data?.id || "",
            {
              data: {
                type: "Guest",
                id: newBooking?.data?.id || "",
                attributes: {
                  type: "Guest",
                  name: "Guest",
                  paid: false,
                  cartPaid: false,
                  noShow: false,
                },
              },
            },
            bookingSlots[i]?.slotnumber
          );
        }
      }

      await this.database.transaction(async (tx) => {
        //create each booking
        await tx
          .insert(bookings)
          .values(bookingsToCreate)
          .execute()
          .catch((err) => {
            this.logger.error(err);
            tx.rollback();
          });
        await tx
          .insert(bookingslots)
          .values(bookingSlots)
          .execute()
          .catch((err) => {
            this.logger.error(err);
            tx.rollback();
          });
      });
      if (newBooking.data.bookingType === "FIRST") {
        transfersToCreate.push({
          id: randomUUID(),
          amount: listPrice || 0,
          bookingId: bookingId,
          transactionId: randomUUID(),
          fromUserId: firstBooking.ownerId || "",
          toUserId: newBooking.data.ownerId ?? "",
          courseId: firstBooking?.courseId ?? "",
          purchasedPrice: newBooking.data.purchasedFor ?? 0,
        });
        await this.database
          .insert(transfers)
          .values(transfersToCreate)
          .execute()
          .catch((err) => {
            this.logger.error(err);
          });
      }

      const commonTemplateData = {
        CourseLogoURL: `https://${existingTeeTime?.cdn}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
        CourseName: existingTeeTime?.courseName || "-",
        FacilityName: existingTeeTime?.entityName || "-",
        PlayDateTime: dayjs(existingTeeTime?.date).format("MM/DD/YYYY h:mm A") || "-",
        NumberOfHoles: existingTeeTime?.numberOfHoles,
        SellTeeTImeURL: `${process.env.APP_URL}/my-tee-box`,
        ManageTeeTimesURL: `${process.env.APP_URL}/my-tee-box`,
        GolfDistrictReservationID: bookingId,
        CourseReservationID: newBooking?.data.id,
      };

      const buyerFee = (existingTeeTime?.buyerFee ?? 1) / 100;
      const sellerFee = (existingTeeTime?.sellerFee ?? 1) / 100;

      if (newBooking.data.bookingType == "FIRST") {
        const template: any = {
          ...commonTemplateData,
          CustomerFirstName: buyerCustomer.name?.split(" ")[0],
          GreenFees:
            `$${(newBooking.data.purchasedFor ?? 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} / Golfer` || "-",
          TaxesAndOtherFees:
            `$${taxes.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` || "-",
          SensibleWeatherIncluded: sensibleCharge ? "Yes" : "No",
          PurchasedFrom: sellerCustomer.name,
        };

        await this.notificationService.createNotification(
          booking?.data.ownerId || "",
          "TeeTimes Purchased",
          "TeeTimes Purchased",
          existingTeeTime?.courseId,
          process.env.SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID ?? "d-82894b9885e54f98a810960373d80575",
          template
        );

        if (newBookings.length === 1) {
          if (firstBooking?.weatherGuaranteeId?.length) {
            await this.sensibleService.cancelGuarantee(firstBooking?.weatherGuaranteeId || "");
          }
          const lsPrice = listPrice ?? 0;
          const listedPrice = lsPrice + lsPrice * buyerFee;
          const totalTax = lsPrice * sellerFee;
          const templateSeller: any = {
            ...commonTemplateData,
            CustomerFirstName: sellerCustomer.name?.split(" ")[0],
            ListedPrice:
              `$${lsPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} / Golfer` || "-",
            TaxesAndOtherFees:
              `$${(totalTax * (listedSlotsCount ?? 1)).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}` || "-",
            Payout: (listedPrice - totalTax) * (listedSlotsCount || 1),
            PurchasedFrom: existingTeeTime?.courseName || "-",
          };
          await this.notificationService.createNotification(
            firstBooking.ownerId || "",
            "TeeTimes Sold",
            "TeeTimes Sold",
            existingTeeTime?.courseId,
            process.env.SENDGRID_TEE_TIMES_SOLD_TEMPLATE_ID || "d-bbadba3821cc49e38c01e84a2b0dad09",
            templateSeller
          );
        }
      } else {
        const lsPrice = listPrice ?? 0;
        const listedPrice = lsPrice + lsPrice * buyerFee;
        const totalTax = lsPrice * (buyerFee + sellerFee);
        const templateSeller: any = {
          ...commonTemplateData,
          SoldPlayers: listedSlotsCount,
          CustomerFirstName: sellerCustomer.name?.split(" ")[0],
          ListedPrice:
            `$${lsPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} / Golfer` || "-",
          TaxesAndOtherFees:
            `$${(totalTax * (listedSlotsCount ?? 1)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` || "-",
          Payout: (listedPrice - totalTax) * (listedSlotsCount || 1),
          SensibleWeatherIncluded: firstBooking.weatherGuaranteeId?.length ? "Yes" : "No",
          PurchasedFrom: existingTeeTime?.courseName || "-",
        };
        await this.notificationService.createNotification(
          firstBooking.ownerId || "",
          "TeeTimes Sold",
          "TeeTimes Sold",
          existingTeeTime?.courseId,
          process.env.SENDGRID_TEE_TIMES_SOLD_PARTIAL_TEMPLATE_ID || "d-ef59724fe9f74e80a3768028924ea456",
          templateSeller
        );
      }

      //fullbooking sold --second
      // listPrice;
      // tax: listPrice * 0.15;
      // payout: listPrice - tax;

      //partialbooking sold
    }

    // if (listedSlotsCount && listedSlotsCount === listedBooking.length) {
    //   try {
    //     const newBooking = newBookings[0];
    //     const bookingsToCreate: InsertBooking[] = [];
    //     const bookingId = randomUUID();

    //     bookingsToCreate.push({
    //       id: bookingId,
    //       purchasedAt: currentUtcTimestamp(),
    //       purchasedPrice: amountReceived,
    //       time: firstBooking.time,
    //       providerBookingId: newBooking?.data.id || "",
    //       withCart: firstBooking.withCart,
    //       isListed: false,
    //       numberOfHoles: firstBooking.numberOfHoles,
    //       minimumOfferPrice: 0,
    //       ownerId: customer_id,
    //       courseId: firstBooking.courseId,
    //       teeTimeId: firstBooking.id,
    //       nameOnBooking: buyerCustomer.name || "",
    //       includesCart: firstBooking.includesCart,
    //       listId: null,
    //       entityId: firstBooking.entityId,
    //     });

    //     const bookingSlots =
    //       (await provider?.getSlotIdsForBooking(
    //         bookingId,
    //         listedSlotsCount,
    //         customer_id,
    //         newBooking?.data?.id || "",
    //         provider.providerId,
    //         firstBooking.courseId
    //       )) || [];

    //     for (let i = 0; i < bookingSlots.length; i++) {
    //       if (i != 0) {
    //         await provider?.updateTeeTime(
    //           token || "",
    //           firstBooking?.providerCourseId || "",
    //           firstBooking?.providerTeeSheetId || "",
    //           newBooking?.data?.id || "",
    //           {
    //             data: {
    //               type: "Guest",
    //               id: newBooking?.data?.id || "",
    //               attributes: {
    //                 type: "Guest",
    //                 name: "Guest",
    //                 paid: false,
    //                 cartPaid: false,
    //                 noShow: false,
    //               },
    //             },
    //           },
    //           bookingSlots[i]?.slotnumber
    //         );
    //       }
    //     }
    //     await this.database.transaction(async (tx) => {
    //       //create each booking
    //       await tx
    //         .insert(bookings)
    //         .values(bookingsToCreate)
    //         .execute()
    //         .catch((err) => {
    //           this.logger.error(err);
    //           tx.rollback();
    //         });
    //       await tx
    //         .insert(bookingslots)
    //         .values(bookingSlots)
    //         .execute()
    //         .catch((err) => {
    //           this.logger.error(err);
    //           tx.rollback();
    //         });
    //     });

    //     // this.logger.debug(`Created new booking for buyer: ${newBooking.data.id}`);
    //   } catch (error) {
    //     this.logger.fatal(`Failed to create booking for buyer: ${error}`);
    //   }
    //   //create booking on foreup to create id
    // } else if (listedSlotsCount && listedSlotsCount < listedBooking.length) {

    // }

    // const listingId = item.product_data.metadata.second_hand_id;
    // const listedBooking = await this.database
    //   .select({
    //     id: bookings.id,
    //     ownerId: bookings.ownerId,
    //     courseId: bookings.courseId,
    //     providerBookingId: bookings.providerBookingId,
    //     providerId: teeTimes.soldByProvider,
    //     providerCourseId: providerCourseLink.providerCourseId,
    //     internalId: providerCourseLink.internalId,
    //     providerTeeSheetId: providerCourseLink.providerTeeSheetId,
    //     teeTimeId: bookings.teeTimeId,
    //   })
    //   .from(bookings)
    //   .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
    //   .leftJoin(
    //     providerCourseLink,
    //     and(
    //       eq(providerCourseLink.courseId, bookings.courseId),
    //       eq(providerCourseLink.providerId, teeTimes.soldByProvider)
    //     )
    //   )
    //   .where(eq(bookings.listId, listingId))
    //   .execute();

    // if (listedBooking.length === 0) {
    //   this.logger.fatal(`no bookings found for listing id: ${listingId}`);
    //   //@TODO refund user
    //   throw new Error(`Error finding bookings for listing id`);
    // }
    // const firstBooking = listedBooking[0];
    // if (!firstBooking) {
    //   throw new Error(`Error finding first booking for listing id`);
    // }
    // const unListedBookings = await this.database
    //   .select({ id: bookings.id })
    //   .from(bookings)
    //   .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
    //   .where(
    //     and(
    //       eq(bookings.ownerId, firstBooking.ownerId),
    //       eq(teeTimes.id, firstBooking.teeTimeId),
    //       eq(bookings.isListed, false)
    //     )
    //   )
    //   .execute()
    //   .catch((err) => {
    //     this.logger.error(err);
    //     throw new Error(`Error finding all owned bookings for listing id`);
    //   });
    // let newSellerBookingId: string | null = null;
    // const secondHandBookingProvider = await this.providerService.getProviderAndKey(
    //   firstBooking.internalId!,
    //   firstBooking.courseId
    // );
    // const buyerCustomer = await this.providerService.findOrCreateCustomer(
    //   firstBooking.courseId,
    //   firstBooking.providerId!,
    //   firstBooking.providerCourseId!,
    //   customer_id,
    //   secondHandBookingProvider.provider,
    //   secondHandBookingProvider.token
    // );
    // const sellerCustomer = await this.providerService.findOrCreateCustomer(
    //   firstBooking.courseId,
    //   firstBooking.providerId!,
    //   firstBooking.providerCourseId!,
    //   firstBooking.ownerId,
    //   secondHandBookingProvider.provider,
    //   secondHandBookingProvider.token
    // );
    // if (!sellerCustomer?.playerNumber) {
    //   this.logger.error(`Error creating or finding customer`);
    //   throw new Error(`Error creating or finding customer`);
    // }
    // const providerId = listedBooking.map((booking) => booking.providerBookingId);
    // const buyerBookedPlayers: { accountNumber: number }[] = [
    //   {
    //     accountNumber: buyerCustomer.playerNumber!,
    //   },
    // ];
    // for (let i = 0; i < listedBooking.length; i++) {
    //   buyerBookedPlayers.push({
    //     accountNumber: buyerCustomer.playerNumber!,
    //   });
    // }

    // const sellerBookedPlayers: { accountNumber: number }[] = [
    //   {
    //     accountNumber: sellerCustomer.playerNumber,
    //   },
    // ];
    // for (let i = 0; i < unListedBookings.length; i++) {
    //   sellerBookedPlayers.push({
    //     accountNumber: sellerCustomer.playerNumber,
    //   });
    // }
    // //delete existing booking
    // await secondHandBookingProvider.provider
    //   .deleteBooking(
    //     secondHandBookingProvider.token,
    //     firstBooking.providerCourseId!,
    //     firstBooking.providerTeeSheetId!,
    //     firstBooking.providerBookingId
    //   )
    //   .catch((err) => {
    //     this.logger.error(`Error deleting booking: ${err}`);
    //     throw new Error(`Error deleting booking`);
    //   });
    // //create new booking for buyer
    // const bookingIdMap: { golfDistrictId: string; providerId: string }[] = [];
    // const idToTransfer = listedBooking.map((booking) => booking.id);

    // try {
    //   const newBooking = await secondHandBookingProvider.provider.createBooking(
    //     secondHandBookingProvider.token,
    //     firstBooking.providerCourseId!,
    //     firstBooking.providerTeeSheetId!,
    //     {
    //       data: {
    //         type: "bookings",
    //         attributes: {
    //           players: buyerBookedPlayers.length,
    //           buyerBookedPlayers,
    //           event_type: "tee_time",
    //           details: "GD Booking",
    //         },
    //       },
    //     }
    //   );
    //   idToTransfer.forEach((id) => {
    //     bookingIdMap.push({ golfDistrictId: id, providerId: newBooking.data.id });
    //   });
    //   this.logger.debug(`Created new booking for buyer: ${newBooking.data.id}`);
    // } catch (error) {
    //   this.logger.fatal(`Failed to create booking for buyer: ${error}`);
    // }
    // //create new booking for seller if they still own bookings

    // if (unListedBookings.length > 0) {
    //   try {
    //     const newBooking = await secondHandBookingProvider.provider.createBooking(
    //       secondHandBookingProvider.token,
    //       firstBooking.providerCourseId!,
    //       firstBooking.providerTeeSheetId!,
    //       {
    //         data: {
    //           type: "bookings",
    //           attributes: {
    //             players: sellerBookedPlayers.length,
    //             sellerBookedPlayers,
    //             event_type: "tee_time",
    //             details: "GD Booking",
    //           },
    //         },
    //       }
    //     );
    //     newSellerBookingId = newBooking.data.id;
    //     unListedBookings.forEach((booking) => {
    //       bookingIdMap.push({ golfDistrictId: booking.id, providerId: newBooking.data.id });
    //     });
    //     console.log(`Created new booking for seller: ${newBooking.data.id}`);
    //   } catch (error) {
    //     console.error(`Failed to create booking for seller: ${error}`);
    //   }
    // }

    // //update booking ids for each booking
    // for (const { golfDistrictId, providerId } of bookingIdMap) {
    //   try {
    //     await this.database
    //       .update(bookings)
    //       .set({ providerBookingId: providerId })
    //       .where(eq(bookings.id, golfDistrictId))
    //       .execute();
    //     this.logger.info(`Updated booking ${golfDistrictId} with new provider ID ${providerId}`);
    //   } catch (error) {
    //     this.logger.error(
    //       `Failed to update booking ID ${golfDistrictId} with new provider ID ${providerId}: ${error}`
    //     );
    //   }
    // }
    // //transfer bookings to new owner

    // const price = amountReceived / idToTransfer.length / 100;
    // await this.tokenizeService.transferBookings(firstBooking.ownerId, idToTransfer, customer_id, price);
    // //delete listing
    // await this.database.transaction(async (trx) => {
    //   await trx
    //     .update(lists)
    //     .set({
    //       isDeleted: true,
    //     })
    //     .where(eq(lists.id, listingId))
    //     .execute()
    //     .catch((err) => {
    //       this.logger.error(`Error deleting listing: ${err}`);
    //       trx.rollback();
    //     });
    //   for (const booking of idToTransfer) {
    //     await trx
    //       .update(bookings)
    //       .set({
    //         isListed: false,
    //         listId: null,
    //       })
    //       .where(eq(bookings.id, booking))
    //       .execute()
    //       .catch((err) => {
    //         this.logger.error(`Error updating bookingId: ${booking}: ${err}`);
    //         trx.rollback();
    //       });
    //   }
    // });
    // //create message to give to update old owners balance
    // //@TODO create a constant for account hold wait time based on environment
    // //@TODO funds to user must be calculated sub fees
    // const accountHoldWait = 60 * 1000;
    // if (newSellerBookingId) {
    //   this.notificationService.createNotification(
    //     firstBooking.ownerId,
    //     "Listing Sold",
    //     `Your teetime has been sold for $${price} the funds will be withdrawable from your account in ${"1 min"}, your new booking id is: ${newSellerBookingId}`,
    //     firstBooking.courseId
    //   );
    // } else {
    //   this.notificationService.createNotification(
    //     firstBooking.ownerId,
    //     "Listing Sold",
    //     `Your teetime has been sold for $${price} the funds will be withdrawable from your account in ${"1 min"}`,
    //     firstBooking.courseId
    //   );
    // }

    // const res = await this.qStashClient.publishJSON({
    //   url: `https://golf-district-platform-git-foreup-int-solidity-frontend.vercel.app/api/balance`,
    //   method: "POST",
    //   body: {
    //     userId: firstBooking.ownerId,
    //     amount: price,
    //   },
    //   delay: 30, // 10 second processing delay @TODO update to 1 min
    //   retries: 3,
    // });
    // console.log(res);
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
    if (!courseCharity?.courseCharityId) {
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

  handleSensibleItem = async (
    item: SensibleProduct,
    amountReceived: number,
    customer_id: string,
    customerCart: CustomerCart
  ) => {
    // Logic for handling first-hand items
    try {
      const booking = await this.getBookingDetails(item.id);

      // const userDetails = await this.getUserDetails(customer_id);

      console.log(`Sensible Quote Id: ${item.product_data.metadata.sensible_quote_id}`);

      // const quote = await this.getSensibleQuote(item.product_data.metadata.sensible_quote_id);

      const acceptedQuote = await this.sensibleService.acceptQuote({
        quoteId: item.product_data.metadata.sensible_quote_id,
        price_charged: item.price / 100,
        reservation_id: booking.id,
        lang_locale: "en_US",
        user: {
          email: customerCart.email,
          name: customerCart.name,
          phone: customerCart.phone ? `+${customerCart.phone_country_code}${customerCart.phone}` : "",
        },
      });

      //Add guarantee details on bookings
      if (acceptedQuote) {
        await this.database
          .update(bookings)
          .set({
            weatherGuaranteeId: acceptedQuote.id,
            weatherGuaranteeAmount: acceptedQuote.price_charged * 100,
          })
          .where(eq(bookings.id, acceptedQuote.reservation_id));
      }
      return acceptedQuote;
    } catch (error) {
      this.logger.error("Error handling Sensible item:", error);
      throw new Error("Failed to handle Sensible item");
    }
  };

  getBookingDetails = async (bookingId: string) => {
    const [booking] = await this.database.select().from(bookings).where(eq(bookings.teeTimeId, bookingId));

    if (!booking) {
      throw new Error("Booking details not found");
    }
    return booking;
  };

  getUserDetails = async (userId: string) => {
    const [userDetails] = await this.database.select().from(users).where(eq(users.id, userId));

    if (!userDetails) {
      throw new Error("User details not found");
    }
    return userDetails;
  };

  getSensibleQuote = async (quoteId: string) => {
    const quote = await this.sensibleService.getQuoteById(quoteId);

    if (!quote) {
      throw new Error("Quote not found");
    }
    return quote;
  };

  handleMarkupItem = async (item: MarkupProduct, amountReceived: number, customer_id: string) => {
    // Logic for handling markup items
    // ...
  };

  handleConvenienceFeeItem = async (
    item: ConvenienceFeeProduct,
    amountReceived: number,
    customer_id: string
  ) => {
    // Logic for handling convenience fee items
    // ...
  };

  handleTaxItem = async (item: TaxProduct, amountReceived: number, customer_id: string) => {
    // Logic for handling tax items
    // ...
  };

  getCustomerCartData = async (paymentId: string) => {
    const [customerCartData] = await this.database
      .select({ cart: customerCarts.cart })
      .from(customerCarts)
      .where(eq(customerCarts.paymentId, paymentId))
      .execute();

    if (!customerCartData?.cart) {
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
