import { randomUUID } from "crypto";
import { and, eq } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import { cashout } from "@golf-district/database/schema/cashout";
import { customerPaymentDetail } from "@golf-district/database/schema/customerPaymentDetails";

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
};

type RequestOptions = {
  method: string;
  headers: Headers;
  body: string;
  redirect: RequestRedirect;
};

export class FinixService {
  protected baseurl = process.env.FINIX_BASE_URL;
  protected username = process.env.FINIX_USERNAME;
  protected password = process.env.FINIX_PASSWORD;
  protected encodedCredentials = btoa(`${this.username}:${this.password}`);
  protected authorizationHeader = `Basic ${this.encodedCredentials}`;
  constructor(
    private readonly database: Db // private readonly hyperSwitchService: HyperSwitchWebhookService
  ) {}
  getHeaders = () => {
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/json");
    requestHeaders.append("Finix-Version", process.env.FINIX_VERSION || "2022-02-01");
    requestHeaders.append("Authorization", this.authorizationHeader);
    return requestHeaders;
  };
  createCustomerIdentity = async (userId: string) => {
    const raw = JSON.stringify({
      identity_roles: ["RECIPIENT"],
      entity: {},
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
      });

      const requestOptions: RequestOptions = {
        method: "POST",
        headers: this.getHeaders(),
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(`${this.baseurl}/transfers`, requestOptions);
      const transferData = await response.json();
      return transferData;
    } catch (e) {
      console.log("Error in transfer", e);
      throw e;
    }
  };

  createCashoutTransfer = async (amount: number, customerId: string, paymentDetailId: string) => {
    console.log("creating transfer");
    const amountMultiplied = amount * 100;
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

    if (!paymentInstrumentIdFromBackend?.paymentInstrumentId) {
      return new Error("Could not find paymentInstrumentId");
    } else {
      // Add function to validate the amount eligible for cashout

      const cashoutData = await this.createTransfer(
        amountMultiplied,
        paymentInstrumentIdFromBackend?.paymentInstrumentId
      );
      const transferId: string = cashoutData.id as string;

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
          throw "Error in creating cashout";
        });
      return { success: true, error: false };
    }
  };

  createCashoutCustomerIdentity = async (userId: string, paymentToken: string): Promise<ResponseCashout> => {
    const customerIdentity: Identity = await this.createCustomerIdentity(userId);
    const paymentInstrumentData: PaymentInstrument = await this.createPaymentInstrument(
      customerIdentity.id,
      paymentToken
    );
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
        })
        .execute();
      return { success: true, error: false };
    } else {
      return { success: false, error: true };
    }
  };

  getPaymentInstruments = async (userId: string): Promise<{ id: string; accountNumber: string | null }[]> => {
    const paymentInstruments = await this.database
      .select({
        id: customerPaymentDetail.id,
        accountNumber: customerPaymentDetail.accountNumber,
      })
      .from(customerPaymentDetail)
      .where(and(eq(customerPaymentDetail.customerId, userId), eq(customerPaymentDetail.isActive, 1)));
    return paymentInstruments;
  };
}
