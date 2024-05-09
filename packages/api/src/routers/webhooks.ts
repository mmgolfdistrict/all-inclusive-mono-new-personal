import { any, z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const webhookRouter = createTRPCRouter({
  foreup: publicProcedure.mutation(async ({ ctx }) => {
    ctx.serviceFactory.getForeupWebhookService().handleWebhook();
    console.log("called");
  }),
  hyperswitch: publicProcedure.mutation(async ({ ctx, input }) => {
    //@TODO validate type maybe?
    ctx.serviceFactory.getHyperSwitchWebhookService().processWebhook(input as any);
  }),
  paymentVerifier: publicProcedure.mutation(async ({ ctx, input }) => {
    ctx.serviceFactory.getPaymentVerifierService().verifyPayment();
  }),
  processPayment: publicProcedure
    .input(
      z.object({
        customer_id: z.string(),
        paymentId: z.string(),
        bookingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getHyperSwitchWebhookService()
        .processPayment(input.paymentId, input.customer_id, input.bookingId);
    }),
  auditLog : publicProcedure
  .input(z.object({
    userId: z.string(),
    teeTimeId: z.string(),
    bookingId: z.string(),
    listingId: z.string(),
    eventId: z.string(),
    json: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getLoggerService()
      .auditLog(input);
  }),
});
