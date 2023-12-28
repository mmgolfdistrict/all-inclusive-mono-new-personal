export interface HyperSwitchEvent {
  merchant_id: string;
  event_id: string;
  event_type: EventType;
  content: Content;
  timestamp: string;
}

interface Content {
  type: "payment_details";
  object: PaymentDetails;
}

interface PaymentDetails {
  payment_id: string | null;
  merchant_id: string | null;
  status: PaymentStatus;
  amount: number;
  amount_capturable?: number;
  amount_received?: number;
  connector: string | null;
  client_secret: string | null;
  created: string | null;
  currency: Currency;
  customer_id: string | null;
  description: string | null;
  refunds: Refund[];
  disputes: Dispute[];
  attempts: Attempt[];
  mandate_id: string | null;
  mandate_data: MandateData | null;
  setup_future_usage: string | null;
  off_session?: boolean;
  capture_on: string | null;
  capture_method: string | null;
  payment_method: PaymentMethod;
  payment_method_data: string | null;
  payment_token: string | null;
  shipping: Shipping | null;
  billing: Billing | null;
  order_details: OrderDetail[] | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  return_url: string | null;
  authentication_type: AuthenticationType | null;
  statement_descriptor_name: string | null;
  statement_descriptor_suffix: string | null;
  next_action: NextAction; // not clearly defined in the provided data
  cancellation_reason: string | null;
  error_code: string | null;
  error_message: string | null;
  payment_experience: string | null;
  payment_method_type: PaymentMethod | null;
  connector_label: string | null;
  business_country: Country;
  business_label: string;
  business_sub_label: string | null;
  allowed_payment_method_types: (PaymentMethod | null)[];
  ephemeral_key: EphemeralKey | null;
  manual_retry_allowed: boolean | null;
  connector_transaction_id: string | null;
  frm_message: any; // not clearly defined in the provided data
  metadata: any;
  connector_metadata: any;
  feature_metadata: any;
  reference_id: string | null;
}

interface Refund {
  refund_id: string;
  payment_id: string;
  amount: number;
  currency: Currency;
  reason: string | null;
  status: RefundStatus;
  metadata: any | null;
  error_message: string | null;
  error_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  connector: string;
}

interface Dispute {
  dispute_id: string;
  dispute_stage: DisputeStage;
  dispute_status: DisputeStatus;
  connector_status: string;
  connector_dispute_id: string;
  connector_reason: string | null;
  connector_reason_code: string | null;
  challenge_required_by: string | null;
  connector_created_at: string | null;
  connector_updated_at: string | null;
  created_at: string;
}

interface Attempt {
  attempt_id: string;
  status: AttemptStatus;
  amount: number;
  currency: Currency | null;
  connector: string | null;
  error_message: string | null;
  payment_method: PaymentMethod | null;
  connector_transaction_id: string | null;
  capture_method: string | null;
  authentication_type: AuthenticationType | null;
  cancellation_reason: string | null;
  mandate_id: string | null;
  error_code: string | null;
  payment_token: string | null;
}

interface EphemeralKey {
  customer_id: string;
  created_at: number;
  expires_at: number;
  secret: string;
}

interface AttemptStatus {
  attempt_id: string;
  status: AttemptsStatus;
  amount: number;
  currency: Currency | null;
  connector: string | null;
  error_message: string | null;
  payment_method: PaymentMethod | null;
  connector_transaction_id: string | null;
}

interface MandateData {
  customer_acceptance: CustomerAcceptance;
  mandate_type: CustomerAcceptance;
}

interface CustomerAcceptance {
  acceptance_type: "online" | "offline";
  accepted_at: string;
  online: Online;
}

interface Online {
  ip_address: string;
  user_agent: string;
}

interface single_use {
  amount: number;
  currency: Currency;
  start_date: Date;
  end_date: Date;
  metadata: object | null;
}

interface NextAction {
  redirect_to_url: string;
  type: "redirect_to_url";
}

interface OrderDetail {
  product_name: string;
  quantity: number;
  amount: number;
}

interface Billing {
  address: Address;
  phone: Phone;
}

interface Address {
  city: string | null; //under 50 characters
  country: Country | null;
  line1: string | null; //under 200 characters
  line2: string | null; //under 50 characters
  line3: string | null; //under 50 characters
  zip: string | null; //under 50 characters
  state: string | null;
  first_name: string | null; //under 255 characters
  last_name: string | null; //under 255 characters
}

interface Phone {
  number: string | null;
  country_code: string | null;
}

interface Shipping {
  address: Address;
  phone: Phone;
}

type EventType =
  | "payment_succeeded"
  | "payment_failed"
  | "payment_processing"
  | "action_required"
  | "refund_succeeded"
  | "refund_failed"
  | "dispute_opened"
  | "dispute_expired"
  | "dispute_accepted"
  | "dispute_cancelled"
  | "dispute_challenged"
  | "dispute_won"
  | "dispute_lost";

type Country =
  | "AF"
  | "AX"
  | "AL"
  | "DZ"
  | "AS"
  | "AD"
  | "AO"
  | "AI"
  | "AQ"
  | "AG"
  | "AR"
  | "AM"
  | "AW"
  | "AU"
  | "AT"
  | "AZ"
  | "BS"
  | "BH"
  | "BD"
  | "BB"
  | "BY"
  | "BE"
  | "BZ"
  | "BJ"
  | "BM"
  | "BT"
  | "BO"
  | "BQ"
  | "BA"
  | "BW"
  | "BV"
  | "BR"
  | "IO"
  | "BN"
  | "BG"
  | "BF"
  | "BI"
  | "KH"
  | "CM"
  | "CA"
  | "CV"
  | "KY"
  | "CF"
  | "TD"
  | "CL"
  | "CN"
  | "CX"
  | "CC"
  | "CO"
  | "KM"
  | "CG"
  | "CD"
  | "CK"
  | "CR"
  | "CI"
  | "HR"
  | "CU"
  | "CW"
  | "CY"
  | "CZ"
  | "DK"
  | "DJ"
  | "DM"
  | "DO"
  | "EC"
  | "EG"
  | "SV"
  | "GQ"
  | "ER"
  | "EE"
  | "ET"
  | "FK"
  | "FO"
  | "FJ"
  | "FI"
  | "FR"
  | "GF"
  | "PF"
  | "TF"
  | "GA"
  | "GM"
  | "GE"
  | "DE"
  | "GH"
  | "GI"
  | "GR"
  | "GL"
  | "GD"
  | "GP"
  | "GU"
  | "GT"
  | "GG"
  | "GN"
  | "GW"
  | "GY"
  | "HT"
  | "HM"
  | "VA"
  | "HN"
  | "HK"
  | "HU"
  | "IS"
  | "IN"
  | "ID"
  | "IR"
  | "IQ"
  | "IE"
  | "IM"
  | "IL"
  | "IT"
  | "JM"
  | "JP"
  | "JE"
  | "JO"
  | "KZ"
  | "KE"
  | "KI"
  | "KP"
  | "KR"
  | "KW"
  | "KG"
  | "LA"
  | "LV"
  | "LB"
  | "LS"
  | "LR"
  | "LY"
  | "LI"
  | "LT"
  | "LU"
  | "MO"
  | "MK"
  | "MG"
  | "MW"
  | "MY"
  | "MV"
  | "ML"
  | "MT"
  | "MH"
  | "MQ"
  | "MR"
  | "MU"
  | "YT"
  | "MX"
  | "FM"
  | "MD"
  | "MC"
  | "MN"
  | "ME"
  | "MS"
  | "MA"
  | "MZ"
  | "MM"
  | "NA"
  | "NR"
  | "NP"
  | "NL"
  | "NC"
  | "NZ"
  | "NI"
  | "NE"
  | "NG"
  | "NU"
  | "NF"
  | "MP"
  | "NO"
  | "OM"
  | "PK"
  | "PW"
  | "PS"
  | "PA"
  | "PG"
  | "PY"
  | "PE"
  | "PH"
  | "PN"
  | "PL"
  | "PT"
  | "PR"
  | "QA"
  | "RE"
  | "RO"
  | "RU"
  | "RW"
  | "BL"
  | "SH"
  | "KN"
  | "LC"
  | "MF"
  | "PM"
  | "VC"
  | "WS"
  | "SM"
  | "ST"
  | "SA"
  | "SN"
  | "RS"
  | "SC"
  | "SL"
  | "SG"
  | "SX"
  | "SK"
  | "SI"
  | "SB"
  | "SO"
  | "ZA"
  | "GS"
  | "SS"
  | "ES"
  | "LK"
  | "SD"
  | "SR"
  | "SJ"
  | "SZ"
  | "SE"
  | "CH"
  | "SY"
  | "TW"
  | "TJ"
  | "TZ"
  | "TH"
  | "TL"
  | "TG"
  | "TK"
  | "TO"
  | "TT"
  | "TN"
  | "TR"
  | "TM"
  | "TC"
  | "TV"
  | "UG"
  | "UA"
  | "AE"
  | "GB"
  | "UM"
  | "UY"
  | "UZ"
  | "VU"
  | "VE"
  | "VN"
  | "VG"
  | "VI"
  | "WF"
  | "EH"
  | "YE"
  | "ZM"
  | "ZW"
  | "US";
type AuthenticationType = "three_ds" | "no_three_ds";
type RefundStatus = "succeeded" | "failed" | "pending" | "review";
type PaymentMethod =
  | "ach"
  | "affirm"
  | "afterpay_clearpay"
  | "alfamart"
  | "ali_pay"
  | "ali_pay_hk"
  | "alma"
  | "apple_pay"
  | "atome"
  | "bacs"
  | "bancontact_card"
  | "becs"
  | "bizum"
  | "blik"
  | "boleto"
  | "bca_bank_transfer"
  | "bni_va"
  | "bri_va"
  | "cimb_va"
  | "classic"
  | "credit"
  | "crypto_currency"
  | "cashapp"
  | "dana"
  | "danamon_va"
  | "debit"
  | "efecty"
  | "eps"
  | "evoucher"
  | "giropay"
  | "givex"
  | "google_pay"
  | "go_pay"
  | "gcash"
  | "ideal"
  | "interac"
  | "indomaret"
  | "klarna"
  | "kakao_pay"
  | "mandiri_va"
  | "mb_way"
  | "mobile_pay"
  | "momo"
  | "multibanco"
  | "online_banking_thailand"
  | "online_banking_czech_republic"
  | "online_banking_finland"
  | "online_banking_fpx"
  | "online_banking_poland"
  | "online_banking_slovakia"
  | "oxxo"
  | "pago_efectivo"
  | "permata_bank_transfer"
  | "pay_bright"
  | "paypal"
  | "pix"
  | "pay_safe_card"
  | "przelewy24"
  | "pse"
  | "red_compra"
  | "red_pagos"
  | "samsung_pay"
  | "sepa"
  | "sofort"
  | "swish"
  | "touch_n_go"
  | "trustly"
  | "twint"
  | "upi_collect"
  | "vipps"
  | "walley"
  | "we_chat_pay";
type DisputeStage = "pre_dispute" | "dispute" | "pre_arbitration";
type DisputeStatus =
  | "dispute_opened"
  | "dispute_expired"
  | "dispute_accepted"
  | "dispute_cancelled"
  | "dispute_challenged"
  | "dispute_won"
  | "dispute_lost";
type AttemptsStatus =
  | "started"
  | "authentication_failed"
  | "router_declined"
  | "authentication_pending"
  | "authentication_successful"
  | "authorized"
  | "authorization_failed"
  | "charged"
  | "authorizing"
  | "cod_initiated"
  | "voided"
  | "void_initiated"
  | "capture_initiated"
  | "capture_failed"
  | "void_failed"
  | "auto_refunded"
  | "partial_charged"
  | "unresolved"
  | "pending"
  | "failure"
  | "payment_method_awaited"
  | "confirmation_awaited"
  | "device_data_collection_pending";

type PaymentStatus =
  | "succeeded"
  | "failed"
  | "cancelled"
  | "processing"
  | "requires_customer_action"
  | "requires_merchant_action"
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_capture";

type Currency =
  | "AED"
  | "ALL"
  | "AMD"
  | "ANG"
  | "ARS"
  | "AUD"
  | "AWG"
  | "AZN"
  | "BBD"
  | "BDT"
  | "BHD"
  | "BIF"
  | "BMD"
  | "BND"
  | "BOB"
  | "BRL"
  | "BSD"
  | "BWP"
  | "BZD"
  | "CAD"
  | "CHF"
  | "CLP"
  | "CNY"
  | "COP"
  | "CRC"
  | "CUP"
  | "CZK"
  | "DJF"
  | "DKK"
  | "DOP"
  | "DZD"
  | "EGP"
  | "ETB"
  | "EUR"
  | "FJD"
  | "GBP"
  | "GHS"
  | "GIP"
  | "GMD"
  | "GNF"
  | "GTQ"
  | "GYD"
  | "HKD"
  | "HNL"
  | "HRK"
  | "HTG"
  | "HUF"
  | "IDR"
  | "ILS"
  | "INR"
  | "JMD"
  | "JOD"
  | "JPY"
  | "KES"
  | "KGS"
  | "KHR"
  | "KMF"
  | "KRW"
  | "KWD"
  | "KYD"
  | "KZT"
  | "LAK"
  | "LBP"
  | "LKR"
  | "LRD"
  | "LSL"
  | "MAD"
  | "MDL"
  | "MGA"
  | "MKD"
  | "MMK"
  | "MNT"
  | "MOP"
  | "MUR"
  | "MVR"
  | "MWK"
  | "MXN"
  | "MYR"
  | "NAD"
  | "NGN"
  | "NIO"
  | "NOK"
  | "NPR"
  | "NZD"
  | "OMR"
  | "PEN"
  | "PGK"
  | "PHP"
  | "PKR"
  | "PLN"
  | "PYG"
  | "QAR"
  | "RON"
  | "RUB"
  | "RWF"
  | "SAR"
  | "SCR"
  | "SEK"
  | "SGD"
  | "SLL"
  | "SOS"
  | "SSP"
  | "SVC"
  | "SZL"
  | "THB"
  | "TRY"
  | "TTD"
  | "TWD"
  | "TZS"
  | "UGX"
  | "USD"
  | "UYU"
  | "UZS"
  | "VND"
  | "VUV"
  | "XAF"
  | "XOF"
  | "XPF"
  | "YER"
  | "ZAR";
