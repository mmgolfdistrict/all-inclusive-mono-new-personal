import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cashOutRouter = createTRPCRouter({
  createStripeAccountLink: protectedProcedure
    .input(
      z.object({
        accountSettingsHref: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getCashOutService()
        .createStripeAccountLink(ctx.session.user.id, input.accountSettingsHref);
    }),
  requestCashOut: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx }) => {
      return await ctx.serviceFactory.getCashOutService().requestCashOut(ctx.session.user.id);
    }),

  getRecievables: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.serviceFactory.getCashOutService().getRecievables(ctx.session?.user?.id ?? "");
  }),

  getRecievablesMute: protectedProcedure.input(z.object({})).mutation(async ({ ctx }) => {
    return ctx.serviceFactory.getCashOutService().getRecievables(ctx.session?.user?.id ?? "");
  }),

  createCashoutCustomerIdentity: protectedProcedure
    .input(
      z.object({
        paymentToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getFinixService()
        .createCashoutCustomerIdentity(ctx.session?.user?.id ?? "", input.paymentToken);
    }),
  createCashoutTransfer: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        paymentInstrumentId: z.string(),
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getFinixService()
        .createCashoutTransfer(
          input.amount,
          ctx.session?.user?.id ?? "",
          input.paymentInstrumentId,
          input.courseId
        );
    }),
  getAssociatedAccounts: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.serviceFactory.getFinixService().getPaymentInstruments(ctx.session?.user?.id ?? "");
  }),
  deletePaymentInstrument: protectedProcedure
    .input(
      z.object({
        paymentInstrumentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getFinixService().deletePaymentInstrument(input.paymentInstrumentId);
    }),
  getCashoutTransactions: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.serviceFactory.getCashOutService().getCashoutTransactions(ctx.session?.user?.id ?? "");
  }),
});
