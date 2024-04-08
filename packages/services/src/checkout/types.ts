export interface CartValidationError {
  errorType: CartValidationErrors;
  product_id: string;
}
export enum CartValidationErrors {
  TEE_TIME_NOT_AVAILABLE = "TEE_TIME_NOT_AVAILABLE",
  TEE_TIME_PRICE_MISMATCH = "TEE_TIME_PRICE_MISMATCH",
  QUOTE_INVALID = "QUOTE_INVALID",
  AUCTION_NOT_ACTIVE = "AUCTION_NOT_ACTIVE",
  AUCTION_BUY_NOW_PRICE_MISMATCH = "AUCTION_BUY_NOW_PRICE_MISMATCH",
  UNKNOWN_PRODUCT_TYPE = "UNKNOWN_PRODUCT_TYPE",
  CHARITY_NOT_ACTIVE = "CHARITY_NOT_ACTIVE",
}

export interface CustomerCart {
  userId: string;
  courseId: string;
  customerId: string;
  name: string;
  email: string;
  promoCode?: string | null | undefined;
  phone: string | null;
  phone_country_code: string | null;
  paymentId: string | null;
  cart: ProductData[];
}

export interface UpdatePayment {
  currency: string;
  amount: number;
}

export type ProductData =
  | FirstHandProduct
  | SecondHandProduct
  | SensibleProduct
  | AuctionProduct
  | CharityProduct
  | Offer
  | MarkupProduct
  | ConvenienceFeeProduct
  | TaxProduct;

export interface BaseProduct {
  name: string; // teeTime-course-time
  id: string;
  price: number; //int
  image: string; //
  currency: string; //USD
  display_price: string; //$4.00
}

export interface FirstHandProduct extends BaseProduct {
  price: number;
  product_data: {
    metadata: {
      type: "first_hand";
      tee_time_id: string;
      number_of_bookings: number;
    };
  };
}

export interface SecondHandProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "second_hand";
      second_hand_id: string; //listing Id
    };
  };
}

export interface SensibleProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "sensible";
      sensible_quote_id: string;
    };
  };
}

export interface AuctionProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "auction";
      auction_id: string;
    };
  };
}

export interface CharityProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "charity";
      charity_id: string;
      donation_amount: number;
    };
  };
}
export interface Offer extends BaseProduct {
  product_data: {
    metadata: {
      type: "offer";
      booking_ids: string[];
      price: number;
      expires_at: Date;
    };
  };
}
export interface MarkupProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "markup";
    };
  };
}
export interface ConvenienceFeeProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "convenience_fee";
    };
  };
}
export interface TaxProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "taxes";
    };
  };
}
