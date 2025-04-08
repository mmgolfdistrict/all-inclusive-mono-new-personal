/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, eq } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { courseContacts } from "@golf-district/database/schema/courseContacts";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { customerRecievable } from "@golf-district/database/schema/customerRecievable";
import { donations } from "@golf-district/database/schema/donations";
import { entities } from "@golf-district/database/schema/entities";
import { lists } from "@golf-district/database/schema/lists";
import { promoCodes } from "@golf-district/database/schema/promoCodes";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { transfers } from "@golf-district/database/schema/transfers";
import { userPromoCodeLink } from "@golf-district/database/schema/userPromoCodeLink";
import { users } from "@golf-district/database/schema/users";
import { formatMoney, formatTime } from "@golf-district/shared";
import createICS from "@golf-district/shared/createICS";
import type { Event } from "@golf-district/shared/createICS";
import Logger from "@golf-district/shared/src/logger";
import { Client } from "@upstash/qstash/.";
import dayjs from "dayjs";
import { appSettingService } from "../app-settings/initialized";
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
import type { HyperSwitchService } from "../payment-processor/hyperswitch.service";
import type { SensibleService } from "../sensible/sensible.service";
import type { Customer, ProviderService } from "../tee-sheet-provider/providers.service";
import type { BookingDetails, BookingResponse } from "../tee-sheet-provider/sheet-providers";
import type { ClubProphetBookingResponse } from "../tee-sheet-provider/sheet-providers/types/clubprophet.types";
import type { TokenizeService } from "../token/tokenize.service";
import { loggerService } from "./logging.service";
import type { HyperSwitchEvent } from "./types/hyperswitch";
import { groupBookings } from "@golf-district/database/schema/groupBooking";
import { splitPayments } from "@golf-district/database/schema/splitPayment";

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
  protected baseurl = process.env.FINIX_BASE_URL;
  protected username = process.env.FINIX_USERNAME;
  protected password = process.env.FINIX_PASSWORD;
  protected merchantId = process.env.FINIX_MERCHANT_ID;
  protected applicationId = process.env.FINIX_APPLICATION_ID;
  protected encodedCredentials = btoa(`${this.username}:${this.password}`);
  protected authorizationHeader = `Basic ${this.encodedCredentials}`;
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
    upStashClientToken: string,
    private readonly hyperSwitchService: HyperSwitchService,
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
    // const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    // console.log("processWebhook before waiting.");
    // console.log(req);
    // await delay(30 * 1000);
    // // setTimeout(async () => {
    // console.log("processWebhook after waiting");
    // console.log(req);
    // this.logger.info(`Processing webhook: ${req.event_id}`);
    // this.logger.info(JSON.stringify(req));
    // const eventType = req.event_type; //req.status; // req.event_type;
    // const paymentId = req.content.object.payment_id; // req.payment_id; // req.content.object.payment_id;
    // const amountReceived = req.content.object.amount_received; // req.amount_received; // req.content.object.amount_received;
    // const customer_id = req.content.object.customer_id; //req.customer_id; // req.content.object.customer_id;
    // console.log(`eventType: ${eventType}`);
    // console.log(`paymentId: ${paymentId}`);
    // console.log(`amountReceived: ${amountReceived}`);
    // console.log(`customer_id: ${customer_id}`);
    // if (!customer_id) throw new Error("Customer id not found");
    // if (!paymentId) throw new Error("Payment id not found");
    // if (!amountReceived) throw new Error("Amount received not found");
    // const customerCart = await this.getCustomerCartData(paymentId);
    // if (customerCart.promoCode) await this.usePromoCode(customerCart.promoCode, customer_id);
    // // console.log(JSON.stringify(customerCart));
    // //@TODO validate payment amount
    // switch (eventType) {
    //   case "payment_succeeded":
    //     // case "succeeded":
    //     return this.paymentSuccessHandler(customerCart, amountReceived, paymentId, customer_id);
    //   case "payment_failed":
    //     // case "failed":
    //     return this.paymentFailureHandler(customer_id);
    //   default:
    //     this.logger.warn(`Unhandled event type: ${eventType}`);
    //     throw new Error("Unhandled event type.");
    // }
    // }, 10000);
  };

  checkPaymentStatus = async (paymentId: string) => {
    const hyperswitchEndPoint = `${process.env.HYPERSWITCH_BASE_URL}/payments/${paymentId}`;
    const myHeaders = new Headers();
    myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY ?? "");
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
    };
    const response = await fetch(hyperswitchEndPoint, requestOptions);
    const paymentData = await response.json();
    if (paymentData.error) {
      return paymentData?.error?.type as string;
    }
    return { paymentStatus: paymentData.status, amountReceived: paymentData.amount_received };
  };

  processPayment = async (
    paymentId: string,
    customer_id: string,
    bookingId: string,
    redirectHref: string
  ) => {
    const { paymentStatus, amountReceived } = (await this.checkPaymentStatus(paymentId)) as {
      paymentStatus: string;
      amountReceived: number;
    };
    console.log("processing payment=======>", { paymentId, customer_id, bookingId });
    if (!paymentStatus) {
      this.logger.warn(`Payment status not available for paymentId: ${paymentId}`);
      await loggerService.errorLog({
        message: "PAYMENT STATUS NOT AVAILABLE",
        userId: "",
        url: "/webhooks/processPayment",
        userAgent: "",
        stackTrace: `Payment status not available for paymentId: ${paymentId}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: paymentId,
          customer_id: customer_id,
          bookingId: bookingId,
        }),
      });
      return;
      //throw new Error("Payment status not available");
    }
    if (paymentStatus === "invalid_request") {
      this.logger.warn(`Payment Id not is not valid`);
      await loggerService.errorLog({
        message: "PAYMENT ID NOT VALID",
        userId: "",
        url: "/webhooks/processPayment",
        userAgent: "",
        stackTrace: `Payment Id not is not valid`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: paymentId,
          customer_id: customer_id,
          bookingId: bookingId,
        }),
      });
      return;
      //throw new Error("Payment Id not is not valid");
    }
    if (!customer_id) {
      this.logger.warn(`Customer id not found`);
      await loggerService.errorLog({
        message: "CUSTOMER ID NOT FOUND",
        userId: "",
        url: "/webhooks/processPayment",
        userAgent: "",
        stackTrace: `Customer id not found`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: paymentId,
          customer_id: customer_id,
          bookingId: bookingId,
        }),
      });
      return;
      //throw new Error("Customer id not found");
    }
    const customerCart = await this.getCustomerCartData(paymentId);

    if (paymentStatus === "succeeded") {
      await this.paymentSuccessHandler(customerCart, amountReceived, paymentId, customer_id, redirectHref);
      return {
        status: "success",
        erroe: false,
      };
    } else if (paymentStatus === "failed" || paymentStatus === "expired") {
      await this.database
        .update(bookings)
        .set({
          status: "FAILED",
        })
        .where(eq(bookings.id, bookingId))
        .execute();
      const [booking] = await this.database
        .select({
          bookingId: bookings.id,
          providerBookingId: bookings.providerBookingId,
          courseId: courses.id,
          providerCourseId: providerCourseLink.providerCourseId,
          providerTeeSheetId: providerCourseLink.providerTeeSheetId,
          internalId: providers.internalId,
          weatherGuaranteeId: bookings.weatherGuaranteeId,
        })
        .from(bookings)
        .innerJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
        .innerJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(
          providerCourseLink,
          and(
            eq(providerCourseLink.courseId, teeTimes.courseId),
            eq(providerCourseLink.providerId, courses.providerId)
          )
        )
        .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
        .where(eq(bookings.id, bookingId))
        .execute();
      if (!booking) {
        this.logger.warn(`Booking not found`);
        await loggerService.errorLog({
          message: "BOOKING NOT FOUND",
          userId: "",
          url: "/webhooks/processPayment",
          userAgent: "",
          stackTrace: `Booking not found`,
          additionalDetailsJSON: JSON.stringify({
            paymentId: paymentId,
            customer_id: customer_id,
            bookingId: bookingId,
          }),
        });
        return;
        // throw new Error("Booking not found");
      }
      await loggerService.errorLog({
        message: `PAYMENT_FAILED_OR_EXPIRED`,
        userId: "",
        url: "/webhooks/processPayment",
        userAgent: "",
        stackTrace: `Payment failed or expired`,
        additionalDetailsJSON: JSON.stringify({
          paymentStatus: paymentStatus,
          paymentId: paymentId,
          customer_id: customer_id,
          bookingId: bookingId,
        }),
      });
      return this.paymentFailureHandler(
        customer_id,
        bookingId,
        booking?.internalId!,
        booking?.providerCourseId!,
        booking?.providerTeeSheetId!,
        booking?.providerBookingId,
        booking?.weatherGuaranteeId!
      );
    } else {
      this.logger.warn(`Something went wrong`);
      await loggerService.errorLog({
        message: paymentStatus,
        userId: "",
        url: "/webhooks/processPayment",
        userAgent: "",
        stackTrace: `Unknown payment status ${paymentStatus}`,
        additionalDetailsJSON: JSON.stringify({
          paymentStatus: paymentStatus,
          paymentId: paymentId,
          customer_id: customer_id,
          bookingId: bookingId,
        }),
      });
      return;
      //throw new Error("Something went wrong.");
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
    customer_id: string,
    redirectHref: string
  ) => {
    console.log("paymentSuccessHandler");
    console.log(customerCart);
    console.log(`amountReceived = ${amountReceived}, paymentId = ${paymentId}, customer_id = ${customer_id}`);

    // const customer_id: string = customerCart.customerId;
    const isFirstHandBooking = customerCart.cart.some(
      (item) => item.product_data.metadata.type === "first_hand"
    );
    const hasFirstHandGroupBookingItem = customerCart.cart.some(
      (item) => item.product_data.metadata.type === "first_hand_group"
    );
    const isFirstHandGroupBooking = hasFirstHandGroupBookingItem ? true : false;

    console.log(`isFirstHandBooking = ${isFirstHandBooking}`);
    if (isFirstHandBooking || isFirstHandGroupBooking) {
      await this.bookingService.confirmBooking(paymentId, customer_id);
      return;
    }

    console.log("Looping through cart");
    for (const item of customerCart.cart) {
      console.log(item);

      switch (item.product_data.metadata.type) {
        case "second_hand":
          await this.handleSecondHandItem(
            item as SecondHandProduct,
            amountReceived,
            customer_id,
            paymentId,
            item.price,
            redirectHref
          );
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
    paymentId: string,
    redirectHref: string
  ) => {
    // const [teeTime] = await this.database
    //   .select({
    //     id: teeTimes.id,
    //     courseId: teeTimes.courseId,
    //     // entityId: teeTimes.entityId,
    //     entityId: courses.entityId,
    //     date: teeTimes.date,
    //     providerCourseId: providerCourseLink.providerCourseId,
    //     providerTeeSheetId: providerCourseLink.providerTeeSheetId,
    //     providerId: providerCourseLink.providerId,
    //     internalId: providers.internalId,
    //     providerDate: teeTimes.providerDate,
    //     holes: teeTimes.numberOfHoles,
    //     providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
    //   })
    //   .from(teeTimes)
    //   .leftJoin(courses, eq(courses.id, teeTimes.courseId))
    //   .leftJoin(
    //     providerCourseLink,
    //     and(
    //       eq(providerCourseLink.courseId, teeTimes.courseId),
    //       eq(providerCourseLink.providerId, courses.providerId)
    //     )
    //   )
    //   .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
    //   .leftJoin(courses, eq(courses.id, teeTimes.courseId))
    //   .where(eq(teeTimes.id, item.product_data.metadata.tee_time_id))
    //   .execute()
    //   .catch((err) => {
    //     this.logger.error(err);
    //     loggerService.auditLog({
    //       id: randomUUID(),
    //       userId: customer_id,
    //       teeTimeId: item.product_data.metadata.tee_time_id,
    //       bookingId: "",
    //       listingId: "",
    //       courseId: teeTime?.courseId ?? "",
    //       eventId: "TEE_TIME_NOT_FOUND",
    //       json: err,
    //     });
    //     throw new Error(`Error finding tee time id`);
    //   });
    // if (!teeTime) {
    //   this.logger.fatal(`tee time not found id: ${item.product_data.metadata.tee_time_id}`);
    //   loggerService.auditLog({
    //     id: randomUUID(),
    //     userId: customer_id,
    //     teeTimeId: item.product_data.metadata.tee_time_id,
    //     bookingId: "",
    //     listingId: "",
    //     courseId: "",
    //     eventId: "TEE_TIME_NOT_FOUND",
    //     json: `tee time not found id: ${item.product_data.metadata.tee_time_id}`,
    //   });
    //   throw new Error(`Error finding tee time id`);
    // }
    // const { provider, token } = await this.providerService.getProviderAndKey(
    //   teeTime.internalId!,
    //   teeTime.courseId,
    //   teeTime.providerCourseConfiguration!
    // );
    // const providerCustomer = await this.providerService.findOrCreateCustomer(
    //   teeTime.courseId,
    //   teeTime.providerId ?? "",
    //   teeTime.providerCourseId!,
    //   customer_id,
    //   provider,
    //   token
    // );
    // if (!providerCustomer?.playerNumber) {
    //   this.logger.error(`Error creating customer`);
    //   loggerService.auditLog({
    //     id: randomUUID(),
    //     userId: customer_id,
    //     teeTimeId: item.product_data.metadata.tee_time_id,
    //     bookingId: "",
    //     listingId: "",
    //     courseId: teeTime?.courseId ?? "",
    //     eventId: "ERROR_CREATING_CUSTOMER",
    //     json: `Error creating customer`,
    //   });
    //   throw new Error(`Error creating customer`);
    // }
    // //purchased from provider
    // const pricePerBooking = amountReceived / item.product_data.metadata.number_of_bookings / 100;
    // //create a provider booking for each player
    // const bookedPLayers: { accountNumber: number }[] = [
    //   {
    //     accountNumber: providerCustomer.playerNumber,
    //   },
    // ];
    // //TODO: ADD taxes component on totalAmountPaid if this method comes in use and decrease markup fees
    // const booking = await provider
    //   .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, {
    //     // totalAmountPaid: amountReceived / 100,
    //     data: {
    //       type: "bookings",
    //       attributes: {
    //         start: teeTime.providerDate,
    //         holes: teeTime.holes,
    //         players: item.product_data.metadata.number_of_bookings,
    //         bookedPlayers: bookedPLayers,
    //         event_type: "tee_time",
    //         details: "GD Booking",
    //       },
    //     },
    //   })
    //   .catch((err) => {
    //     this.logger.error(err);
    //     //@TODO this email should be removed
    //     loggerService.auditLog({
    //       id: randomUUID(),
    //       userId: customer_id,
    //       teeTimeId: teeTime.id,
    //       bookingId: "",
    //       listingId: "",
    //       courseId: teeTime?.courseId ?? "",
    //       eventId: "TEE_TIME_BOOKING_FAILED",
    //       json: err,
    //     });
    //     this.notificationService.createNotification(
    //       customer_id,
    //       "Error creating booking",
    //       "An error occurred while creating booking with provider",
    //       teeTime.courseId
    //     );
    //     throw new Error(`Error creating booking`);
    //   });
    // let providerBookingId = "";
    // if (teeTime?.internalId === "fore-up" && "data" in booking) {
    //   providerBookingId = booking.data!.id;
    // }
    // if (teeTime?.internalId === "club-prophet" && "reservationId" in booking) {
    //   providerBookingId = booking.reservationId.toString();
    // }
    // //create tokenized bookings
    // await this.tokenizeService
    //   .tokenizeBooking({
    //     redirectHref,
    //     userId: customer_id,
    //     purchasePrice: pricePerBooking,
    //     players: item.product_data.metadata.number_of_bookings,
    //     providerBookingId,
    //     providerTeeTimeId: item.product_data.metadata.tee_time_id,
    //     paymentId,
    //     withCart: true,
    //     provider,
    //     token,
    //     teeTime,
    //   })
    //   .catch((err) => {
    //     this.logger.error(err);
    //     //@TODO this email should be removed
    //     this.notificationService.createNotification(
    //       customer_id,
    //       "Error creating booking",
    //       "An error occurred while creating booking with provider",
    //       teeTime.courseId
    //     );
    //     loggerService.auditLog({
    //       id: randomUUID(),
    //       userId: customer_id,
    //       teeTimeId: teeTime.id,
    //       bookingId: "",
    //       listingId: "",
    //       courseId: teeTime?.courseId ?? "",
    //       eventId: "TEE_TIME_BOOKING_FAILED",
    //       json: err,
    //     });
    //     throw new Error(`Error creating booking`);
    //   });
  };

  getCartData = async ({ courseId = "", ownerId = "", paymentId = "" }) => {
    const [customerCartData]: any = await this.database
      .select({ cart: customerCarts.cart, cartId: customerCarts.id })
      .from(customerCarts)
      .where(
        and(
          // eq(customerCarts.courseId, courseId),
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

  addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  addMinutes = (date: Date, minutes: number) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  };

  formatCurrentDateTime = (date: Date) => {
    const currentDate = date;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because months are zero-indexed
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    const milliseconds = String(currentDate.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  handleSecondHandItem = async (
    item: SecondHandProduct,
    amountReceived: number,
    customer_id: string,
    paymentId: string,
    golferPrice: number,
    redirectHref: string
  ) => {
    let bookingStage = "Intializing Second hand Booking";
    const listingId = item.product_data.metadata.second_hand_id;
    bookingStage = "Fetching listed slot details";
    const listedSlots = await this.database
      .select({
        listedSlotsCount: lists.slots,
        listedPrice: lists.listPrice,
        allowSplit: lists.allowSplit
      })
      .from(lists)
      .where(eq(lists.id, listingId))
      .execute();

    bookingStage = "Fetching old and new bookingId";
    const [bookingsIds]: any = await this.database
      .select({
        id: bookings.id,
        oldBookingId: transfers.fromBookingId,
        transferId: transfers.id,
        cart: customerCarts.cart,
        newBookingPlayers: bookings.playerCount
      })
      .from(customerCarts)
      .innerJoin(bookings, eq(bookings.cartId, customerCarts.id))
      .innerJoin(transfers, eq(transfers.bookingId, bookings.id))
      .where(eq(customerCarts.paymentId, paymentId))
      .execute()
      .catch((error) => {
        loggerService.auditLog({
          id: randomUUID(),
          userId: customer_id,
          teeTimeId: "",
          bookingId: "",
          listingId,
          courseId: "",
          eventId: "BOOKING_ID_NOT_FOUND",
          json: error,
        });
        throw new Error("error fetching old and new bookingId");
      });

    const [bookingDetails] = await this.database
      .select({
        additionalNoteFromCustomer: bookings.customerComment,
        needsRentals: bookings.needClubRental,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingsIds?.id ?? ""))
      .execute()
      .catch((error) => {
        loggerService.auditLog({
          id: randomUUID(),
          userId: customer_id,
          teeTimeId: "",
          bookingId: "",
          listingId,
          courseId: "",
          eventId: "BOOKING_ID_NOT_FOUND_FOR_ADDITIONAL_DATA",
          json: error,
        });
        throw new Error("error fetching additional data for new booking");
      });

    bookingStage = "Updating booking status on new Booking";
    await this.database
      .update(bookings)
      .set({
        status: "CONFIRMED",
      })
      .where(eq(bookings.id, bookingsIds?.id ?? ""))
      .execute()
      .catch((err) => {
        loggerService.auditLog({
          id: randomUUID(),
          userId: customer_id,
          teeTimeId: "",
          bookingId: bookingsIds?.id ?? "",
          listingId,
          courseId: bookingsIds?.cart?.courseId ?? "",
          eventId: "BOOKING_CONFIRMATION_ERROR",
          json: "Error confirming booking",
        });
        throw new Error(`Error confirming booking`);
      });

    bookingStage = "Updating booking status on old Booking";
    await this.database
      .update(bookings)
      .set({
        status: "CANCELLED",
        isActive: false,
        isListed: false,
      })
      .where(eq(bookings.id, bookingsIds?.oldBookingId ?? ""))
      .execute()
      .catch((err) => {
        loggerService.auditLog({
          id: randomUUID(),
          userId: customer_id,
          teeTimeId: "",
          bookingId: bookingsIds?.id ?? "",
          listingId,
          courseId: bookingsIds?.cart?.courseId ?? "",
          eventId: "BOOKING_CONFIRMATION_ERROR",
          json: err,
        });
        throw new Error(`Error cancelling old booking`);
      });

    loggerService.auditLog({
      id: randomUUID(),
      userId: customer_id,
      teeTimeId: "",
      bookingId: bookingsIds?.id ?? "",
      listingId,
      courseId: bookingsIds?.cart?.courseId ?? "",
      eventId: "BOOKING_STATUS_UPDATED",
      json: "Booking status updated",
    });

    bookingStage = "Updating listing status";
    await this.database
      .update(lists)
      .set({
        isDeleted: true,
      })
      .where(eq(lists.id, listingId))
      .execute();

    bookingStage = "Fetching listing details";
    const listedBooking = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        courseId: teeTimes.courseId,
        providerBookingId: bookings.providerBookingId,
        providerId: providerCourseLink.providerId,
        providerCourseId: providerCourseLink.providerCourseId,
        providerDate: teeTimes.providerDate,
        internalId: providers.internalId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        teeTimeId: bookings.teeTimeId,
        slotId: bookingslots.slotnumber,
        time: teeTimes.time,
        numberOfHoles: bookings.numberOfHoles,
        includesCart: bookings.includesCart,
        // entityId: teeTimes.entityId,
        entityId: courses.entityId,
        weatherGuaranteeId: bookings.weatherGuaranteeId,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        listId: bookings.listId,
        playerCount: bookings.playerCount,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        markupFees: bookings.markupFees,
        greenFeesPerPlayer: bookings.greenFeePerPlayer,
        charityCharge: bookings?.totalCharityAmount,
        charityId: bookings?.charityId,
        weatherQuoteId: bookings?.weatherQuoteId,
        cartId: bookings?.cartId,
        totalTaxesAmount: bookings.totalTaxesAmount,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
        nameOnBooking: bookings.nameOnBooking,
        cartFeePerPlayer: bookings.cartFeePerPlayer,
        additionalNoteFromCustomer: bookings.customerComment,
        needRentals: bookings.needClubRental,
        timezoneCorrection: courses.timezoneCorrection,
        groupId: bookings.groupId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(bookingslots, eq(bookings.id, bookingslots.bookingId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .leftJoin(groupBookings, eq(groupBookings.id, bookings.groupId))
      .where(eq(bookings.id, bookingsIds?.oldBookingId ?? ""))
      .execute();

    if (listedBooking.length === 0) {
      this.logger.fatal(`no bookings found for listing id: ${listingId}`);
      loggerService.auditLog({
        id: randomUUID(),
        userId: customer_id,
        teeTimeId: "",
        bookingId: bookingsIds?.id ?? "",
        listingId,
        courseId: bookingsIds?.cart?.courseId ?? "",
        eventId: "BOOKING_NOT_FOUND_FOR_LISTING",
        json: "Error finding bookings for listing id",
      });
      throw new Error(`Error finding bookings for listing id`);
    }
    const firstBooking = listedBooking[0];
    const listedSlotsCount: number | undefined = listedSlots?.length ? (listedSlots[0]?.allowSplit ? bookingsIds?.newBookingPlayers : listedSlots[0]?.listedSlotsCount) : 0;
    const listPrice: number | undefined = listedSlots?.length ? listedSlots[0]?.listedPrice : 0;

    if (!firstBooking) {
      throw new Error(`Error finding first booking for listing id`);
    }

    bookingStage = "Fetching provider and token";
    const { provider, token } = await this.providerService.getProviderAndKey(
      firstBooking.internalId!,
      firstBooking.courseId ?? "",
      firstBooking.providerCourseConfiguration!
    );
    bookingStage = "Finding or creating buyer customer";
    const buyerCustomer = await this.providerService.findOrCreateCustomer(
      firstBooking.courseId ?? "",
      firstBooking.providerId!,
      firstBooking.providerCourseId!,
      customer_id,
      provider,
      token
    );

    if (!buyerCustomer?.customerId || !buyerCustomer?.playerNumber) {
      this.logger.error(`Error creating or finding customer`);
      loggerService.errorLog({
        userId: customer_id,
        url: "/handleSecondHandItem",
        userAgent: "",
        message: "ERROR CREATING CUSTOMER",
        stackTrace: `Error creating customer on provider for userId ${customer_id}`,
        additionalDetailsJSON: "Error creating customer",
      });
      throw new Error(`Error creating or finding customer`);
    }

    bookingStage = "Finding or creating seller customer";
    const sellerCustomer = await this.providerService.findOrCreateCustomer(
      firstBooking.courseId ?? "",
      firstBooking.providerId!,
      firstBooking.providerCourseId!,
      firstBooking.ownerId,
      provider,
      token
    );

    if (!sellerCustomer.customerId || !sellerCustomer?.playerNumber) {
      this.logger.error(`Error creating or finding customer`);
      loggerService.errorLog({
        userId: firstBooking.ownerId,
        url: "/handleSecondHandItem",
        userAgent: "",
        message: "ERROR CREATING CUSTOMER",
        stackTrace: `Error creating customer on provider for userId ${firstBooking.ownerId}`,
        additionalDetailsJSON: "Error creating customer",
      });
      throw new Error(`Error creating or finding customer`);
    }

    bookingStage = "Deleting old booking";
    await provider
      .deleteBooking(
        token,
        firstBooking.providerCourseId!,
        firstBooking.providerTeeSheetId!,
        firstBooking.providerBookingId
      )
      .catch((err) => {
        this.logger.error(`Error deleting booking: ${err}`);
        loggerService.errorLog({
          userId: firstBooking.ownerId,
          url: "/handleSecondHandItem",
          userAgent: "",
          message: "ERROR DELETING BOOKING ON PROVIDER",
          stackTrace: `Error deleting booking on provider for provider booking Id ${firstBooking.providerBookingId}`,
          additionalDetailsJSON: JSON.stringify({ message: "Error Deleting Booking", ...firstBooking }),
        });
        throw new Error(`Error deleting booking`);
      });
    const newBookings: BookingResponse[] = [];
    bookingStage = "Fetching tee time details of old booking";
    const [existingTeeTime] = await this.database
      .select({
        id: teeTimes.id,
        // entityId: teeTimes.entityId,
        entityId: courses.entityId,
        date: teeTimes.date,
        courseId: teeTimes.courseId,
        numberOfHoles: teeTimes.numberOfHoles,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        courseName: courses.name,
        entityName: entities.name,
        cdnKey: assets.key,
        extension: assets.extension,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
        providerDate: teeTimes.providerDate,
        address: courses.address,
        websiteURL: courses.websiteURL,
        cartFeePerPlayer: teeTimes.cartFeePerPlayer,
        greenFeeTaxPerPlayer: teeTimes.greenFeeTaxPerPlayer,
        cartFeeTaxPerPlayer: teeTimes.cartFeeTaxPerPlayer,
        timezoneCorrection: courses.timezoneCorrection,
        cartFee: teeTimes.cartFeePerPlayer,
      })
      .from(teeTimes)
      .where(eq(teeTimes.id, firstBooking.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(entities, eq(courses.entityId, entities.id))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: customer_id,
          url: `/HyperSwitchWebhookService/handleSecondHandItem`,
          userAgent: "",
          message: "ERROR_GETTING_EXISTING_TEE_TIME",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            item,
            customer_id,
            paymentId,
          }),
        });
        return [];
      });
    bookingStage = "Getting Cart Data";
    const { taxes, sensibleCharge, charityCharge, taxCharge, total, cartId, charityId, weatherQuoteId } =
      await this.getCartData({
        courseId: existingTeeTime?.courseId,
        ownerId: customer_id,
        paymentId,
      });
    try {
      let details = await appSettingService.get("TEE_SHEET_BOOKING_MESSAGE");
      try {
        const isSensibleNoteAvailable = await appSettingService.get("SENSIBLE_NOTE_TO_TEE_SHEET");
        if (weatherQuoteId && isSensibleNoteAvailable) {
          details = `${details}: ${isSensibleNoteAvailable}`;
        }
      } catch (e) {
        console.log("ERROR in getting appsetting SENSIBLE_NOTE_TO_TEE_SHEET");
      }
      details = `${details}\n<br />\n${bookingDetails?.additionalNoteFromCustomer}`;
      let newBooking: BookingResponse | null = null;
      const greenFee = existingTeeTime?.greenFee ?? 0;
      const greenFeeTaxPerPlayer = existingTeeTime?.greenFeeTaxPerPlayer ?? 0;
      const cartFeePerPlayer = existingTeeTime?.cartFeePerPlayer ?? 0;
      const cartFeeTaxPerPlayer = existingTeeTime?.cartFeeTaxPerPlayer ?? 0;

      const totalAmount = (greenFee + greenFeeTaxPerPlayer + cartFeePerPlayer + cartFeeTaxPerPlayer) / 100;
      const totalAmountPaid = totalAmount * (listedSlotsCount ?? 1);

      try {
        let bookingData;
        bookingStage = "Getting booking creation data for buyer customer";
        bookingData = provider.getBookingCreationData({
          firstHandCharge: greenFee,
          markupCharge: 0,
          taxCharge,
          playerCount: listedSlotsCount ?? 1,
          holes: firstBooking.numberOfHoles,
          notes: details,
          teeTimeId: firstBooking.id,
          providerTeeTimeId: firstBooking.providerTeeTimeId ?? "",
          startTime: firstBooking.providerDate ?? "",
          greenFees: (existingTeeTime?.greenFee ?? 0) / 100,
          cartFees: (existingTeeTime?.cartFee ?? 0) / 100,
          providerCustomerId: buyerCustomer.customerId,
          providerAccountNumber: buyerCustomer.playerNumber,
          totalAmountPaid,
          name: buyerCustomer.name,
          email: buyerCustomer.email,
          phone: buyerCustomer.phone,
          providerCourseId: firstBooking.providerCourseId,
        });

        bookingStage = "Creating booking for buyer customer";
        newBooking = await provider.createBooking(
          token,
          firstBooking.providerCourseId!,
          firstBooking.providerTeeSheetId!,
          bookingData,
          customer_id
        );
        if (provider.shouldAddSaleData()) {
          try {
            bookingStage = "Adding sales data for buyer customer";
            const bookingsDetails: BookingDetails = {
              playerCount: listedSlotsCount ?? 1,
              providerCourseId: firstBooking.providerCourseId!,
              providerTeeSheetId: firstBooking.providerTeeSheetId!,
              totalAmountPaid: totalAmountPaid,
              token: token,
            };
            const addSalesOptions = provider.getSalesDataOptions(newBooking, bookingsDetails);
            await provider.addSalesData(addSalesOptions);
          } catch (error) {
            this.logger.error(`Error adding sales data, ${JSON.stringify(error)}`);
          }
        }
        if (bookingDetails?.additionalNoteFromCustomer || bookingDetails?.needsRentals) {
          const courseContactsList = await this.database
            .select({
              email: courseContacts.email,
              phone: courseContacts.phone1,
            })
            .from(courseContacts)
            .where(
              and(
                eq(courseContacts.courseId, existingTeeTime?.courseId || firstBooking.courseId || ""),
                eq(courseContacts.sendNotification, true)
              )
            )
            .execute()
            .catch((e) => {
              this.logger.error(e);
              loggerService.errorLog({
                userId: customer_id,
                url: `/HyperSwitchWebhookService/handleSecondHandItem`,
                userAgent: "",
                message: "ERROR_GETTING_COURSE_CONTACTS",
                stackTrace: `${e.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  item,
                  customer_id,
                  paymentId,
                }),
              });
              return [];
            });
          const [user] = await this.database.select().from(users).where(eq(users.id, customer_id)).execute();
          const emailList = courseContactsList.map((contact) => contact.email);
          if (emailList.length > 0) {
            await this.notificationService.sendEmailByTemplate(
              emailList,
              "Reservation Additional Request",
              process.env.SENDGRID_COURSE_CONTACT_NOTIFICATION_TEMPLATE_ID!,
              {
                EMail: user?.email ?? "",
                CustomerName: user?.name ?? "",
                NoteFromUser: bookingDetails?.additionalNoteFromCustomer || "-",
                NeedRentals: bookingDetails?.needsRentals ? "Yes" : "No",
                PlayDateTime: formatTime(
                  firstBooking.providerDate ?? "",
                  true,
                  firstBooking.timezoneCorrection ?? 0
                ),
                HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
                CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
              },
              []
            );
          }
        }
      } catch (e) {
        // await this.hyperSwitchService.refundPayment(paymentId);
        // loggerService.auditLog({
        //   id: randomUUID(),
        //   userId: customer_id,
        //   teeTimeId: existingTeeTime?.id ?? "",
        //   bookingId: bookingsIds?.id ?? "",
        //   listingId: listingId,
        //   courseId: existingTeeTime?.courseId,
        //   eventId: "REFUND_INITIATED",
        //   json: `{paymentId:${paymentId}}`,
        // });

        // loggerService.errorLog({
        //   userId: customer_id,
        //   url: "/handleSecondHandItem",
        //   userAgent: "",
        //   message: "TEE TIME BOOKING FAILED ON PROVIDER",
        //   stackTrace: `second hand booking at provider failed for teetime ${existingTeeTime?.id}`,
        //   additionalDetailsJSON: JSON.stringify(e),
        // });

        // const template = {
        //   CustomerFirstName: buyerCustomer?.username ?? "",
        //   CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
        //   CourseURL: existingTeeTime?.websiteURL || "",
        //   CourseName: existingTeeTime?.courseName || "-",
        //   FacilityName: existingTeeTime?.entityName || "-",
        //   PlayDateTime: formatTime(
        //     existingTeeTime?.providerDate ?? "",
        //     true,
        //     existingTeeTime?.timezoneCorrection ?? 0
        //   ),
        //   HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
        // };
        // await this.notificationService.createNotification(
        //   customer_id ?? "",
        //   "Refund Initiated",
        //   "Refund Initiated",
        //   existingTeeTime?.courseId,
        //   process.env.SENDGRID_REFUND_EMAIL_TEMPLATE_ID ?? "d-79ca4be6569940cdb19dd2b607c17221",
        //   template
        // );
        this.hyperSwitchService.sendEmailForBookingFailed(
          paymentId,
          existingTeeTime?.courseId!,
          "",
          weatherQuoteId,
          customer_id,
          bookingStage,
          existingTeeTime?.id ?? "",
          {
            courseName: existingTeeTime?.courseName ?? "",
            userName: buyerCustomer?.name ?? "",
            userEmail: buyerCustomer?.email ?? "",
            teeTimeDate: existingTeeTime?.providerDate ?? ""
          }
        );
        throw "Booking failed on provider";
      }
      if (!newBooking.data) {
        newBooking.data = {};
      }

      newBooking.data.purchasedFor = golferPrice / (listedSlotsCount || 1) / 100;
      newBooking.data.ownerId = customer_id;
      newBooking.data.name = buyerCustomer?.name || "";
      newBooking.data.bookingType = "FIRST";
      newBooking.data.playerCount = listedSlotsCount;
      newBookings.push(newBooking);
      if (listedSlotsCount && listedSlotsCount < firstBooking?.playerCount) {
        const totalAmountPaid = totalAmount * (listedBooking.length - listedSlotsCount);
        details = await appSettingService.get("TEE_SHEET_BOOKING_MESSAGE");
        details = `${details}\n<br />\n${firstBooking?.additionalNoteFromCustomer}`;
        let newBookingSecond;
        bookingStage = "Getting booking creation data for seller customer";
        const bookingData = provider.getBookingCreationData({
          firstHandCharge: greenFee,
          markupCharge: 0,
          taxCharge,
          playerCount: listedBooking.length - listedSlotsCount,
          holes: firstBooking.numberOfHoles,
          notes: details,
          teeTimeId: firstBooking.id,
          providerTeeTimeId: firstBooking.providerTeeTimeId ?? "",
          startTime: firstBooking.providerDate ?? "",
          greenFees: (existingTeeTime?.greenFee ?? 0) / 100,
          cartFees: (existingTeeTime?.cartFee ?? 0) / 100,
          providerCustomerId: sellerCustomer.customerId,
          providerAccountNumber: sellerCustomer.playerNumber,
          totalAmountPaid,
          name: sellerCustomer.name,
          email: sellerCustomer.email,
          phone: sellerCustomer.phone,
          providerCourseId: firstBooking.providerCourseId,
        });
        bookingStage = "Creating booking for seller customer";
        newBookingSecond = await provider.createBooking(
          token,
          firstBooking.providerCourseId!,
          firstBooking.providerTeeSheetId!,
          bookingData,
          firstBooking.ownerId
        );
        // }
        if (provider.shouldAddSaleData()) {
          bookingStage = "Adding sales data for seller customer";
          try {
            const bookingsDetails: BookingDetails = {
              playerCount: listedSlotsCount ?? 1,
              providerCourseId: firstBooking.providerCourseId!,
              providerTeeSheetId: firstBooking.providerTeeSheetId!,
              totalAmountPaid: totalAmountPaid,
              token: token,
            };
            const addSalesOptions = provider.getSalesDataOptions(newBookingSecond, bookingsDetails);
            await provider.addSalesData(addSalesOptions);
          } catch (error) {
            this.logger.error(`Error adding sales data, ${JSON.stringify(error)}`);
          }
        }
        if (!newBookingSecond.data) {
          newBookingSecond.data = {};
        }
        newBookingSecond.data.ownerId = firstBooking.ownerId;
        newBooking.data.weatherGuaranteeId = firstBooking.weatherGuaranteeId || "";
        newBooking.data.weatherGuaranteeAmount = firstBooking.weatherGuaranteeAmount || 0;
        newBookingSecond.data.bookingType = "SECOND";
        newBookingSecond.data.name = sellerCustomer.name || "";
        newBookingSecond.data.playerCount = listedBooking.length - listedSlotsCount;
        newBookings.push(newBookingSecond);
      }
    } catch (err) {
      this.logger.error(`Error creating booking: ${err}`);
      loggerService.errorLog({
        userId: customer_id,
        url: "/handleSecondHandItem",
        userAgent: "",
        message: "ERROR BOOKING TEE TIME",
        stackTrace: `Error booking tee time for tee time id ${existingTeeTime?.id}`,
        additionalDetailsJSON: JSON.stringify({ err, bookingStage }),
      });
    }

    const buyerFee = (existingTeeTime?.buyerFee ?? 1) / 100;
    const sellerFee = (existingTeeTime?.sellerFee ?? 1) / 100;
    let sellerWeatherGuaranteeAmount = 0;
    for (const booking of newBookings) {
      const newBooking = booking;
      const bookingsToCreate: InsertBooking[] = [];
      const providerBookingId = provider.getBookingId(booking);
      const playerCount = provider.getPlayerCount(booking);
      const bookingId = newBooking.data?.bookingType === "FIRST" ? bookingsIds?.id ?? "" : randomUUID();
      const totalAmount =
        firstBooking?.greenFeesPerPlayer * (firstBooking.playerCount - (listedSlotsCount ?? 0)) +
        (firstBooking?.weatherGuaranteeAmount ?? 0) +
        firstBooking?.charityCharge;
      if (!providerBookingId) {
        this.logger.error("Booking failed on provider, Can't find provider booking id");
        await loggerService.errorLog({
          userId: customer_id,
          url: "/handleSecondHandItem",
          userAgent: "",
          message: "ERROR BOOKING TEE TIME",
          stackTrace: `Error booking tee time for tee time id ${existingTeeTime?.id}`,
          additionalDetailsJSON: JSON.stringify({
            providerBookingId: providerBookingId,
            bookingsIds: bookingsIds,
          }),
        });
        throw new Error("Booking failed on provider, Can't find provider booking id");
      }
      if (newBooking.data?.bookingType === "SECOND") {
        bookingsToCreate.push({
          id: bookingId,
          // purchasedAt: currentUtcTimestamp(),
          providerBookingId: providerBookingId,
          isListed: false,
          numberOfHoles: firstBooking.numberOfHoles,
          minimumOfferPrice: 0,
          ownerId: booking.data?.ownerId || "",
          // courseId: firstBooking.courseId??"",
          teeTimeId: firstBooking.teeTimeId,
          nameOnBooking: newBooking.data.name || firstBooking.nameOnBooking || "",
          includesCart: firstBooking.includesCart,
          listId: null,
          // entityId: firstBooking.entityId,
          cartId: firstBooking.cartId,
          playerCount: firstBooking.playerCount - (listedSlotsCount ?? 0),
          greenFeePerPlayer: firstBooking.greenFeesPerPlayer ?? 1 * 100,
          totalTaxesAmount: firstBooking.totalTaxesAmount,
          charityId: firstBooking.charityId || null,
          totalCharityAmount: firstBooking?.charityCharge,
          totalAmount: totalAmount || 0,
          providerPaymentId: "",
          status: "CONFIRMED",
          markupFees: firstBooking.markupFees,
          weatherQuoteId: firstBooking.weatherQuoteId || null,
          cartFeePerPlayer: firstBooking.cartFeePerPlayer,
          customerComment: firstBooking.additionalNoteFromCustomer,
          needClubRental: firstBooking.needRentals,
        });
      }

      if (newBooking.data?.bookingType === "FIRST") {
        await this.database
          .update(bookings)
          .set({
            providerBookingId: providerBookingId,
          })
          .where(eq(bookings.id, bookingId))
          .execute()
          .catch((err) => {
            this.logger.error(err);
            loggerService.errorLog({
              userId: customer_id,
              url: `/HyperSwitchWebhookService/handleSecondHandItem`,
              userAgent: "",
              message: "ERROR_UPDATING_BOOKING_FOR_TEE_TIME",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                bookingId,
                providerBookingId,
              }),
            });
          });
      }

      let providerBookingIds: string[] = [];
      providerBookingIds = provider?.getSlotIdsFromBooking(newBooking);
      const bookingSlots =
        (await provider?.getSlotIdsForBooking(
          bookingId,
          playerCount,
          booking.data?.ownerId || "",
          providerBookingIds?.length ? providerBookingIds : providerBookingId,
          provider.providerId,
          firstBooking.courseId ?? "",
          providerBookingIds
        )) || [];

      if (provider.requireToCreatePlayerSlots()) {
        for (let i = 0; i < bookingSlots.length; i++) {
          if (i != 0) {
            await provider?.updateTeeTime(
              token || "",
              firstBooking?.providerCourseId || "",
              firstBooking?.providerTeeSheetId || "",
              providerBookingId || "",
              {
                data: {
                  type: "Guest",
                  id: providerBookingId || "",
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
      }
      if (bookingsToCreate.length) {
        await this.database.transaction(async (tx) => {
          //create each booking
          await tx
            .insert(bookings)
            .values(bookingsToCreate)
            .execute()
            .catch((err) => {
              this.logger.error(err);
              loggerService.errorLog({
                userId: customer_id,
                url: `/HyperSwitchWebhookService/handleSecondHandItem`,
                userAgent: "",
                message: "ERROR_CREATING_BOOKING_FOR_TEE_TIME",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingsToCreate,
                }),
              });
              tx.rollback();
            });
          await tx
            .insert(bookingslots)
            .values(bookingSlots)
            .execute()
            .catch((err) => {
              this.logger.error(err);
              loggerService.errorLog({
                userId: customer_id,
                url: `/HyperSwitchWebhookService/handleSecondHandItem`,
                userAgent: "",
                message: "ERROR_CREATING_BOOKING_SLOT_FOR_TEE_TIME",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingSlots,
                }),
              });
              tx.rollback();
            });
        });
      } else {
        await this.database.transaction(async (tx) => {
          //create each booking
          await tx
            .insert(bookingslots)
            .values(bookingSlots)
            .execute()
            .catch((err) => {
              this.logger.error(err);
              loggerService.errorLog({
                userId: customer_id,
                url: `/HyperSwitchWebhookService/handleSecondHandItem`,
                userAgent: "",
                message: "ERROR_CREATING_BOOKING_SLOT_FOR_TEE_TIME",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingSlots,
                }),
              });
              tx.rollback();
            });
        });
      }

      loggerService.auditLog({
        userId: customer_id,
        teeTimeId: existingTeeTime?.id ?? "",
        bookingId,
        listingId: "",
        courseId: existingTeeTime?.courseId ?? "",
        eventId: "TEE_TIME_PURCHASED",
        json: "Tee time purchased",
      });

      const event: Event = {
        startDate: existingTeeTime?.date ?? "",
        endDate: existingTeeTime?.date ?? "",
        email: buyerCustomer?.email ?? "",
        address: existingTeeTime?.address ?? "",
        name: existingTeeTime?.courseName,
        reservationId: bookingId,
        courseReservation: providerBookingId || "",
        numberOfPlayer: (listedSlotsCount ?? 1).toString(),
        playTime: this.extractTime(
          formatTime(existingTeeTime?.providerDate ?? "", true, existingTeeTime?.timezoneCorrection ?? 0)
        ),
      };
      const icsContent: string = createICS(event);

      const commonTemplateData = {
        CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
        CourseURL: existingTeeTime?.websiteURL || "",
        HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
        CourseName: existingTeeTime?.courseName || "-",
        FacilityName: existingTeeTime?.entityName || "-",
        PlayDateTime: formatTime(
          existingTeeTime?.providerDate ?? "",
          true,
          existingTeeTime?.timezoneCorrection ?? 0
        ),
        NumberOfHoles: existingTeeTime?.numberOfHoles,
        SellTeeTImeURL: `${redirectHref}/my-tee-box`,
        ManageTeeTimesURL: `${redirectHref}/my-tee-box`,
        // GolfDistrictReservationID: bookingId,
        CourseReservationID: providerBookingId,
      };
      if (newBooking.data?.bookingType == "FIRST") {
        const template: any = {
          ...commonTemplateData,
          CustomerFirstName: buyerCustomer?.name?.split(" ")[0],
          GreenFeesPerPlayer:
            `$${(newBooking.data.purchasedFor ?? 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} / Golfer` || "-",
          GreenFees:
            `$${((newBooking.data.purchasedFor ?? 0) * (listedSlotsCount ?? 0)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` || "-",
          TaxesAndOtherFees:
            `$${taxes.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` || "-",
          SensibleWeatherIncluded: sensibleCharge ? "Yes" : "No",
          PurchasedFrom: sellerCustomer?.username,
          PlayerCount: listedSlotsCount ?? 0,
          TotalAmount: formatMoney(total / 100),
          SellTeeTImeURL: `${redirectHref}/my-tee-box`,
          ManageTeeTimesURL: `${redirectHref}/my-tee-box`,
        };

        await this.notificationService.createNotification(
          booking?.data?.ownerId || "",
          "TeeTimes Purchased",
          "TeeTimes Purchased",
          existingTeeTime?.courseId,
          process.env.SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID ?? "d-82894b9885e54f98a810960373d80575",
          template,
          [
            {
              content: Buffer.from(icsContent).toString("base64"),
              filename: "meeting.ics",
              type: "text/calendar",
              disposition: "attachment",
              contentId: "meeting",
            },
          ]
        );

        if (firstBooking?.weatherGuaranteeId?.length) {
          await this.sensibleService.cancelGuarantee(firstBooking?.weatherGuaranteeId || "");
        }
        if (firstBooking?.weatherGuaranteeId) {
          sellerWeatherGuaranteeAmount = firstBooking?.weatherGuaranteeAmount ?? 0;
        }
        if (newBookings.length === 1) {
          const listedPrice = (listPrice ?? 0) / 100;
          const totalTax = listedPrice * sellerFee;

          const templateSeller: any = {
            ...commonTemplateData,
            CustomerFirstName: sellerCustomer?.name?.split(" ")[0],
            ListedPrice:
              `$${listedPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} / Golfer` || "-",
            TaxesAndOtherFees:
              `$${(totalTax * (listedSlotsCount ?? 1)).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}` || "-",
            Payout: formatMoney(
              (listedPrice - totalTax) * (listedSlotsCount || 1) + sellerWeatherGuaranteeAmount / 100
            ),
            PurchasedFrom: existingTeeTime?.courseName || "-",
            BuyTeeTImeURL: `${redirectHref}`,
            CashOutURL: `${redirectHref}/account-settings/${firstBooking.ownerId}`,
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
        const listedPrice = (listPrice ?? 0) / 100;
        const totalTax = listedPrice * sellerFee;

        const templateSeller: any = {
          ...commonTemplateData,
          SoldPlayers: listedSlotsCount,
          CustomerFirstName: sellerCustomer?.name?.split(" ")[0],
          ListedPrice:
            `$${listedPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} / Golfer` || "-",
          TaxesAndOtherFees:
            `$${(totalTax * (listedSlotsCount ?? 1)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` || "-",
          Payout: formatMoney(
            (listedPrice - totalTax) * (listedSlotsCount || 1) + sellerWeatherGuaranteeAmount / 100
          ),
          SensibleWeatherIncluded: firstBooking.weatherGuaranteeId?.length ? "Yes" : "No",
          PurchasedFrom: existingTeeTime?.courseName || "-",
          BuyTeeTImeURL: `${redirectHref}`,
          CashOutURL: `${redirectHref}/account-settings/${firstBooking.ownerId}`,
        };
        await this.notificationService.createNotification(
          firstBooking.ownerId || "",
          "TeeTimes Sold",
          "TeeTimes Sold",
          existingTeeTime?.courseId,
          process.env.SENDGRID_TEE_TIMES_SOLD_PARTIAL_TEMPLATE_ID || "d-ef59724fe9f74e80a3768028924ea456",
          templateSeller
        );
        const remainingSlots = (listedSlots[0]?.listedSlotsCount ?? 0) - (bookingsIds?.newBookingPlayers ?? 0);
        if (remainingSlots > 0) {
          await this.bookingService.addListingForRemainingSlots(bookingId as string, providerBookingId, listingId, remainingSlots, firstBooking.ownerId);
        }
      }
    }

    const amount = listPrice ?? 1;
    const serviceCharge = amount * sellerFee;
    const payable = (amount - serviceCharge) * (listedSlotsCount || 1) + sellerWeatherGuaranteeAmount;
    const currentDate = new Date();
    const radeemAfterMinutes = await appSettingService.get("CASH_OUT_AFTER_MINUTES");
    const redeemAfterDate = this.addMinutes(currentDate, Number(radeemAfterMinutes));
    const customerRecievableData = [
      {
        id: randomUUID(),
        userId: firstBooking.ownerId,
        amount: payable,
        type: "CASHOUT",
        transferId: bookingsIds?.transferId,
        sensibleAmount: sellerWeatherGuaranteeAmount,
        createdDateTime: this.formatCurrentDateTime(currentDate), // Use UTC string format for datetime fields
        redeemAfter: this.formatCurrentDateTime(redeemAfterDate), // Use UTC string format for datetime fields
      },
    ];
    await this.database
      .insert(customerRecievable)
      .values(customerRecievableData)
      .catch((err: any) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: customer_id,
          url: `/HyperSwitchWebhookService/handleSecondHandItem`,
          userAgent: "",
          message: "ERROR_CREATING_CUSTOMER_RECEIVABLE_FOR_TEE_TIME",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            customerRecievableData,
          }),
        });
      });

    if (firstBooking.groupId) {
      await this.bookingService.addListingForRemainingSlotsOnGroupBooking(firstBooking.groupId, listedSlotsCount, firstBooking.ownerId)
    }
  };

  extractTime = (dateStr: string) => {
    const timeRegex = /\b\d{1,2}:\d{2} (AM|PM)\b/;
    const timeMatch = dateStr.match(timeRegex);
    return timeMatch ? timeMatch[0] : null;
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
      .where(eq(charityCourseLink.charityId, item.product_data.metadata.charity_id))
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
    console.log("Sensible Item");
    console.dir(item, { depth: null });
    // Logic for handling first-hand items
    try {
      const booking = await this.getBookingDetails(item.product_data.metadata.sensible_quote_id);

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
            weatherGuaranteeAmount: item.price,
          })
          .where(eq(bookings.id, acceptedQuote.reservation_id));
      }
      return acceptedQuote;
    } catch (error: any) {
      this.logger.error("Error handling Sensible item:", error);
      loggerService.errorLog({
        userId: customer_id,
        url: `/HyperSwitchWebhookService/handleSensibleItem`,
        userAgent: "",
        message: "ERROR_CREATING_BOOKING_FOR_TEE_TIME",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          item,
        }),
      });
      throw new Error("Failed to handle Sensible item");
    }
  };

  getBookingDetails = async (guaranteeId: string) => {
    const [booking] = await this.database
      .select()
      .from(bookings)
      .where(eq(bookings.weatherQuoteId, guaranteeId));

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
  paymentFailureHandler = async (
    customer_id: string,
    bookingId?: string,
    internalId?: string,
    courseId?: string,
    teesheetId?: string,
    providerBookingId?: string,
    weatherGuaranteeId?: string
  ) => {
    if (providerBookingId && courseId && teesheetId) {
      console.log("cancel primary booking since payment is failed");
      const { provider, token } = await this.providerService.getProviderAndKey(internalId!, courseId ?? "");
      await provider.deleteBooking(token, courseId, teesheetId, providerBookingId);
    }
    if (weatherGuaranteeId) {
      console.log("cancel weather guarantee since payment is failed", weatherGuaranteeId);
      try {
        await this.sensibleService.cancelGuarantee(weatherGuaranteeId);
      } catch (e: any) {
        this.logger.error("Error cancelling sensible guarantee ===> ", e.message);
        await loggerService.errorLog({
          message: "ERROR_CANCELLING_SENSIBLE_GUARANTEE",
          userId: "",
          url: "/webhooks/processPayment",
          userAgent: "",
          stackTrace: `Payment Id not is not valid`,
          additionalDetailsJSON: JSON.stringify({
            customer_id: customer_id,
            bookingId: bookingId,
            internalId: internalId,
            courseId: courseId,
            teesheetId: teesheetId,
            providerBookingId: providerBookingId,
            weatherGuaranteeId: weatherGuaranteeId,
          }),
        });
      }
    }
    await this.notificationService.createNotification(
      customer_id,
      "Payment Failed",
      "Your payment has failed",
      undefined
    );
  };
  getHeadersOfFinix = () => {
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/json");
    requestHeaders.append("Finix-Version", process.env.FINIX_VERSION || "2022-02-01");
    requestHeaders.append("Authorization", this.authorizationHeader);
    return requestHeaders;
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

  finixWebhookService = async (entityType: string, entity: string, paymentId: string, paymentState: string) => {
    try {
      this.logger.warn("paymentId is here", paymentId);
      this.logger.warn("payment state is here", paymentState);
      if (entityType === "updated" && entity === "payment_link" && paymentState === "COMPLETED") {
        const updateStatus = await this.database.update(splitPayments).set({ isPaid:1,isWebhookStatus: paymentState }).where(eq(splitPayments.paymentId, paymentId));
        return {
          message: "Payment Webhook status successFully",
          error: false
        }
      }
    } catch (error) {
      console.log(error);
      return {
        message: "Payment Webhook status failed",
        error: true
      }
    }
  }
}
