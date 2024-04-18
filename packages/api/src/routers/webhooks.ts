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
});
