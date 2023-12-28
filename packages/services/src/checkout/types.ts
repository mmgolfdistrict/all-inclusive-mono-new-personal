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
}

export interface CustomerCart {
  userId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  phone_country_code: string | null;
  cart: ProductData[];
}
export type ProductData =
  | FirstHandProduct
  | SecondHandProduct
  | SensibleProduct
  | AuctionProduct
  | CharityProduct;

export interface BaseProduct {
  name: string; // teeTime-course-time
  id: string;
  price: number; //int
  image: string; //
  currency: string; //USD
  display_price: string; //$4.00
}

interface FirstHandProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "first_hand";
      tee_time_id: string;
      number_of_bookings: number;
    };
  };
}

interface SecondHandProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "second_hand";
      second_hand_id: string; //listing Id
    };
  };
}

interface SensibleProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "sensible";
      sensible_quote_id: string;
    };
  };
}

interface AuctionProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "auction";
      auction_id: string;
    };
  };
}

interface CharityProduct extends BaseProduct {
  product_data: {
    metadata: {
      type: "charity";
      charity_id: string;
    };
  };
}
