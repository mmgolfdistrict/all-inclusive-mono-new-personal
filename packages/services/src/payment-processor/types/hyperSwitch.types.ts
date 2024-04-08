import type Stripe from "@juspay-tech/hyper-node";

export type Metadata = Record<string, string>;

export interface CustomerDetails {
  customer_id?: string;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  phone_country_code?: string | null;
  address?: Stripe.Emptyable<Stripe.AddressParam>;
  metadata?: Metadata | null;
}

export interface CustomerPaymentMethodsResponse {
  customer_payment_methods: CustomerPaymentMethod[];
  is_guest_customer?: boolean;
}

export type CustomerPaymentMethod = {
  payment_token: string;
  payment_method_id: string;
  customer_id: string;
  payment_method: PaymentMethodType;
  payment_method_type?: string;
  payment_method_issuer?: string;
  payment_method_issuer_code?: string;
  recurring_enabled: boolean;
  installment_payment_enabled: boolean;
  payment_experience?: PaymentExperience[];
  card?: CardDetails;
  bank?: { mask: string };
  metadata?: object; // Optional object with string keys and values
  created?: string;
  surcharge_details?: object;
  requires_cvv: boolean;
  last_used_at?: string;
  default_payment_method_set: boolean;
};

type PaymentMethodType =
  | "card"
  | "card_redirect"
  | "wallet"
  | "pay_later"
  | "bank_redirect"
  | "bank_transfer"
  | "crypto"
  | "bank_debit"
  | "reward"
  | "upi"
  | "voucher"
  | "gift_card";

type PaymentExperience =
  | "redirect_to_url"
  | "invoke_sdk_client"
  | "display_qr_code"
  | "one_click"
  | "link_wallet"
  | "invoke_payment_app"
  | "display_wait_screen";

type CardDetails = {
  scheme?: string;
  issuer_country?: string;
  last4_digits?: string;
  expiry_month?: string;
  expiry_year?: string;
  card_token?: string;
  card_holder_name?: string;
  card_fingerprint?: string;
  nick_name?: string;
  card_network?: CardNetwork;
  card_isin?: string;
  card_issuer?: string;
  card_type?: string;
  saved_to_locker: boolean;
};

type CardNetwork =
  | "Visa"
  | "Mastercard"
  | "AmericanExpress"
  | "JCB"
  | "DinersClub"
  | "Discover"
  | "CartesBancaires"
  | "UnionPay"
  | "Interac"
  | "RuPay"
  | "Maestro";
