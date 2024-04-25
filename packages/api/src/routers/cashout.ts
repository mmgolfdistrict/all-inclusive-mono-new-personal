import { string, z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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

  createCashoutCustomerIdentity: publicProcedure
    .input(
      z.object({
        customerTagData: z.object({
          customerId: z.string(),
        }),
        paymentToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getFinixService()
        .createCashoutCustomerIdentity(input.customerTagData, input.paymentToken);
    }),
  createCashoutTransfer: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        paymentInstrumentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getFinixService()
        .createCashoutTransfer(input.amount, input.paymentInstrumentId);
    }),
});
