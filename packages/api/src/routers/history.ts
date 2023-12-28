import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const historyRouter = createTRPCRouter({
  getHistoryForTeeTime: publicProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getBookingService().getTeeTimeHistory(input.teeTimeId);
    }),
});
