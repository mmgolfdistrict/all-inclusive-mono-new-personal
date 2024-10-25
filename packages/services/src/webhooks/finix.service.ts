import { randomUUID } from "crypto";
import { and, eq, sql } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { cashout } from "@golf-district/database/schema/cashout";
import { courses } from "@golf-district/database/schema/courses";
import { customerPaymentDetail } from "@golf-district/database/schema/customerPaymentDetails";
import { users } from "@golf-district/database/schema/users";
import { appSettingService } from "../app-settings/initialized";
import type { CashOutService } from "../cashout/cashout.service";
import type { NotificationService } from "../notification/notification.service";
import { loggerService } from "../webhooks/logging.service";

interface TagDetails {
  customerId: string;
}
interface Identity {
  id: string;
  created_at: string;
  updated_at: string;
  application: string;
  entity: {
    ach_max_transaction_amount: number;
    amex_mid: string | null;
    annual_card_volume: number;
    business_address: string | null;
    business_name: string | null;
    business_phone: string | null;
    business_tax_id_provided: boolean;
    business_type: string | null;
    default_statement_descriptor: string | null;
    discover_mid: string | null;
    dob: string | null;
    doing_business_as: string | null;
    email: string | null;
    first_name: string | null;
    has_accepted_credit_cards_previously: boolean;
    incorporation_date: string | null;
    last_name: string | null;
    max_transaction_amount: number;
    mcc: string | null;
    ownership_type: string | null;
    personal_address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      region: string | null;
      postal_code: string | null;
      country: string | null;
    };
    phone: string | null;
    principal_percentage_ownership: number | null;
    short_business_name: string | null;
    tax_authority: string | null;
    tax_id_provided: boolean;
    title: string | null;
    url: string | null;
  };
  identity_roles: string[];
  tags: {
    customerId: string;
  };
  _links: {
    self: {
      href: string;
    };
    verifications: {
      href: string;
    };
    merchants: {
      href: string;
    };
    settlements: {
      href: string;
    };
    authorizations: {
      href: string;
    };
    transfers: {
      href: string;
    };
    payment_instruments: {
      href: string;
    };
    associated_identities: {
      href: string;
    };
    disputes: {
      href: string;
    };
    application: {
      href: string;
    };
  };
}

interface PaymentInstrument {
  id: string;
  created_at: string;
  updated_at: string;
  application: string;
  created_via: string;
  currency: string;
  disabled_code: string | null;
  disabled_message: string | null;
  enabled: boolean;
  fingerprint: string;
  identity: string;
  instrument_type: string;
  account_type: string;
  bank_account_validation_check: string;
  bank_code: string;
  country: string;
  institution_number: string | null;
  masked_account_number: string;
  name: string;
  transit_number: string | null;
  tags: Record<string, any>;
  third_party: string | null;
  third_party_token: string | null;
  type: string;
  _links: {
    self: {
      href: string;
    };
    authorizations: {
      href: string;
    };
    transfers: {
      href: string;
    };
    verifications: {
      href: string;
    };
    application: {
      href: string;
    };
    identity: {
      href: string;
    };
  };
}

type ResponseCashout = {
  success: boolean;
  error: boolean;
  message: string;
};

type RequestOptions = {
  method: string;
  headers: Headers;
  body?: string;
  redirect: RequestRedirect;
};

export class FinixService {
  protected baseurl = process.env.FINIX_BASE_URL;
  protected username = process.env.FINIX_USERNAME;
  protected password = process.env.FINIX_PASSWORD;
  protected encodedCredentials = btoa(`${this.username}:${this.password}`);
  protected authorizationHeader = `Basic ${this.encodedCredentials}`;
  constructor(
    private readonly database: Db, // private readonly hyperSwitchService: HyperSwitchWebhookService
    private readonly cashoutService: CashOutService,
    private readonly notificationService: NotificationService
  ) {}
  getHeaders = () => {
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/json");
    requestHeaders.append("Finix-Version", process.env.FINIX_VERSION || "2022-02-01");
    requestHeaders.append("Authorization", this.authorizationHeader);
    return requestHeaders;
  };
  createCustomerIdentity = async (userId: string) => {
    const resp = await this.database
      .select()
      .from(users)
      .where(and(eq(users.id, userId)))
      .execute();
    if (!resp[0]) {
      return new Error("User not found");
    }
    const userData = resp[0];

    const firstname = userData?.name?.split(" ")?.[0];
    const lastname = userData?.name?.split(" ")?.[1];

    const raw = JSON.stringify({
      identity_roles: ["RECIPIENT"],
      entity: {
        phone: userData?.phoneNumber,
        first_name: firstname,
        last_name: lastname,
        email: userData?.email,
        personal_address: {
          city: userData.city,
          country: userData?.country,
          region: userData?.state,
          line2: userData?.address1,
          line1: userData?.address2,
          postal_code: userData?.zipcode,
        },
      },
      tags: {
        userId,
      },
    });
    const requestOptions: RequestOptions = {
      method: "POST",
      headers: this.getHeaders(),
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/identities`, requestOptions);
    const customerIdentityData = await response.json();
    if (!customerIdentityData.id) {
      console.log("Error in creating identity", JSON.stringify(customerIdentityData));
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/createCustomerIdentity",
        userAgent: "",
        message: "ERROR_ADDING_BANK_ACCOUNT",
        stackTrace: JSON.stringify(customerIdentityData),
        additionalDetailsJSON: "error adding bank account",
      });
    }
    return customerIdentityData;
  };
  createPaymentInstrument = async (id: string, token: string) => {
    const raw = JSON.stringify({
      token: token,
      type: "TOKEN",
      identity: id,
    });

    const requestOptions: RequestOptions = {
      method: "POST",
      headers: this.getHeaders(),
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/payment_instruments`, requestOptions);
    const paymentInstrumentData = await response.json();
    return paymentInstrumentData;
  };
  createMerchantAccountOnProcessor = async (id: string) => {
    const raw = JSON.stringify({
      processor: process.env.FINIX_PROCESSOR,
    });

    const requestOptions: RequestOptions = {
      method: "POST",
      headers: this.getHeaders(),
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/identities/${id}/merchants`, requestOptions);
    const merchantData = await response.json();
    return merchantData;
  };
  createTransfer = async (amount: number, customerId: string) => {
    try {
      const raw = JSON.stringify({
        merchant: process.env.FINIX_MERCHANT_ID,
        currency: "USD",
        amount,
        destination: customerId,
        operation_key: "PUSH_TO_ACH",
        processor: process.env.FINIX_PROCESSOR,
        idempotency_id: randomUUID(),
      });

      const requestOptions: RequestOptions = {
        method: "POST",
        headers: this.getHeaders(),
        body: raw,
        redirect: "follow",
      };
      console.log("Transfer request data:", raw);
      const response = await fetch(`${this.baseurl}/transfers`, requestOptions);
      const transferData = await response.json();
      console.log("Transfer response data", transferData);
      return transferData;
    } catch (e) {
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId: customerId,
        url: "/createTransfer",
        userAgent: "",
        message: "Transfer Failed",
        stackTrace: "",
        additionalDetailsJSON: "Amount was not transfered",
      });
      console.log("Error in transfer", e);
      throw e;
    }
  };

  createCashoutTransfer = async (
    amount: number,
    customerId: string,
    paymentDetailId: string,
    courseId: string
  ) => {
    const recievableData = await this.cashoutService.getRecievables(customerId);
    if (!recievableData) {
      return new Error("Error Fetching recievable data");
    }
    if (amount > recievableData.withdrawableAmount) {
      return new Error("Amount cannot be more then withdrawable amount");
    }
    const today = new Date().toISOString().split("T")[0];
    const [records] = await this.database
      .select({ count: sql`COUNT(*)` })
      .from(cashout)
      .where(
        and(
          eq(sql`DATE(${cashout.createdDateTime})`, sql`DATE(${today})`),
          eq(cashout.customerId, customerId)
        )
      )
      .execute();
    const limitInNumber: number =
      Number(await appSettingService.get("CASH_OUT_LIMIT_IN_NUMBERS_PER_DAY")) || (1 as number);
    if ((records?.count as number) >= limitInNumber) {
      return new Error(`You cannot make more the ${limitInNumber} transactions per day.`);
    }
    const [allRecords] = await this.database
      .select({ sum: sql`SUM(${cashout.amount})` })
      .from(cashout)
      .where(
        and(
          eq(sql`DATE(${cashout.createdDateTime})`, sql`DATE(${today})`),
          eq(cashout.customerId, customerId)
        )
      )
      .execute();
    console.log(allRecords);
    const limitInAmount: number =
      Number(await appSettingService.get("CASH_OUT_LIMIT_IN_DOLLARS_PER_DAY")) || (1000 as number);
    console.log("creating transfer", recievableData.withdrawableAmount);
    const amountMultiplied = amount * 100;
    if (amountMultiplied + Number((allRecords?.sum as number) || 0) > Number(limitInAmount) * 100) {
      return new Error(
        `You cannot withdraw more than $${limitInAmount} in a day. You have already withdrawn $${
          ((allRecords?.sum as number) || 1) / 100 || 0
        } today.`
      );
    }
    const [paymentInstrumentIdFromBackend] = await this.database
      .select({
        paymentInstrumentId: customerPaymentDetail.paymentInstrumentId,
        id: customerPaymentDetail.id,
      })
      .from(customerPaymentDetail)
      .where(
        and(eq(customerPaymentDetail.customerId, customerId), eq(customerPaymentDetail.id, paymentDetailId))
      )
      .execute();

    const [user] = await this.database
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.id, customerId)))
      .execute();

    const [course] = await this.database
      .select({
        key: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        name: courses.name,
        id: courses.id,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        return [];
      });

    if (!paymentInstrumentIdFromBackend?.paymentInstrumentId) {
      return new Error("Could not find paymentInstrumentId");
    } else {
      // Add function to validate the amount eligible for cashout

      const cashoutData = await this.createTransfer(
        amountMultiplied,
        paymentInstrumentIdFromBackend?.paymentInstrumentId
      );
      const transferId: string = cashoutData.id as string;
      if (transferId) {
        await this.database
          .insert(cashout)
          .values({
            id: randomUUID(),
            amount: amountMultiplied,
            customerId,
            transferId,
            paymentDetailId: paymentInstrumentIdFromBackend.id,
            externalStatus: cashoutData.state,
          })
          .catch((e) => {
            console.log("Error in transfer", e);
            throw "Error in creating cash out";
          });

        // await this.notificationService.createNotification(
        //   customerId,
        //   "Transfer amount",
        //   `Amount Cashed Out ${amount}
        //    Previous Balance ${recievableData.withdrawableAmount / 100}
        //   Current Balance ${recievableData.withdrawableAmount / 100 - amount}
        //   Amount in processing ${recievableData?.availableAmount - recievableData?.withdrawableAmount}
        //   `
        // );
        await this.notificationService.sendEmailByTemplate(
          user?.email ?? "",
          "Cash out successful",
          process.env.SENDGRID_CASHOUT_TRANSFER_TEMPLATE_ID ?? "",
          {
            AmountCashedOut: amount,
            PreviousBalance: recievableData.withdrawableAmount,
            AvailableBalance: recievableData.withdrawableAmount - amount,
            BalanceProcessing: (recievableData?.availableAmount - recievableData?.withdrawableAmount).toFixed(
              2
            ),
            CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
            CourseURL: course?.websiteURL || "",
            CourseName: course?.name,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            CustomerFirstName: user?.name ?? "",
          },
          []
        );
        return { success: true, error: false };
      } else {
        console.log("Transfer not initiated");
        return { success: false, error: true };
      }
    }
  };

  createCashoutCustomerIdentity = async (userId: string, paymentToken: string): Promise<ResponseCashout> => {
    const customerIdentity: Identity = await this.createCustomerIdentity(userId);
    if (!customerIdentity.id) {
      return {
        error: true,
        success: false,
        message: "Some error occured in adding bank account",
      };
    }
    const paymentInstrumentData: PaymentInstrument = await this.createPaymentInstrument(
      customerIdentity.id,
      paymentToken
    );

    const existingRecord = await this.database
      .select({
        id: customerPaymentDetail.id,
      })
      .from(customerPaymentDetail)
      .where(
        and(
          eq(customerPaymentDetail.customerId, userId),
          eq(customerPaymentDetail.accountNumber, paymentInstrumentData.masked_account_number),
          eq(customerPaymentDetail.bankCode, paymentInstrumentData.bank_code),
          eq(customerPaymentDetail.isActive, 1)
        )
      );

    if (existingRecord.length > 0) {
      return {
        success: false,
        error: true,
        message: "It seems that the account details already exist in our system.",
      };
    }

    const merchantData: any = await this.createMerchantAccountOnProcessor(customerIdentity.id);
    if (customerIdentity.id && paymentInstrumentData.id && merchantData.id) {
      await this.database
        .insert(customerPaymentDetail)
        .values({
          id: randomUUID(),
          customerId: userId,
          paymentInstrumentId: paymentInstrumentData.id,
          customerIdentity: customerIdentity.id,
          accountNumber: paymentInstrumentData.masked_account_number,
          bankCode: paymentInstrumentData.bank_code,
          merchantId: merchantData.id,
        })
        .execute();
      return { success: true, error: false, message: "Some error occured in adding bank account" };
    } else {
      return { success: false, error: true, message: "Some error occured in adding bank account" };
    }
  };

  getMerchantById = async (id: string | null) => {
    const requestOptions: RequestOptions = {
      method: "GET",
      headers: this.getHeaders(),
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/merchants/${id}`, requestOptions);
    const merchantData = await response.json();
    return merchantData;
  };

  getPaymentInstruments = async (
    userId: string
  ): Promise<{ id: string; accountNumber: string | null; onboardingStatus: string | null }[]> => {
    const paymentInstruments = await this.database
      .select({
        id: customerPaymentDetail.id,
        accountNumber: customerPaymentDetail.accountNumber,
        merchantId: customerPaymentDetail.merchantId,
        backCode: customerPaymentDetail.bankCode,
      })
      .from(customerPaymentDetail)
      .where(and(eq(customerPaymentDetail.customerId, userId), eq(customerPaymentDetail.isActive, 1)));

    const finalRes: any = [];

    for (const instrument of paymentInstruments) {
      const merchantData = await this.getMerchantById(instrument.merchantId);
      const ddata = { ...instrument, onboardingStatus: merchantData.onboarding_state };
      finalRes.push(ddata as any);
    }

    return finalRes;
  };

  deletePaymentInstrument = async (paymentInstrumentId: string) => {
    try {
      await this.database
        .delete(customerPaymentDetail)
        .where(eq(customerPaymentDetail.id, paymentInstrumentId))
        .execute();
      console.log("Saved bank card deleted successfully.");
    } catch (error) {
      console.log("Error on deleting saved bank card", error);
      throw error;
    }
  };
}
