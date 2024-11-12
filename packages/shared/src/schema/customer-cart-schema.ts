import { z } from "zod";

// BaseProduct schema
export const BaseProductSchema = z.object({
  name: z.string(),
  id: z.string(),
  price: z.number(),
  image: z.string(),
  currency: z.literal("USD"),
  display_price: z.string(),
});

// FirstHandProduct schema
export const FirstHandProductSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("first_hand"),
      tee_time_id: z.string(),
      number_of_bookings: z.number(),
    }),
  }),
});

// SecondHandProduct schema
export const SecondHandProductSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("second_hand"),
      second_hand_id: z.string(),
    }),
  }),
});

// ConvenienceFee schema
export const ConvenienceFeeSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("convenience_fee"),
    }),
  }),
});

// Markup schema
export const MarkupSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("markup"),
    }),
  }),
});

// Tax schema
export const TaxSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("taxes"),
    }),
  }),
});

// SensibleProduct schema
const SensibleProductSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("sensible"),
      sensible_quote_id: z.string(),
    }),
  }),
});

// AuctionProduct schema
export const AuctionProductSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("auction"),
      auction_id: z.string(),
    }),
  }),
});

// CharityProduct schema
export const CharityProductSchema = BaseProductSchema.extend({
  product_data: z.object({
    metadata: z.object({
      type: z.literal("charity"),
      charity_id: z.string(),
      donation_amount: z.number(),
    }),
  }),
});

// ProductData schema
export const ProductDataSchema = z.union([
  FirstHandProductSchema,
  SecondHandProductSchema,
  ConvenienceFeeSchema,
  MarkupSchema,
  SensibleProductSchema,
  AuctionProductSchema,
  CharityProductSchema,
  TaxSchema,
]);

// CustomerCart schema
export const CustomerCartSchema = z.object({
  userId: z.string(),
  customerId: z.string(),
  courseId: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  promoCode: z.string().nullable().optional(),
  phone_country_code: z.string().nullable(),
  paymentId: z.string().nullable(),
  cart: z.array(ProductDataSchema),
  cartId: z.string().optional(),
  teeTimeId: z.string().optional()
});
