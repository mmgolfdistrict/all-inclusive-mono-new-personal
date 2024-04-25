import { randomUUID } from "crypto";
import { eq } from "@golf-district/database";
import type { Db } from "@golf-district/database";
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
  protected application_id = process.env.FINIX_APPLICATION_ID;
  protected encodedCredentials = btoa(`${this.username}:${this.password}`);
  protected authorizationHeader = `Basic ${this.encodedCredentials}`;
  constructor(
    private readonly database: Db // private readonly hyperSwitchService: HyperSwitchWebhookService
  ) {}

  createCustomerIdentity = async (tagDetails: TagDetails) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Finix-Version", "2022-02-01");
    myHeaders.append("Authorization", this.authorizationHeader);
    const raw = JSON.stringify({
      identity_roles: ["RECIPIENT"],
      entity: {
        email: tagDetails.customerId,
      },
      tags: tagDetails,
    });

    const requestOptions: RequestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/identities`, requestOptions);
    const customerIdentityData = await response.json();
    return customerIdentityData;
  };
  createPaymentInstrument = async (id: string, token: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Finix-Version", "2022-02-01");
    myHeaders.append("Authorization", this.authorizationHeader);
    const raw = JSON.stringify({
      token: token,
      type: "TOKEN",
      identity: id,
    });

    const requestOptions: RequestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/payment_instruments`, requestOptions);
    const paymentInstrumentData = await response.json();
    return paymentInstrumentData;
  };
  createMerchantAccountOnProcessor = async (id: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Finix-Version", "2022-02-01");
    myHeaders.append("Authorization", this.authorizationHeader);
    const raw = JSON.stringify({
      processor: process.env.FINIX_PROCESSOR,
    });

    const requestOptions: RequestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(`${this.baseurl}/identities/${id}/merchants`, requestOptions);
    const merchantData = await response.json();
    return merchantData;
  };
  createTransfer = async (amount: number, customerId: string) => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Finix-Version", "2022-02-01");
      myHeaders.append("Authorization", this.authorizationHeader);
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
        headers: myHeaders,
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

  createCashoutTransfer = async (amount: number, customerId: string) => {
    const [paymentInstrumentIdFromBackend] = await this.database
      .select({ paymentInstrumentId: customerPaymentDetail.paymentInstrumentId })
      .from(customerPaymentDetail)
      .where(eq(customerPaymentDetail.customerId, customerId))
      .execute();

    if (!paymentInstrumentIdFromBackend?.paymentInstrumentId) {
      return new Error("Could not find paymentInstrumentId");
    } else {
      const cashoutData = await this.createTransfer(
        amount,
        paymentInstrumentIdFromBackend?.paymentInstrumentId
      );
      console.log("=====>cashoutData", cashoutData);
    }
  };

  createCashoutCustomerIdentity = async (
    tagDetails: TagDetails,
    paymentToken: string
  ): Promise<ResponseCashout> => {
    const customerIdentity: Identity = await this.createCustomerIdentity(tagDetails);
    const paymentInstrumentData: PaymentInstrument = await this.createPaymentInstrument(
      customerIdentity.id,
      paymentToken
    );
    const merchantData: any = await this.createMerchantAccountOnProcessor(customerIdentity.id);
    console.log(customerIdentity.id);
    console.log(paymentInstrumentData.id);
    console.log(merchantData.id);

    if (customerIdentity.id && paymentInstrumentData.id && merchantData.id) {
      await this.database
        .insert(customerPaymentDetail)
        .values({
          id: randomUUID(),
          customerId: tagDetails.customerId,
          paymentInstrumentId: paymentInstrumentData.id,
          customerIdentity: customerIdentity.id,
        })
        .execute();
      return { success: true, error: false };
    } else {
      return { success: false, error: true };
    }
  };
}
