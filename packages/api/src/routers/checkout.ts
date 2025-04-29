import { CustomerCartSchema } from "@golf-district/shared/src/schema/customer-cart-schema";
import { any, z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const checkoutRouter = createTRPCRouter({
  buildCheckoutSession: protectedProcedure.input(CustomerCartSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getCheckoutService()
      .buildCheckoutSession(ctx.session.user.id, input, input.cartId, ctx.session?.ip);
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
  searchCustomerViaEmail: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
        email: z.string(),
        selectedProviderCourseMembershipId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getCheckoutService()
        .searchCustomerAndValidate(
          ctx.session.user.id,
          input.teeTimeId,
          input.email,
          input.selectedProviderCourseMembershipId ?? ""
        );
    }),
  getAllCourseMembership: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.serviceFactory.getCheckoutService().getAllCourseMembership();
  }),
  isAppleEnabledReloadWidget: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.serviceFactory.getCheckoutService().isAppleEnabledReloadWidget();
  }),
  createHyperSwitchPaymentLink: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        email: z.string(),
        bookingId: z.string(),
        origin: z.string(),
        totalPayoutAmount : z.number(),
        collectPaymentProcessorCharge : z.number(),
        courseLogo:z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getHyperSwitchService()
        .createPaymentLink(input.amount, input.email, input.bookingId, input.origin,input.totalPayoutAmount,input.collectPaymentProcessorCharge,input.courseLogo);
    }),

  updateSplitPaymentStatus: publicProcedure
    .input(
      z.object({
        paymentId: z.string(),
        referencePaymentId:z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().updateSplitPaymentStatus(input.paymentId,input.referencePaymentId ?? "");
    }),

  checkEmailedUserPaidTheAmount: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().isEmailedUserPaidTheAmount(input.bookingId);
    }),
  resendHyperSwitchPaymentLink: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        email: z.string(),
        bookingId: z.string(),
        isActive: z.number(),
        origin: z.string(),
        totalPayoutAmount : z.number(),
        collectPaymentProcessorCharge : z.number(),
        courseLogo:z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getHyperSwitchService()
        .resendPaymentLinkToEmailUsers(
          input.email,
          input.amount,
          input.bookingId,
          input.isActive,
          input.origin,
          input.totalPayoutAmount,
          input.collectPaymentProcessorCharge,
          input.courseLogo
        );
    }),
  getPaymentLinkByPaymentId: publicProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().getPaymentLinkByPaymentId(input.paymentId);
    }),
  saveSplitPaymentAmountIntoCashOut : protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().saveSplitPaymentAmountIntoCashOut(input.bookingId, input.amount);
    }),
    getSplitPaymentUsersByBookingId : protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().getSplitPaymentUsersByBookingId(input.bookingId);
    }),

    isCollectPaymentEnabled : protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
      return await ctx.serviceFactory.getCheckoutService().isCollectPaymentEnabled();
    }),
    collectPaymentProcessorPercent : protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
      return await ctx.serviceFactory.getCheckoutService().collectPaymentProcessorPercent();
    })
});
