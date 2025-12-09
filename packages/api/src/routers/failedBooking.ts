import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const failedBookingRouter = createTRPCRouter({
    userHasFailedBooking: publicProcedure
        .input(
            z.object({
                userId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            return await ctx.serviceFactory.getFailedBookingService().userHasFailedBooking(input.userId);
        }),
});
