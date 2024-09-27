import { textChangeRangeIsUnchanged } from "typescript";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const clubProphetRouter = createTRPCRouter({
  test: publicProcedure.query(async ({ ctx }) => {
    console.log("called");
    ctx.serviceFactory.getClubprophetWebhookService().handleWebhook();
    return "test clubProphetRouter";
  }),
  testBooking: publicProcedure.query(async ({ ctx }) => {
    console.log("test Booking called");
    ctx.serviceFactory.getClubprophetWebhookService().handleWebhook();
    return "test clubProphetRouter";
  }),
});
