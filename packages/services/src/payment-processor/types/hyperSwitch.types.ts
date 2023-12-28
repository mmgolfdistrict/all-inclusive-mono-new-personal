import type Stripe from "@juspay-tech/hyper-node";

export interface Metadata {
  [key: string]: string;
}

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
