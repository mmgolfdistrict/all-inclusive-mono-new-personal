import { z } from "zod";

export const creditCardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, { message: "Card Number is required" })
    .max(24, { message: "Invalid card number" }),
  expirationDate: z
    .string()
    .min(1, { message: "Expiration date is required" })
    .max(5),
  type: z.literal("debit").or(z.literal("credit")),
  cardHolderName: z
    .string()
    .min(1, { message: "Card holder name is required" }),
});

export type CreditCardSchemaType = z.infer<typeof creditCardSchema>;
