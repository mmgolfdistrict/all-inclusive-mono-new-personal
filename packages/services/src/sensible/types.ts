/**
 * The end user's preferred language in BCP47 format.
 * If none are sent, the product default will be used.
 * On quote creation, this field is used to translate the documents section in the response.
 * However, on quote acceptance, this field is also used as the initial lang_locale setting for a new User.
 * If the User already exists with Sensible Weather, their lang_locale will not be updated by this field and
 * the Quote Accept response will respond with the lang_locale preference of the User regardless of what was sent in the request body.
 */
export type Locale = string;

/**
 * 3 character ISO code representing the currency of the quote.
 * Overrides the Product default if provided.
 */
export type Currency = string;

export interface Document {
  name: string;
  link: string;
}

export interface ExposureProtection {
  name: string;
  unit: string;
  upper_threshold: number;
  lower_threshold: number;
}

export interface PayoutTier {
  number_of_hours: number;
  payout_amount: number;
}

export interface PlainLanguage {
  main: PlainLanguageMain;
  details: PlainLanguageDetails;
  documents: Document[];
}

export interface PlainLanguageMain {
  action: string;
  body: string;
  open_details: string;
  suggested_price: string;
  suggested_price_total: string;
  title: string;
}

export interface PlainLanguageDetails {
  action: string;
  close?: string;
  step_1_body: string;
  step_1_heading: string;
  step_2_body: string;
  step_2_heading: string;
  step_3_body: string;
  step_3_heading: string;
  steps_heading: string;
  suggested_price: string;
  suggested_price_total: string;
  summary_body: string;
  summary_body_alt_unit?: string;
  summary_explainer: string;
  summary_heading: string;
  summary_subheading: string;
  summary_tiers: string[];
  summary_times: string;
  title: string;
}

export interface User {
  name: string;
  phone: string;
  email: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface TokenErrorResponse {
  error: string;
  error_description: string;
}

export type AnyErrorResponse = ErrorResponse | TokenErrorResponse;

export interface AccessTokenRequest {
  grant_type: string;
  client_id: string;
  client_secret: string;
  audience: string;
}

export interface AccessTokenSuccessResponse {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

export interface BaseQuoteResponse {
  id: string;
  product_id: string;
  created_at: string;
  lang_locale: Locale;
  coverage_start_date: string;
  coverage_end_date: string;
  currency: Currency;
  coverage_start_hour: string;
  coverage_end_hour: string;
  wholesale_price: number;
  suggested_price: number;
  exposure_name: string;
  exposure_latitude: number;
  exposure_longitude: number;
  exposure_total_coverage_amount: number;
  exposure_protections: ExposureProtection[];
  payout_tiers: PayoutTier[];
}

export interface QuoteSuccessResponse extends BaseQuoteResponse {
  plain_language: PlainLanguage;
}

export interface GetQuoteResponse extends BaseQuoteResponse {
  tax_amount: number;
  tax_rate: number;
  tax_was_assessed: boolean;
  expires_at: string;
  external_id: string;
  plain_language: PlainLanguage;
  documents: Document[];
}

export interface CreateQuoteSuccessResponse extends BaseQuoteResponse {
  plain_language: PlainLanguage;
}

export interface AcceptQuoteSuccessResponse extends BaseQuoteResponse {
  documents: Document[];
  user_email: string;
  reservation_id: string;
  price_charged: number;
  canceled_at: string;
  code: number;
  message: string;
}

export interface CreateQuoteParams {
  product_id: string;
  coverage_start_date: string;
  coverage_end_date: string;
  coverage_start_hour_number?: number;
  coverage_end_hour_number?: number;
  currency: Currency;
  lang_locale?: Locale | null;
  exposure_name: string;
  exposure_latitude: number;
  exposure_longitude: number;
  exposure_total_coverage_amount: number;
  include_plain_language?: boolean;
  external_id?: string | null;
}

export interface AcceptQuoteParams {
  quoteId: string;
  price_charged: number;
  reservation_id: string;
  lang_locale?: Locale;
  user: User;
  product_id: string;
  coverage_start_date: string;
  coverage_end_date: string;
  coverage_start_hour_number?: number;
  coverage_end_hour_number?: number;
  currency: Currency;
  exposure_name: string;
  exposure_latitude: number;
  exposure_longitude: number;
  exposure_total_coverage_amount: number;
}

export interface GetGuaranteeParams {
  product_id: string;
  start_timestamp?: Date;
  end_timestamp?: Date;
  include_canceled?: boolean;
}

export interface Guarantee extends BaseQuoteResponse {
  documents: Document[];
  user_email: string;
  reservation_id: string;
  price_charged: number;
  canceled_at: string;
}
