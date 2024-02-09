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
});
