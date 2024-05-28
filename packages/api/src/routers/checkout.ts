import { CustomerCartSchema } from "@golf-district/shared/src/schema/customer-cart-schema";
import { any, z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const checkoutRouter = createTRPCRouter({
  buildCheckoutSession: protectedProcedure.input(CustomerCartSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getCheckoutService()
      .buildCheckoutSession(ctx.session.user.id, input, input.cartId);
  }),
  retrievePaymentMethods: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().retrievePaymentMethods(input.customerId);
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
  retrivePaymentIntent: protectedProcedure
    .input(
      z.object({
        clientSecret: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().retrievePaymentIntent(input.clientSecret);
    }),
});
