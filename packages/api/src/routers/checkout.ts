import { CustomerCartSchema } from "@golf-district/shared/src/schema/customer-cart-schema";
import { any, z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const PaginationParams = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
});

const CustomerListPaymentMethodsParams = z
  .object({
    type: z.union([
      z.literal("acss_debit"),
      z.literal("afterpay_clearpay"),
      z.literal("alipay"),
      z.literal("au_becs_debit"),
      z.literal("bacs_debit"),
      z.literal("bancontact"),
      z.literal("boleto"),
      z.literal("card"),
      z.literal("card_present"),
      z.literal("customer_balance"),
      z.literal("eps"),
      z.literal("fpx"),
      z.literal("giropay"),
      z.literal("grabpay"),
      z.literal("ideal"),
      z.literal("klarna"),
      z.literal("konbini"),
      z.literal("oxxo"),
      z.literal("p24"),
      z.literal("paynow"),
      z.literal("sepa_debit"),
      z.literal("sofort"),
      z.literal("us_bank_account"),
      z.literal("wechat_pay"),
    ]),
    expand: z.array(z.string()).optional(),
  })
  .merge(PaginationParams);

export const checkoutRouter = createTRPCRouter({
  buildCheckoutSession: protectedProcedure.input(CustomerCartSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory.getCheckoutService().buildCheckoutSession(ctx.session.user.id, input);
  }),
  retrievePaymentMethods: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        params: CustomerListPaymentMethodsParams,
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getHyperSwitchService()
        .retrievePaymentMethods(ctx.session.user.id, input.params);
    }),
  validatePromoCode: protectedProcedure
    .input(
      z.object({
        promoCode: z.string(),
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getCheckoutService()
        .validatePromoCode(ctx.session.user.id, input.promoCode, input.courseId);
    }),
  createPaymentMethod: protectedProcedure
    .input(
      z.object({
        params: any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().createPaymentMethod(input.params);
    }),
  removePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().removePaymentMethod(input.paymentMethodId);
    }),
});
