import { any, z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const webhookRouter = createTRPCRouter({
  // foreup: publicProcedure.mutation(async ({ ctx }) => {
  //   ctx.serviceFactory.getForeupWebhookService().handleWebhook();
  //   console.log("called");
  // }),
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
        redirectHref: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getHyperSwitchWebhookService()
        .processPayment(input.paymentId, input.customer_id, input.bookingId, input.redirectHref);
    }),
  cancelHyperswitchPaymentById: publicProcedure
    .input(
      z.object({
        paymentId: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        userId: z.string().optional(),
        teeTimeId: z.string(),
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().cancelHyperswitchPaymentById(input.paymentId, input.teeTimeId, input.courseId, input.userId, input.email, input.phone);
    }),
  sendEmailForFailedPayment: publicProcedure
    .input(
      z.object({
        paymentId: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        userId: z.string().optional(),
        teeTimeId: z.string(),
        courseId: z.string(),
        cartId: z.string(),
        listingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getHyperSwitchService().sendEmailForFailedPayment(input.paymentId, input.teeTimeId, input.listingId, input.courseId, input.cartId, input.userId, input.email, input.phone);
    }),
  auditLog: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        teeTimeId: z.string(),
        bookingId: z.string(),
        listingId: z.string(),
        courseId: z.string().optional(),
        eventId: z.string(),
        json: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getLoggerService().auditLog(input, ctx?.session?.ip ?? "");
    }),
});
