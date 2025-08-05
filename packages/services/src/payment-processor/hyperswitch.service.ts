/* eslint no-use-before-define: 0 */
import { randomUUID } from "crypto";
import { and, db, eq } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import Logger from "@golf-district/shared/src/logger";
import HyperSwitch from "@juspay-tech/hyper-node";
import type pino from "pino";
import type { UpdatePayment } from "../checkout/types";
import { NotificationService } from "../notification/notification.service";
import { loggerService } from "../webhooks/logging.service";
import type {
  CustomerDetails,
  CustomerPaymentMethod,
  CustomerPaymentMethodsResponse,
} from "./types/hyperSwitch.types";
import type { InsertFailedBooking } from "@golf-district/database/schema/failedBookings";
import { failedBooking } from "@golf-district/database/schema/failedBookings";
import { bookingSplitPayment } from "@golf-district/database/schema/bookingSplitPayment";
import { appSettingService } from "../app-settings/initialized";
import { bookings } from "@golf-district/database/schema/bookings";
import { customerRecievable } from "@golf-district/database/schema/customerRecievable";
import { users } from "@golf-district/database/schema/users";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { formatTime } from "@golf-district/shared";
import { assets } from "@golf-district/database/schema/assets";
/**
 * Service for interacting with the HyperSwitch API.
 */
/*=======================Type interface for creating payment link=====================================================*/

interface PaymentRequest {
  merchant_id?: string;
  application_id?: string;
  payment_frequency?: "ONE_TIME" | "RECURRING";
  is_multiple_use?: boolean;
  allowed_payment_methods?: ("PAYMENT_CARD" | "BANK_ACCOUNT")[];
  nickname?: string;
  items?: Item[];
  amount_details?: AmountDetails;
  additional_details?: AdditionalDetails;
  branding?: Branding;
  tags?: object;
}

interface Item {
  name?: string;
  description?: string;
  quantity?: string;
  image_details?: {
    primary_image_url?: string;
  };
  price_details?: {
    sale_amount?: number;
    currency?: string;
  };
}

interface AmountDetails {
  amount_type?: "FIXED" | "VARIABLE";
  total_amount?: number;
  currency?: string;
}

interface AdditionalDetails {
  collect_name?: boolean;
  collect_email?: boolean;
  collect_phone?: boolean;
  collect_billing_address?: boolean;
  collect_shipping_address?: boolean;
  expiration_in_minutes?: number;
  terms_of_service_url?: string;
  success_return_url?: string;
  unsuccessful_return_url?: string;
  expired_session_url?: string;
  send_receipt?: boolean;
  receipt_requested_delivery_methods?: ReceiptDeliveryMethod[];
}

interface ReceiptDeliveryMethod {
  type?: "EMAIL" | "SMS";
  destinations?: string[];
}

interface Branding {
  brand_color?: string;
  accent_color?: string;
  logo?: string;
  icon?: string;
  logo_alternative_text?: string;
  button_font_color?: string;
}

type RequestOptions = {
  method: string;
  headers: Headers;
  body?: string;
  redirect: RequestRedirect;
};

/**=========================================================================== */
export class HyperSwitchService {
  protected hyperSwitch: HyperSwitch;
  protected logger: pino.Logger;
  protected hyper: any;
  protected hyperSwitchBaseUrl = process.env.HYPERSWITCH_BASE_URL!; // "https://sandbox.hyperswitch.io";
  protected hyperSwitchApiKey: string;
  protected notificationService: NotificationService;
  protected database: Db;
  protected baseurl = process.env.FINIX_BASE_URL;
  protected username = process.env.FINIX_USERNAME;
  protected password = process.env.FINIX_PASSWORD;
  protected merchantId = process.env.FINIX_MERCHANT_ID;
  protected applicationId = process.env.FINIX_APPLICATION_ID;
  protected encodedCredentials = btoa(`${this.username}:${this.password}`);
  protected authorizationHeader = `Basic ${this.encodedCredentials}`;
  /**
   * Constructs a new HyperSwitchService.
   * @param {string} hyperSwitchApiKey - The API key for authenticating with HyperSwitch.
   * @param {pino.Logger} [logger] - Optional logger instance for logging messages.
   */
  constructor(hyperSwitchApiKey: string, logger?: pino.Logger) {
    this.logger = logger ? logger : Logger(HyperSwitchService.name);
    console.log("Initialize hyperswitch with apikey", hyperSwitchApiKey);
    this.hyper = require("@juspay-tech/hyperswitch-node")(hyperSwitchApiKey);
    (this.database = db),
      (this.notificationService = new NotificationService(
        db,
        process.env.TWILLIO_PHONE_NUMBER!,
        process.env.SENDGRID_EMAIL!,
        process.env.TWILLIO_ACCOUNT_SID!,
        process.env.TWILLIO_AUTH_TOKEN!,
        process.env.SENDGRID_API_KEY!
      ));
    this.hyperSwitch = new HyperSwitch(hyperSwitchApiKey, {
      apiVersion: "2020-08-27",
      typescript: true,
    });

    this.hyperSwitchApiKey = hyperSwitchApiKey;
  }

  getHeadersOfFinix = () => {
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/json");
    requestHeaders.append("Finix-Version", process.env.FINIX_VERSION || "2022-02-01");
    requestHeaders.append("Authorization", this.authorizationHeader);
    return requestHeaders;
  };

  /**
   * Creates a new customer using the given parameters.
   * @param params - The details of the customer to be created.
   * @returns Promise resolving to the created customer's data.
   * @throws Will throw an error if the customer creation fails.
   */
  createCustomer = async (params: CustomerDetails) => {
    return await this.hyper.customers.create(params).catch((err: any) => {
      this.logger.error(`Error creating customer: ${err}`);
      loggerService.errorLog({
        userId: params.customer_id!,
        url: "/HyperSwitchService/createCustomer",
        userAgent: "",
        message: "ERROR_CREATING_CUSTOMER",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          params,
        }),
      });
      throw new Error(`Error creating customer: ${err}`);
    });
  };

  /**
   * Retrieves information for a specific customer.
   * @param customerId - The identifier of the customer to be retrieved.
   * @returns Promise resolving to the retrieved customer's data.
   * @throws Will throw an error if retrieving the customer fails.
   */
  retrieveCustomer = async (customerId: string) => {
    return await this.hyper.customers.retrieve(customerId).catch((err: any) => {
      this.logger.error(`Error retrieving customer: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/createCustomer",
        userAgent: "",
        message: "ERROR_CREATING_CUSTOMER",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          customerId,
        }),
      });
      throw new Error(`Error retrieving customer: ${err}`);
    });
  };

  /**
   * Deletes a specific customer.
   * @param customerId - The identifier of the customer to be deleted.
   * @returns Promise indicating the result of the delete operation.
   * @throws Will throw an error if the customer deletion fails.
   */
  deleteCustomer = async (customerId: string) => {
    return await this.hyper.customers.del(customerId).catch((err: any) => {
      this.logger.error(`Error deleting customer: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/deleteCustomer",
        userAgent: "",
        message: "ERROR_DELETING_CUSTOMER",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          customerId,
        }),
      });
      throw new Error(`Error deleting customer: ${err}`);
    });
  };

  /**
   * Creates a new payment intent.
   * @param params - Parameters to create the payment intent.
   * @returns Promise resolving to the created payment intent's data.
   * @throws Will throw an error if the payment intent creation fails.
   */
  createPaymentIntent = async (params: any, options?: HyperSwitch.RequestOptions | undefined) => {
    console.log("Hyperswitch - Creating payment intent options", JSON.stringify(options));
    return await this.hyper.paymentIntents.create(params, options).catch((err: any) => {
      this.logger.error(`Error creating payment intent: ${err}`);
      loggerService.errorLog({
        userId: params.customer_id,
        url: "/HyperSwitchService/createPaymentIntent",
        userAgent: "",
        message: "ERROR_CREATING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          params,
          options,
        }),
      });
      throw new Error(`Error creating payment intent: ${err}`);
    });
  };

  /**
   * Updates a new payment intent.
   * @param params - Parameters to update the payment intent.
   * @returns Promise resolving to the updated payment intent's data.
   * @throws Will throw an error if the payment intent updation fails.
   */
  updatePaymentIntent = async (paymentId: string, params: UpdatePayment, userId: string) => {
    try {
      const myHeaders = new Headers();
      const hyperSwichApiKey = process.env.HYPERSWITCH_API_KEY;
      myHeaders.append("api-key", `${hyperSwichApiKey}`);
      myHeaders.append("Content-Type", "application/json");
      const raw = JSON.stringify(params);
      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      const hyperswitchBaseUrl = `${process.env.HYPERSWITCH_BASE_URL}/payments/${paymentId}`;
      const response = await fetch(hyperswitchBaseUrl, requestOptions);
      const result = await response.json();
      console.log(JSON.stringify(result));
      this.logger.warn("updating payment intent");
      return result;
    } catch (err: any) {
      console.log(err);
      await loggerService.errorLog({
        userId,
        url: "/HyperSwitchService/updatePaymentIntent",
        userAgent: "",
        message: "ERROR_UPDATING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          params,
          paymentId,
        }),
      });
      throw new Error(`Error updating payment intent: ${err}`);
    }
    // return await this.hyper.paymentIntents.update(paymentId, params).catch((err: any) => {
    //   this.logger.error(`Error updating payment intent: ${err}`);
    //   loggerService.errorLog({
    //     userId,
    //     url: "/HyperSwitchService/updatePaymentIntent",
    //     userAgent: "",
    //     message: "ERROR_UPDATING_PAYMENT_INTENT",
    //     stackTrace: `${err.stack}`,
    //     additionalDetailsJSON: JSON.stringify({
    //       params,
    //       paymentId,
    //     }),
    //   });
    //   throw new Error(`Error updating payment intent: ${err}`);
    // });
  };

  /**
   * Confirms a payment intent.
   * @param paymentId - The identifier of the payment intent to be confirmed.
   * @returns Promise indicating the result of the confirmation.
   * @throws Will throw an error if the payment intent confirmation fails.
   */
  confirmPaymentIntent = async (paymentId: string) => {
    return await this.hyper.paymentIntents.confirm(paymentId).catch((err: any) => {
      this.logger.error(`Error confirming payment intent: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/confirmPaymentIntent",
        userAgent: "",
        message: "ERROR_CONFIRMING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId,
        }),
      });
      throw new Error(`Error confirming payment intent: ${err}`);
    });
  };

  /**
   * Retrieves a specific payment intent.
   * @param paymentId - The identifier of the payment intent to be retrieved.
   * @returns Promise resolving to the retrieved payment intent's data.
   * @throws Will throw an error if retrieving the payment intent fails.
   */
  retrievePaymentIntent = async (
    paymentId: string
  ): Promise<HyperSwitch.Response<HyperSwitch.PaymentIntent>> => {
    try {
      const myHeaders = new Headers();
      const hyperSwichApiKey = process.env.HYPERSWITCH_API_KEY;
      myHeaders.append("api-key", `${hyperSwichApiKey}`);
      myHeaders.append("Content-Type", "application/json");
      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
      };
      const hyperswitchBaseUrl = `${process.env.HYPERSWITCH_BASE_URL}/payments/${paymentId}`;
      const response = await fetch(hyperswitchBaseUrl, requestOptions);
      const result = await response.json();
      this.logger.warn("retrieving payment intent");
      return result;
    } catch (err: any) {
      console.log(err);
      await loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/retrievePaymentIntent",
        userAgent: "",
        message: "ERROR_RETRIEVING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId,
        }),
      });
      throw new Error(`Error retrieving payment intent: ${err}`);
    }
    // return await this.hyper.paymentIntents.retrieve(paymentId).catch((err: any) => {
    //   this.logger.error(`Error retrieving payment intent: ${err}`);
    //   loggerService.errorLog({
    //     userId: "",
    //     url: "/HyperSwitchService/retrievePaymentIntent",
    //     userAgent: "",
    //     message: "ERROR_RETRIEVING_PAYMENT_INTENT",
    //     stackTrace: `${err.stack}`,
    //     additionalDetailsJSON: JSON.stringify({
    //       paymentId,
    //     }),
    //   });
    //   throw new Error(`Error retrieving payment intent: ${err}`);
    // });
  };

  /**
   * Captures a payment intent.
   * @param paymentId - The identifier of the payment intent to be captured.
   * @returns Promise indicating the result of the capture.
   * @throws Will throw an error if the payment intent capture fails.
   */
  capturePaymentIntent = async (
    paymentId: string
  ): Promise<HyperSwitch.Response<HyperSwitch.PaymentIntent>> => {
    return await this.hyperSwitch.paymentIntents.capture(paymentId).catch((err: any) => {
      this.logger.error(`Error capturing payment intent: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/capturePaymentIntent",
        userAgent: "",
        message: "ERROR_CAPTURING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId,
        }),
      });
      throw new Error(`Error capturing payment intent: ${err}`);
    });
  };

  /**
   * Cancels a payment intent.
   * @param paymentId - The identifier of the payment intent to be cancelled.
   * @returns Promise indicating the result of the cancellation.
   * @throws Will throw an error if the payment intent cancellation fails.
   */
  cancelPaymentIntent = async (
    paymentId: string
  ): Promise<HyperSwitch.Response<HyperSwitch.PaymentIntent>> => {
    return await this.hyperSwitch.paymentIntents.cancel(paymentId).catch((err) => {
      this.logger.error(`Error cancelling payment intent: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/cancelPaymentIntent",
        userAgent: "",
        message: "ERROR_CANCELLING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId,
        }),
      });
      throw new Error(`Error cancelling payment intent: ${err}`);
    });
  };

  /**
   * Creates a new payment method.
   * @param params - Parameters to create the payment method.
   * @returns Promise resolving to the created payment method's data.
   * @throws Will throw an error if the payment method creation fails.
   */
  createPaymentMethod = async (params: any) => {
    const options = {
      method: "POST",
      headers: {
        "api-key": process.env.HYPERSWITCH_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    };

    const res = await fetch(`${this.hyperSwitchBaseUrl}/payment_methods`, options);
    const jsonRes = await res.json();
    if (jsonRes.error) {
      return { status: "Cannot add card please enter valid details" };
    }
    return { status: "success" };
  };

  /**
   * Retrieves payment methods for a specific customer.
   * @param customerId - The identifier of the customer.
   * @param params - Parameters for listing payment methods.
   * @returns Promise resolving to a list of the customer's payment methods.
   * @throws Will throw an error if retrieving the payment methods fails.
   */
  retrievePaymentMethods = async (customerId: string): Promise<CustomerPaymentMethod[] | undefined> => {
    console.log(`hyperSwitchBaseUrl: ${this.hyperSwitchBaseUrl}`);
    // console.log(`hyperSwitchApiKey: ${this.hyperSwitchApiKey}`);
    console.log(`customerId: ${customerId}`);

    try {
      const url = `${this.hyperSwitchBaseUrl}/customers/${customerId}/payment_methods`;
      const options = {
        method: "GET",
        headers: {
          "api-key": this.hyperSwitchApiKey,
        },
      };
      const paymentMethodResponse = await fetch(url, options);
      const paymentMethods: CustomerPaymentMethodsResponse = await paymentMethodResponse.json();
      console.log("paymentMethods");
      console.log(paymentMethods);
      return paymentMethods.customer_payment_methods;
    } catch (error: any) {
      this.logger.error(`Error retrieving payment methods: ${error}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/retrievePaymentMethods",
        userAgent: "",
        message: "ERROR_RETRIEVING_PAYMENT_METHODS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          customerId,
        }),
      });
    }
  };

  removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const url = `${this.hyperSwitchBaseUrl}/payment_methods/${paymentMethodId}`;
      const options = {
        method: "DELETE",
        headers: {
          "api-key": this.hyperSwitchApiKey,
        },
      };
      const deletePaymentMethodResponse = await fetch(url, options);
      const deletedMethod = await deletePaymentMethodResponse.json();
      // this.logger.info("Payment method deleted: ", deletedMethod);
      console.log("Payment method deleted", deletedMethod);
    } catch (error: any) {
      this.logger.error(`Error removing payment method: ${error}`);
      loggerService.errorLog({
        userId: "",
        url: "/HyperSwitchService/removePaymentMethod",
        userAgent: "",
        message: "ERROR_REMOVING_PAYMENT_METHOD",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          paymentMethodId,
        }),
      });
      console.log("Payment method deleted");
    }
  };

  sendEmailForFailedPayment = async (
    paymentMethodId: string,
    teeTimeId: string,
    listingId: string,
    courseId: string,
    cartId: string,
    userId?: string,
    userEmail?: string,
    phone?: string
  ) => {
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      try {
        await this.notificationService.sendEmail(
          email,
          "A payment has failed ",
          `payment with paymentid ${paymentMethodId} failed. UserId: ${userId}, Email: ${userEmail}, Phone: ${phone}, ${
            teeTimeId ? `TeeTimeId: ${teeTimeId}` : `ListingId: ${listingId}`
          }, CourseId: ${courseId}, CartId: ${cartId}`
        );
      } catch (error) {
        console.log(`Error sending email to ${email}: ${JSON.stringify(error)}`);
      }
    });
    return { status: "success" };
  };

  saveFailedBookingOnDatabase = async ({
    userId,
    teeTimeId,
    cartId,
    weatherGuaranteeQuoteId,
    paymentId,
  }: {
    userId: string | null | undefined;
    teeTimeId: string | string[] | null | undefined;
    cartId: string | null | undefined;
    weatherGuaranteeQuoteId: string | null | undefined;
    paymentId: string;
  }) => {
    try {
      let failedBookingData: InsertFailedBooking[];
      if (Array.isArray(teeTimeId)) {
        failedBookingData = teeTimeId.map((teeTimeId) => ({
          id: randomUUID(),
          cartId: cartId ?? "",
          teeTimeId: teeTimeId,
          userId: userId ?? "",
          weatherGuaranteeQuoteId: weatherGuaranteeQuoteId ?? "",
          providerPaymentId: paymentId,
        }));
      } else {
        failedBookingData = [
          {
            id: randomUUID(),
            cartId: cartId ?? "",
            teeTimeId: teeTimeId ?? "",
            userId: userId ?? "",
            weatherGuaranteeQuoteId: weatherGuaranteeQuoteId ?? "",
            providerPaymentId: paymentId,
          },
        ];
      }
      await this.database.insert(failedBooking).values(failedBookingData).execute();
      // this.logger.info(`Failed booking saved on database with id: ${JSON.stringify(failedBookingData.map((booking) => booking.id))}`);
    } catch (error: any) {
      this.logger.error(`Error saving failed booking on database: ${JSON.stringify(error)}`);
      void loggerService.errorLog({
        userId: userId ?? "",
        url: "/HyperSwitchService/saveFailedBookingOnDatabase",
        userAgent: "",
        message: "ERROR_SAVING_FAILED_BOOKING_ON_DATABASE",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          userId,
          teeTimeId,
          cartId,
          weatherGuaranteeQuoteId,
          paymentId,
        }),
      });
    }
  };

  sendEmailForBookingFailed = async (
    paymentId: string,
    courseId: string,
    cartId: string,
    sensibleQuoteId: string,
    userId: string,
    bookingStage: string,
    teeTimeId: string | string[],
    otherDetails?: {
      userName: string;
      userEmail: string;
      teeTimeDate: string;
      courseName: string;
      errMessage?: string;
    }
  ) => {
    await this.saveFailedBookingOnDatabase({
      userId,
      teeTimeId,
      cartId,
      weatherGuaranteeQuoteId: sensibleQuoteId,
      paymentId,
    });
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      try {
        await this.notificationService.sendEmail(
          email,
          `A booking has failed - (${bookingStage})`,
          `Hello Admin, A booking with payment id ${paymentId} failed, Course Name: ${otherDetails?.courseName}, CourseId: ${courseId}, CartId: ${cartId}, SensibleQuoteId: ${sensibleQuoteId}, UserId: ${userId}, User Name: ${otherDetails?.userName}, User Email: ${otherDetails?.userEmail}, Tee Time Date: ${otherDetails?.teeTimeDate}, Tee Time Id: ${teeTimeId}, Error Message: ${otherDetails?.errMessage}`
        );
      } catch (error) {
        this.logger.error(`Error sending email to ${email}: ${JSON.stringify(error)}`);
      }
    });
    return { status: "success" };
  };

  sendEmailForBookingFailedByTimeout = async (
    paymentId: string,
    courseId: string,
    cartId: string,
    sensibleQuoteId: string | undefined,
    userId: string,
    teeTimeId: string,
    otherDetails?: {
      userName: string;
      userEmail: string;
      teeTimeDate: string;
      courseName: string;
    }
  ) => {
    await this.saveFailedBookingOnDatabase({
      userId,
      teeTimeId,
      cartId,
      weatherGuaranteeQuoteId: sensibleQuoteId,
      paymentId,
    });
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      try {
        await this.notificationService.sendEmail(
          email,
          `A booking has failed by timeout`,
          `Hello Admin, A booking with payment id ${paymentId} timedout, Course Name: ${otherDetails?.courseName}, CourseId: ${courseId}, CartId: ${cartId}, SensibleQuoteId: ${sensibleQuoteId}, UserId: ${userId}, User Name: ${otherDetails?.userName}, User Email: ${otherDetails?.userEmail}, Tee Time Date: ${otherDetails?.teeTimeDate}, Tee Time Id: ${teeTimeId}`
        );
      } catch (error) {
        console.log(`Error sending email to ${email}: ${JSON.stringify(error)}`);
      }
    });
    return { status: "success" };
  };

  cancelHyperswitchPaymentById = async (
    paymentMethodId: string,
    teeTimeId: string,
    courseId: string,
    userId?: string,
    userEmail?: string,
    phone?: string
  ) => {
    const options = {
      method: "POST",
      headers: { "api-key": this.hyperSwitchApiKey, "Content-Type": "application/json" },
      body: '{"cancellation_reason":"cancelled_by_GD"}',
    };

    const res = await fetch(`${this.hyperSwitchBaseUrl}/payments/${paymentMethodId}/cancel`, options);
    const jsonRes = await res.json();
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      try {
        await this.notificationService.sendEmail(
          email,
          "A payment has failed ",
          `payment with paymentid ${paymentMethodId} failed. UserId: ${userId}, Email: ${userEmail}, Phone: ${phone}, TeeTimeId: ${teeTimeId}, CourseId: ${courseId}`
        );
      } catch (error) {
        console.log(`Error sending email to ${email}: ${JSON.stringify(error)}`);
      }
    });
    if (jsonRes.error) {
      return { status: "Cannot delete payment" };
    }
    return { status: "success" };
  };
  refundPayment = async (paymentId: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("api-key", this.hyperSwitchApiKey);
    const options = {
      method: "POST",
      headers: { "api-key": this.hyperSwitchApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: paymentId,
        refund_type: "instant",
      }),
    };

    const res = await fetch(`${this.hyperSwitchBaseUrl}/refunds`, options);
    const jsonRes = await res.json();
    if (jsonRes.error) {
      return { status: "Cannot refund payment" };
    }
    return { status: "success" };
  };

  formatDateForMySQL(isoDateString: string): string {
    const date = new Date(isoDateString);
    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  createPaymentLink = async (
    amount: number,
    email: string,
    bookingId: string,
    origin: string,
    totalPayoutAmount: number,
    collectPaymentProcessorCharge: number,
    courseLogo: string,
    additonalMessge: string,
    userEmail: string,
    index: number,
    color1?: string
  ) => {
    try {
      if (amount === 0) {
        return {
          error: true,
          message: "Amount Cannot be zero or empty",
        };
      }
      if (email === "") {
        return {
          error: true,
          message: "Email is required",
        };
      }

      if (email === userEmail) {
        return {
          error: true,
          message: "Email cannot be same as user email",
        };
      }

      const [bookingResult] = await this.database
        .select({
          userName: users.name,
          bookingProviderId: bookings.providerBookingId,
          courseName: courses.name,
          courseTimeZone: courses.timezoneCorrection,
          facilityName: entities.name,
          bookingDateTime: teeTimes.providerDate,
          cdn: assets.cdn,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.ownerId, users.id))
        .leftJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
        .leftJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .leftJoin(entities, eq(entities.id, courses.entityId))
        .where(eq(bookings.id, bookingId));
      console.log("bookingResult", bookingResult);
      const username = bookingResult ? bookingResult?.userName : "Golf district user";
      const paymentProcessor = String(process.env.SPLIT_PAYMENT_PROCESSOR);
      console.log("payementProcessor", paymentProcessor);
      const originalUserSplitAmount = amount * 100 - collectPaymentProcessorCharge;
      const splitPaymentEmailTemplateId = String(process.env.SPLIT_PAYMENT_EMAIL_TEMPLATE_ID);
      const paymentExpirationTime = await appSettingService.get("PAYMENT_EXPIRATION_TIME_IN_MINS");
      if (paymentProcessor === "finix") {
        const referencePaymentId = randomUUID();
        const paymentData: PaymentRequest = {
          merchant_id: this.merchantId,
          application_id: this.applicationId,
          payment_frequency: "ONE_TIME",
          is_multiple_use: false,
          allowed_payment_methods: ["PAYMENT_CARD", "BANK_ACCOUNT"],
          nickname: "Test account",
          amount_details: {
            amount_type: "FIXED",
            total_amount: amount * 100,
            currency: "USD",
          },
          items: [
            {
              name: "Request Payment",
              description: `Your friend ${username} is requesting your share of the payment $${amount} for your tee time
            on ${formatTime(bookingResult?.bookingDateTime ?? "", false, bookingResult?.courseTimeZone ?? 0)} 
            at ${bookingResult?.courseName}.${additonalMessge}
            `,
              quantity: "1",
              image_details: {
                primary_image_url: `${courseLogo}`,
              },
              price_details: {
                sale_amount: amount * 100,
                currency: "USD",
              },
            },
          ],
          branding: {
            brand_color: "#40942B",
            accent_color: "#40942B",
            logo: "https://golfdistrict.com/wp-content/uploads/2024/07/Primary-Logo-Single-Line.svg",
            icon: "https://golfdistrict.com/wp-content/uploads/2024/07/Primary-Logo-Single-Line.svg",
            logo_alternative_text: "Golfdistrict",
            button_font_color: "#FFF",
          },
          additional_details: {
            collect_name: true,
            collect_email: true,
            collect_phone: true,
            collect_billing_address: false,
            collect_shipping_address: false,
            expiration_in_minutes: Number(paymentExpirationTime),
            terms_of_service_url: `${origin}/terms-of-service`,
            success_return_url: `${origin}/payment-success/?finixReferencePaymentId=${referencePaymentId}&status=succeeded&provider=finix`,
            unsuccessful_return_url: `${origin}/payment-success/?finixReferencePaymentId=${referencePaymentId}&status=failed&provider=finix`,
            expired_session_url: `${origin}/payment-success/?status=expired_sesson_url`,
            send_receipt: true,
            receipt_requested_delivery_methods: [
              {
                type: "EMAIL",
                destinations: [`${email}`],
              },
            ],
          },
          tags: {
            message: `this payment is requested from ${email}`,
          },
        };
        const finixPaymentData = await this.createPaymentLinkForFinix(paymentData);
        const finix_link_url = finixPaymentData?.link_url;
        const paymentId = finixPaymentData?.id;
        if (finix_link_url) {
          const now = new Date();
          const addedMins = new Date(now.getTime() + Number(paymentExpirationTime) * 60000);
          const newexpireDate = addedMins.toISOString().slice(0, 19).replace("T", " ");
          //(amount * 100)
          await this.database
            .insert(bookingSplitPayment)
            .values({
              id: referencePaymentId,
              payoutAmount: originalUserSplitAmount,
              email: email,
              bookingId: bookingId,
              paymentId: paymentId,
              paymentLink: finix_link_url,
              collectedAmount: totalPayoutAmount * 100,
              paymentProcessorPercent: collectPaymentProcessorCharge,
              expirationDateTime: newexpireDate,
              savedIndex: index,
            })
            .execute()
            .catch(async (e: any) => {
              console.log(e);
              await loggerService.errorLog({
                message: "ERROR_INSERTING_FININX_PAYMENT_LINK",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: "",
                  referencePaymentId: "",
                  provider: "finix",
                }),
              });
            });
          const newUrl = `${origin}/create-payment`;

          if (splitPaymentEmailTemplateId) {
            const emailSend = await this.notificationService.sendEmailByTemplate(
              email,
              "Payment Link",
              splitPaymentEmailTemplateId,
              {
                USERNAME: `${username}`,
                PAYMENT_URL: `${newUrl}/${paymentId}`,
                COURSE_NAME: bookingResult?.courseName || "",
                AMOUNT: `${amount.toFixed(2)}`,
                PLAY_TIME: formatTime(
                  bookingResult?.bookingDateTime ?? "",
                  false,
                  bookingResult?.courseTimeZone ?? 0
                ),
                FACILITY: `${bookingResult?.facilityName}`,
                COURSE_RESERVATION_ID: `${bookingResult?.bookingProviderId}`,
                //TRACKING_URL: `https://webhook.site/tracking-email?id=${referencePaymentId}`
                TRACKING_URL: `${origin}/api/trackemail/?id=${referencePaymentId}`,
                SUBJECT_LINE: `Payment Requested for Your Golf Tee Time by ${username}`,
                LOGO_URL: courseLogo,
                HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
                ADDITIONAL_MESSAGE: additonalMessge,
                color1: color1,
              },
              []
            );
            console.log("Email Send successFully");
          } else {
            const message = `This payment has been requested on behalf of ${username}.
Course: \`${bookingResult?.courseName || "N/A"}\`
Facility: \`${bookingResult?.facilityName}\`
Play Time: \`${formatTime(bookingResult?.bookingDateTime ?? "", false, bookingResult?.courseTimeZone ?? 0)}\`
Course Reservation ID: \`${bookingResult?.bookingProviderId}\`
Amount Due: \`₹${amount.toFixed(2)}\`

Please proceed with the payment by clicking the link below:
\`${newUrl}/${paymentId}\`
Thank you for choosing us.`;
            const emailSend = await this.notificationService.sendEmail(email, "Payment Link", message);
          }
          return {
            error: false,
            message: "Payment Link Send Successfully",
          };
        }
      } else {
        this.logger.warn("inside hyperswitch");
        const return_url = `${origin}/payment-success`;
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("api-key", this.hyperSwitchApiKey);
        const profile_id = process.env.HYPERSWITCH_PROFILE_ID;
        const currency = "USD";
        const options = {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify({
            profile_id: profile_id,
            payment_link: true,
            amount: Math.round(amount * 100),
            authentication_type: "three_ds",
            currency: currency,
            confirm: false,
            description: `Your friend ${username} is requesting your share of the payment $${amount} for your tee time
            on ${formatTime(bookingResult?.bookingDateTime ?? "", false, bookingResult?.courseTimeZone ?? 0)} 
            at ${bookingResult?.courseName}.${additonalMessge}
            `,
            payment_link_config: {
              theme: "#014E28",
              logo: `${courseLogo}`,
              seller_name: "Golfdistrict",
              sdk_layout: "tabs",
            },
            return_url: return_url,
            session_expiry: Number(paymentExpirationTime) * 60,
          }),
        };
        const result = await fetch(`${this.hyperSwitchBaseUrl}/payments`, options);
        const response = await result.json();
        console.log("response_payment_link", response);
        Math.round(amount * 100);
        if (response?.payment_link?.link) {
          const hyperswitchUUID = randomUUID();
          await this.database
            .insert(bookingSplitPayment)
            .values({
              id: hyperswitchUUID,
              payoutAmount: originalUserSplitAmount,
              email: email,
              bookingId: bookingId,
              paymentId: response?.payment_id,
              paymentLink: response?.payment_link?.link,
              collectedAmount: totalPayoutAmount * 100,
              paymentProcessorPercent: collectPaymentProcessorCharge,
              expirationDateTime: this.formatDateForMySQL(response?.expires_on),
              savedIndex: index,
            })
            .execute()
            .catch(async (e: any) => {
              console.log(e);
              await loggerService.errorLog({
                message: "ERROR_INSERTING_HYPERSWITCH_PAYMENT_LINK",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: response?.payment_id,
                  referencePaymentId: "",
                  provider: "hyperswitch",
                }),
              });
            });
          const newUrl = `${origin}/create-payment`;
          if (splitPaymentEmailTemplateId) {
            const emailSend = await this.notificationService.sendEmailByTemplate(
              email,
              "",
              process.env.SPLIT_PAYMENT_EMAIL_TEMPLATE_ID!,
              {
                USERNAME: `${username}`,
                PAYMENT_URL: `${newUrl}/${response?.payment_id}`,
                COURSE_NAME: `${bookingResult?.courseName}` || "",
                AMOUNT: `${amount.toFixed(2)}`,
                PLAY_TIME: formatTime(
                  bookingResult?.bookingDateTime ?? "",
                  false,
                  bookingResult?.courseTimeZone ?? 0
                ),
                FACILITY: `${bookingResult?.facilityName}`,
                COURSE_RESERVATION_ID: `${bookingResult?.bookingProviderId}`,
                TRACKING_URL: `${origin}/trackemail/?id=${hyperswitchUUID}`,
                //TRACKING_URL: `https://webhook.site/tracking-email?id=${hyperswitchUUID}`
                SUBJECT_LINE: `Payment Requested for Your Golf Tee Time by ${username}`,
                LOGO_URL: courseLogo,
                HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
                ADDITIONAL_MESSAGE: additonalMessge,
                color1: color1,
              },
              []
            );
            console.log("Email Send successFully");
          } else {
            const message = `This payment has been requested on behalf of ${username}.
Course: \`${bookingResult?.courseName || "N/A"}\`
Facility: \`${bookingResult?.facilityName}\`
Play Time: \`${formatTime(bookingResult?.bookingDateTime ?? "", false, bookingResult?.courseTimeZone ?? 0)}\`
Course Reservation ID: \`${bookingResult?.bookingProviderId}\`
Amount Due: \`₹${amount.toFixed(2)}\`

Please proceed with the payment by clicking the link below:
\`${newUrl}/${response?.payment_id}\`
Thank you for choosing us.`;
            const emailSend = await this.notificationService.sendEmail(email, "Payment Link", message);
          }
          return {
            error: false,
            message: "Payment Link Send Successfully",
          };
        } else {
          await loggerService.errorLog({
            message: "ERROR_PAYMENT_LINK_NOT_CREATED",
            userId: "",
            url: "/auth",
            userAgent: "",
            stackTrace: `PAYMENT_LINK_NOT_CREATED`,
            additionalDetailsJSON: JSON.stringify({
              paymentId: response?.payment_id,
              referencePaymentId: "",
              provider: "hyperswitch",
            }),
          });
          return {
            error: true,
            message: "Problem Creating Payment Link",
          };
        }
      }
    } catch (error: any) {
      console.log("error", error);
      await loggerService.errorLog({
        message: "INTERNAL_SERVER_ERROR",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: `INTERNAL_SERVER_ERROR`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: "",
          referencePaymentId: "",
          provider: "",
          message: error.message,
        }),
      });
      throw new Error("Problem creating payment link");
    }
  };

  createPaymentLinkForFinix = async (paymentData: PaymentRequest) => {
    try {
      const requestOptions: RequestOptions = {
        method: "POST",
        headers: this.getHeadersOfFinix(),
        body: JSON.stringify(paymentData),
        redirect: "follow",
      };
      const response = await fetch(`${this.baseurl}/payment_links`, requestOptions);
      const paymentInstrumentData = await response.json();
      return paymentInstrumentData;
    } catch (e: any) {
      console.log(e);
      await loggerService.errorLog({
        message: "ERROR_INSERTING_HYPERSWITCH_PAYMENT_LINK",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: `${JSON.stringify(e)}`,
        additionalDetailsJSON: JSON.stringify({
          paymentData: paymentData,
          referencePaymentId: "",
          provider: "finix",
        }),
      });
      throw new Error("error while creating the payment");
    }
  };

  updateSplitPaymentStatus = async (
    paymentId: string,
    referencePaymentId: string,
    courseLogo: string,
    color1?: string
  ) => {
    try {
      if (paymentId) {
        const [isUserAlreadyPaid] = await this.database
          .select({ isPaid: bookingSplitPayment.isPaid })
          .from(bookingSplitPayment)
          .where(eq(bookingSplitPayment.paymentId, paymentId));
        if (isUserAlreadyPaid?.isPaid === 1) {
          return {
            message: "This Payment is Already paid",
            email: "",
            bookingId: "",
            error: true,
            amount: "",
          };
        }
        await this.database
          .update(bookingSplitPayment)
          .set({
            isPaid: 1,
            isActive: 1,
          })
          .where(eq(bookingSplitPayment.paymentId, paymentId))
          .execute()
          .catch(async (e: any) => {
            await loggerService.errorLog({
              message: "ERROR_UPDATING_HYPERSWITCH_PAYMENT_STATUS",
              userId: "",
              url: "/auth",
              userAgent: "",
              stackTrace: `${JSON.stringify(e)}`,
              additionalDetailsJSON: JSON.stringify({
                paymentId: paymentId,
                referencePaymentId: referencePaymentId,
                provider: "finix",
              }),
            });
          });
        const [result] = await this.database
          .select({
            email: bookingSplitPayment.email,
            bookingId: bookingSplitPayment.bookingId,
            amount: bookingSplitPayment.payoutAmount,
            paymentId: bookingSplitPayment.paymentId,
            collectedAmount: bookingSplitPayment.collectedAmount,
            bookingDateTime: teeTimes.providerDate,
            courseName: courses.name,
            courseTimeZone: courses.timezoneCorrection,
            userName: users.name,
            websiteURL: courses.websiteURL,
          })
          .from(bookingSplitPayment)
          .where(eq(bookingSplitPayment.paymentId, paymentId))
          .leftJoin(bookings, eq(bookingSplitPayment.bookingId, bookings.id))
          .leftJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
          .leftJoin(courses, eq(teeTimes.courseId, courses.id))
          .leftJoin(users, eq(bookings.ownerId, users.id));
        // email send the payment completed user
        // const message = `Your payment of $${
        //   Number(result?.collectedAmount) / 100
        // } has been successfully processed. Thank you for your payment.`;
        // const emailSend = await this.notificationService.sendEmail(
        //   result?.email ?? "",
        //   "Payment Successful",
        //   message
        // );

        const emailSend = await this.notificationService.sendEmailByTemplate(
          result?.email ?? "",
          "Payment Successful",
          process.env.SENDGRID_PAYMENT_SUCCESSFUL_TEMPLATE_ID!,
          {
            AMOUNT: (Number(result?.collectedAmount) / 100).toString(),
            USERNAME: `${result?.userName}`,
            CourseName: result?.courseName ?? "",
            CourseURL: result?.websiteURL ?? "",
            PlayDateTime: formatTime(result?.bookingDateTime ?? "", false, result?.courseTimeZone ?? 0),
            CourseReservationID: `${result?.bookingId}`,
            SUBJECT_LINE: `Payment Successfully processed`,
            LOGO_URL: courseLogo,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            color1: color1,
          },
          []
        );
        // email send the admins after payment completed of the user

        const messageAdmin = `Payment of  $${
          Number(result?.collectedAmount) / 100
        } has been successfully processed for the user ${result?.email}. Thank you for your payment.`;
        const adminEmails = process.env.ADMIN_EMAIL_LIST!.split(",");

        for (const email of adminEmails) {
          await this.notificationService.sendEmail(
            email.trim(),
            "New payment is successfully received in Request Payment",
            messageAdmin
          );
        }
        await loggerService.auditLog({
          id: randomUUID(),
          userId: "",
          teeTimeId: "",
          bookingId: result?.bookingId ?? "",
          listingId: "",
          courseId: "",
          eventId: "PAYMENT_STATUS_UPDATE_SUCCESSFULLY",
          json: JSON.stringify({
            paymentId,
            referencePaymentId,
            amount: result?.amount,
            email: result?.email,
            provider: "hyperswitch",
          }),
        });

        return {
          message: "status update successFully",
          email: result?.email,
          bookingId: result?.bookingId,
          error: false,
          amount: result?.amount,
        };
      } else if (referencePaymentId) {
        const [isUserAlreadyPaid] = await this.database
          .select({ isPaid: bookingSplitPayment.isPaid, webHookstatus: bookingSplitPayment.webhookStatus })
          .from(bookingSplitPayment)
          .where(eq(bookingSplitPayment.id, referencePaymentId));
        console.warn("isUserAlreadyPaid", isUserAlreadyPaid);
        if (isUserAlreadyPaid?.isPaid === 1 && isUserAlreadyPaid.webHookstatus === "COMPLETED") {
          return {
            message: "This payment is already paid",
            email: "",
            bookingId: "",
            error: true,
            amount: "",
          };
        }
        if (isUserAlreadyPaid?.webHookstatus === "COMPLETED" && isUserAlreadyPaid?.isPaid === 0) {
          await this.database
            .update(bookingSplitPayment)
            .set({
              isPaid: 1,
            })
            .where(eq(bookingSplitPayment.id, referencePaymentId))
            .execute()
            .catch(async (e: any) => {
              await loggerService.errorLog({
                message: "ERROR_UPDATING_FINIX_PAYMENT_STATUS",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: paymentId,
                  referencePaymentId: referencePaymentId,
                  provider: "finix",
                }),
              });
            });
        } else {
          await this.database
            .update(bookingSplitPayment)
            .set({
              isPaid: 1,
              // webhookStatus: "COMPLETED"
            })
            .where(eq(bookingSplitPayment.id, referencePaymentId))
            .execute()
            .catch(async (e: any) => {
              await loggerService.errorLog({
                message: "ERROR_UPDATING_FINIX_PAYMENT_STATUS",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: paymentId,
                  referencePaymentId: referencePaymentId,
                  provider: "finix",
                }),
              });
            });
        }
        const [result] = await this.database
          .select({
            email: bookingSplitPayment.email,
            bookingId: bookingSplitPayment.bookingId,
            amount: bookingSplitPayment.payoutAmount,
            paymentId: bookingSplitPayment.paymentId,
            collectedAmount: bookingSplitPayment.collectedAmount,
            bookingDateTime: teeTimes.providerDate,
            courseName: courses.name,
            courseTimeZone: courses.timezoneCorrection,
            userName: users.name,
            websiteURL: courses.websiteURL,
          })
          .from(bookingSplitPayment)
          .where(eq(bookingSplitPayment.id, referencePaymentId))
          .leftJoin(bookings, eq(bookingSplitPayment.bookingId, bookings.id))
          .leftJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
          .leftJoin(courses, eq(teeTimes.courseId, courses.id))
          .leftJoin(users, eq(bookings.ownerId, users.id));
        // email send the payment completed user

        // const message = `Your payment of$${
        //   Number(result?.collectedAmount) / 100
        // } has been successfully processed. Thank you for your payment.`;
        // const emailSend = await this.notificationService.sendEmail(
        //   result?.email ?? "",
        //   "Payment Successful",
        //   message
        // );
        console.log("result", result);

        const emailSend = await this.notificationService.sendEmailByTemplate(
          result?.email ?? "",
          "Payment Successful",
          process.env.SENDGRID_PAYMENT_SUCCESSFUL_TEMPLATE_ID!,
          {
            AMOUNT: (Number(result?.collectedAmount) / 100).toString(),
            USERNAME: `${result?.userName}`,
            CourseName: result?.courseName ?? "",
            CourseURL: result?.websiteURL ?? "",
            PlayDateTime: formatTime(result?.bookingDateTime ?? "", false, result?.courseTimeZone ?? 0),
            CourseReservationID: `${result?.bookingId}`,
            SUBJECT_LINE: `Payment Successfully processed`,
            LOGO_URL: courseLogo,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            color1: color1,
          },
          []
        );
        // email send the admins after payment completed of the user

        const messageAdmin = `Payment of $${
          Number(result?.collectedAmount) / 100
        } has been successfully processed for the user ${result?.email}. Thank you for your payment.`;
        const adminEmails = process.env.ADMIN_EMAIL_LIST!.split(",");

        for (const email of adminEmails) {
          await this.notificationService.sendEmail(
            email.trim(),
            "New payment is successfully received in Request Payment",
            messageAdmin
          );
        }
        await loggerService.auditLog({
          id: randomUUID(),
          userId: "",
          teeTimeId: "",
          bookingId: result?.bookingId ?? "",
          listingId: "",
          courseId: "",
          eventId: "PAYMENT_STATUS_UPDATE_SUCCESSFULLY",
          json: JSON.stringify({
            paymentId,
            referencePaymentId,
            amount: result?.amount,
            email: result?.email,
            provider: "finix",
          }),
        });
        return {
          message: "status update successFully",
          email: result?.email,
          bookingId: result?.bookingId,
          error: false,
          amount: result?.amount,
        };
      } else {
        await loggerService.errorLog({
          message: "ERROR_UPDATING_FINIX_PAYMENT_STATUS",
          userId: "",
          url: "/auth",
          userAgent: "",
          stackTrace: `FINIX_PAYMENT_ID_NOT_FOUND`,
          additionalDetailsJSON: JSON.stringify({
            paymentId: paymentId,
            referencePaymentId: referencePaymentId,
            provider: "finix",
          }),
        });
        return {
          message: "Payment ID is missing",
          email: "",
          bookingId: "",
          error: true,
        };
      }
    } catch (error) {
      console.log(error);
      await loggerService.errorLog({
        message: "INTERNAL_SERVER_ERROR",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: `${JSON.stringify(error)}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: paymentId,
          referencePaymentId: referencePaymentId,
          provider: "finix",
        }),
      });
      throw new Error("Error while updating status");
    }
  };

  hasTimeExpired(utcTimeString: string) {
    const utcTime = new Date(utcTimeString.replace(" ", "T") + "Z");
    return utcTime.getTime() < Date.now();
  }

  isEmailedUserPaidTheAmount = async (bookingId: string) => {
    try {
      if (!bookingId) {
        await loggerService.errorLog({
          message: "BOOKING_ID_REQUIRED",
          userId: "",
          url: "/auth",
          userAgent: "",
          stackTrace: ``,
          additionalDetailsJSON: JSON.stringify({
            MESSAGE: "bookingID is not there",
          }),
        });
        return [];
      }
      const result = await this.database
        .select({
          email: bookingSplitPayment.email,
          isPaid: bookingSplitPayment.isPaid,
          isActive: bookingSplitPayment.isActive,
          paymentId: bookingSplitPayment.paymentId,
          amount: bookingSplitPayment.payoutAmount,
          totalPayoutAmount: bookingSplitPayment.collectedAmount,
          emailOpened: bookingSplitPayment.isEmailOpened,
          expireTime: bookingSplitPayment.expirationDateTime,
          index: bookingSplitPayment.savedIndex,
        })
        .from(bookingSplitPayment)
        .where(
          and(eq(bookingSplitPayment.bookingId, bookingId), eq(bookingSplitPayment.isActive, 1))
          //eq(splitPayments.bookingId, bookingId)
        );
      const newResult = result.map((item) => {
        const isLinkExpired = item?.expireTime ? this.hasTimeExpired(item.expireTime) : null;
        return { ...item, isLinkExpired };
      });
      this.logger.warn(newResult, "the new updated response with expired time");
      return newResult || [];
    } catch (error: any) {
      console.log(error);
      await loggerService.errorLog({
        message: "INTERNAL SERVER ERROR ",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          MESSAGE: "INTERNAL SERVER ERROR",
        }),
      });
      throw new Error(error.message);
    }
  };

  resendPaymentLinkToEmailUsers = async (
    email: string,
    amount: number,
    bookingId: string,
    isActive: number,
    origin: string,
    totalPayoutAmount: number,
    collectPaymentProcessorCharge: number,
    courseLogo: string,
    additonalMessge: string,
    userEmail: string,
    index: number,
    paymentId: string
  ) => {
    if (amount === 0) {
      return {
        error: true,
        message: "Amount Cannot be zero or empty",
      };
    }
    if (email === "") {
      return {
        error: true,
        message: "Email is required",
      };
    }

    // if (email === userEmail) {
    //   return {
    //     error: true,
    //     message: "Email cannot be same as user email"
    //   }
    // }
    try {
      const paymentProcessor = String(process.env.SPLIT_PAYMENT_PROCESSOR);
      const [result] = await this.database
        .select({
          email: bookingSplitPayment.email,
          bookingId: bookingSplitPayment.bookingId,
          paymentId: bookingSplitPayment.paymentId,
          id: bookingSplitPayment.id,
        })
        .from(bookingSplitPayment)
        .where(
          and(
            // eq(bookingSplitPayment.email, email),
            eq(bookingSplitPayment.bookingId, bookingId),
            eq(bookingSplitPayment.isActive, isActive),
            eq(bookingSplitPayment.paymentId, paymentId)
            // eq(bookingSplitPayment.isActive, 1)
          )
        );
      if (paymentProcessor === "finix") {
        if (result?.email && result?.bookingId) {
          const updatedResult = await this.database
            .update(bookingSplitPayment)
            .set({
              isActive: 0,
              isEmailOpened: 0,
            })
            .where(
              and(
                eq(bookingSplitPayment.email, result?.email),
                eq(bookingSplitPayment.bookingId, result?.bookingId),
                eq(bookingSplitPayment.isActive, 1),
                eq(bookingSplitPayment.paymentId, result?.paymentId)
              )
            )
            .execute()
            .catch(async (e: any) => {
              await loggerService.errorLog({
                message: "ERROR_UPDATING_FINIX_PAYMENT_STATUS",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: result?.paymentId,
                  id: result?.id,
                  provider: "finix",
                }),
              });
            });
          const resultPaymentLink = await this.createPaymentLink(
            amount,
            email,
            bookingId,
            origin,
            amount,
            collectPaymentProcessorCharge,
            courseLogo,
            additonalMessge,
            userEmail,
            index
          );
          return resultPaymentLink;
        }
      } else {
        if (result?.email && result?.bookingId) {
          const updatedResult = await this.database
            .update(bookingSplitPayment)
            .set({
              isActive: 0,
              isEmailOpened: 0,
            })
            .where(
              eq(bookingSplitPayment.id, result?.id)
              // and(
              //   eq(bookingSplitPayment.email, result?.email),
              //   eq(bookingSplitPayment.bookingId, result?.bookingId),
              //   eq(bookingSplitPayment.isActive, 1),
              //   eq(bookingSplitPayment.paymentId, result?.paymentId),
              // )
            )
            .execute()
            .catch(async (e: any) => {
              await loggerService.errorLog({
                message: "ERROR_UPDATING_FINIX_PAYMENT_STATUS",
                userId: "",
                url: "/auth",
                userAgent: "",
                stackTrace: `${JSON.stringify(e)}`,
                additionalDetailsJSON: JSON.stringify({
                  paymentId: result?.paymentId,
                  id: result?.id,
                  provider: "hyperswitch",
                }),
              });
            });
          //await this.cancelPaymentIntent(result.paymentId);
          const resultPaymentLink = await this.createPaymentLink(
            amount,
            email,
            bookingId,
            origin,
            totalPayoutAmount,
            collectPaymentProcessorCharge,
            courseLogo,
            additonalMessge,
            userEmail,
            index
          );
          console.log("resultPaymentLink", resultPaymentLink);
          return resultPaymentLink;
        }
      }
    } catch (e: any) {
      console.log(e);
      await loggerService.errorLog({
        message: "INTERNAL_SERVER_ERROR",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: `${JSON.stringify(e)}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: "",
          referencePaymentId: "",
          provider: "",
        }),
      });
      throw new Error(e.message);
    }
  };

  getPaymentLinkByPaymentId = async (paymentId: string) => {
    try {
      const paymentProcessor = String(process.env.SPLIT_PAYMENT_PROCESSOR);
      if (paymentProcessor === "finix") {
        const [result] = await this.database
          .select({ paymentLink: bookingSplitPayment.paymentLink })
          .from(bookingSplitPayment)
          .where(and(eq(bookingSplitPayment.paymentId, paymentId)));
        return {
          error: false,
          message: "Payment-Link fetch Successful",
          paymentLink: result?.paymentLink,
        };
      } else {
        const [result] = await this.database
          .select({ paymentLink: bookingSplitPayment.paymentLink })
          .from(bookingSplitPayment)
          .where(and(eq(bookingSplitPayment.paymentId, paymentId)));
        const paymentStatus = await this.retrievePaymentIntent(paymentId);
        if ((paymentStatus?.status as string) === "cancelled") {
          return {
            error: true,
            message: "Payment-Link fetch failed",
            paymentLink: "",
          };
        } else {
          return {
            error: false,
            message: "Payment-Link fetch Successful",
            paymentLink: result?.paymentLink,
          };
        }
      }
    } catch (error: any) {
      await loggerService.errorLog({
        message: "INTERNAL SERVER ERROR",
        userId: "",
        url: "/auth",
        userAgent: "",
        stackTrace: `${JSON.stringify(error)}`,
        additionalDetailsJSON: JSON.stringify({
          paymentId: paymentId,
          provider: "",
        }),
      });
      throw new Error("Error while fetching for payment link");
    }
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
  saveSplitPaymentAmountIntoCashOut = async (bookingId: string, amount: number) => {
    try {
      const [result] = await this.database
        .select({
          ownerId: bookings.ownerId,
          originalAmountBeforeAddingCharges: bookingSplitPayment.payoutAmount,
          isPaid: bookingSplitPayment.isPaid,
        })
        .from(bookings)
        .leftJoin(bookingSplitPayment, eq(bookingSplitPayment.bookingId, bookingId))
        .where(eq(bookings.id, bookingId));
      if (!result) {
        throw new Error("Error while fetching for booking");
      }
      const currentDate = new Date();
      const radeemAfterMinutes = await appSettingService.get("CASH_OUT_AFTER_MINUTES");
      const redeemAfterDate = this.addMinutes(currentDate, Number(radeemAfterMinutes));
      const customerRecievableData = [
        {
          id: randomUUID(),
          userId: result?.ownerId,
          amount: result?.originalAmountBeforeAddingCharges ?? 0,
          type: "SPLIT_PAYMENT",
          transferId: "",
          sensibleAmount: 0,
          createdDateTime: this.formatCurrentDateTime(currentDate),
          redeemAfter: this.formatCurrentDateTime(redeemAfterDate),
        },
      ];
      await this.database
        .insert(customerRecievable)
        .values(customerRecievableData)
        .catch(async (err: any) => {
          this.logger.error(err);
          await loggerService.errorLog({
            userId: "",
            url: `/HyperSwitchWebhookService/handleSecondHandItem`,
            userAgent: "",
            message: "ERROR_CREATING_CUSTOMER_RECEIVABLE_FOR_TEE_TIME",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              customerRecievableData,
            }),
          });
        });
    } catch (err: any) {
      await loggerService.errorLog({
        userId: "",
        url: `/HyperSwitchWebhookService/handleSecondHandItem`,
        userAgent: "",
        message: "INTERNAL SERVER ERROR",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          bookingId: bookingId,
          amount: amount,
        }),
      });
      throw new Error("Error while saving split payment amount");
    }
  };
  getSplitPaymentUsersByBookingId = async (bookingId: string) => {
    try {
      const result = await this.database
        .select({
          email: bookingSplitPayment.email,
          amount: bookingSplitPayment.payoutAmount,
          isPaid: bookingSplitPayment.isPaid,
          index: bookingSplitPayment.savedIndex,
        })
        .from(bookingSplitPayment)
        .where(and(eq(bookingSplitPayment.bookingId, bookingId), eq(bookingSplitPayment.isActive, 1)));
      return result;
    } catch (err: any) {
      await loggerService.errorLog({
        userId: "",
        url: "",
        userAgent: "",
        message: "INTERNAL SERVER ERROR",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          bookingId: bookingId,
        }),
      });
      throw new Error("Error while fetching split payment users");
    }
  };
}
