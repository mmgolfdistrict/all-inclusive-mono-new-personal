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

  checkMaxReservationsAndMaxRounds: protectedProcedure
    .input(
      z.object({
        roundsToBook: z.number(),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getCheckoutService()
        .checkMaxReservationsAndMaxRounds(ctx.session.user.id, input.roundsToBook, input.courseId);
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
  checkMultipleTeeTimeTransactionByUser: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.serviceFactory
      .getCheckoutService()
      .checkMultipleTeeTimeTransactionByUser(ctx.session.user.id);
  }),
  createCustomerForHyperSwitch: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.serviceFactory.getCheckoutService().createHyperSwitchNewCustomer(ctx.session.user.id);
  }),
  retrieveCustomerDataByCustomer_ID: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.serviceFactory
      .getCheckoutService()
      .retrieveHyperSwitchRegisteredCustomer(ctx.session.user.id);
  }),
});
