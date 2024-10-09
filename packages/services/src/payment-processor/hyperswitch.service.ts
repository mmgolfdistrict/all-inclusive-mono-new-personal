/* eslint no-use-before-define: 0 */
import Logger from "@golf-district/shared/src/logger";
import HyperSwitch from "@juspay-tech/hyper-node";
import { db } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import type pino from "pino";
import type { UpdatePayment } from "../checkout/types";
import type {
  CustomerDetails,
  CustomerPaymentMethod,
  CustomerPaymentMethodsResponse,
} from "./types/hyperSwitch.types";
import { NotificationService } from "../notification/notification.service";

/**
 * Service for interacting with the HyperSwitch API.
 */
export class HyperSwitchService {
  protected hyperSwitch: HyperSwitch;
  protected logger: pino.Logger;
  protected hyper: any;
  protected hyperSwitchBaseUrl = process.env.HYPERSWITCH_BASE_URL!; // "https://sandbox.hyperswitch.io";
  protected hyperSwitchApiKey: string;
  protected notificationService: NotificationService;
  protected database: Db;

  /**
   * Constructs a new HyperSwitchService.
   * @param {string} hyperSwitchApiKey - The API key for authenticating with HyperSwitch.
   * @param {pino.Logger} [logger] - Optional logger instance for logging messages.
   */
  constructor(hyperSwitchApiKey: string, logger?: pino.Logger) {
    this.logger = logger ? logger : Logger(HyperSwitchService.name);
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

  /**
   * Creates a new customer using the given parameters.
   * @param params - The details of the customer to be created.
   * @returns Promise resolving to the created customer's data.
   * @throws Will throw an error if the customer creation fails.
   */
  createCustomer = async (params: CustomerDetails) => {
    return await this.hyper.customers.create(params).catch((err: unknown) => {
      this.logger.error(`Error creating customer: ${err}`);
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
    return await this.hyper.customers.retrieve(customerId).catch((err: unknown) => {
      this.logger.error(`Error retrieving customer: ${err}`);
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
    return await this.hyper.customers.del(customerId).catch((err: unknown) => {
      this.logger.error(`Error deleting customer: ${err}`);
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
    return await this.hyper.paymentIntents.create(params, options).catch((err: unknown) => {
      this.logger.error(`Error creating payment intent: ${err}`);
      throw new Error(`Error creating payment intent: ${err}`);
    });
  };

  /**
   * Updates a new payment intent.
   * @param params - Parameters to update the payment intent.
   * @returns Promise resolving to the updated payment intent's data.
   * @throws Will throw an error if the payment intent updation fails.
   */
  updatePaymentIntent = async (paymentId: string, params: UpdatePayment) => {
    return await this.hyper.paymentIntents.update(paymentId, params).catch((err: unknown) => {
      this.logger.error(`Error updating payment intent: ${err}`);
      throw new Error(`Error updating payment intent: ${err}`);
    });
  };

  /**
   * Confirms a payment intent.
   * @param paymentId - The identifier of the payment intent to be confirmed.
   * @returns Promise indicating the result of the confirmation.
   * @throws Will throw an error if the payment intent confirmation fails.
   */
  confirmPaymentIntent = async (paymentId: string) => {
    return await this.hyper.paymentIntents.confirm(paymentId).catch((err: unknown) => {
      this.logger.error(`Error confirming payment intent: ${err}`);
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
    return await this.hyper.paymentIntents.retrieve(paymentId).catch((err: unknown) => {
      this.logger.error(`Error retrieving payment intent: ${err}`);
      throw new Error(`Error retrieving payment intent: ${err}`);
    });
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
    return await this.hyperSwitch.paymentIntents.capture(paymentId).catch((err: unknown) => {
      this.logger.error(`Error capturing payment intent: ${err}`);
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
    } catch (error) {
      this.logger.error("Error retrieving payment methods: ", error);
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
      this.logger.info("Payment method deleted: ", deletedMethod);
      console.log("Payment method deleted", deletedMethod);
    } catch (error) {
      this.logger.error("Error removing payment method: ", error);

      console.log("Payment method deleted");
    }
  };

  sendEmailForFailedPayment = async (paymentMethodId: string) => {
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      await this.notificationService.sendEmail(
        email,
        "A payment has failed ",
        `payment with paymentid ${paymentMethodId} failed`
      );
    });
    return { status: "success" };
  };

sendEmailForBookingFailed = async (paymentId: string) => {
    const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
    const emailAterSplit = adminEmail.split(",");
    emailAterSplit.map(async (email) => {
      await this.notificationService.sendEmail(
        email,
        "A booking has failed ",
        `Hello Admin, A booking with payment id ${paymentId} failed`
      );
    });
    return { status: "success" };
  };
  
  cancelHyperswitchPaymentById = async (paymentMethodId: string) => {
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
      await this.notificationService.sendEmail(
        email,
        "A payment has failed ",
        `payment with paymentid ${paymentMethodId} failed`
      );
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
}
