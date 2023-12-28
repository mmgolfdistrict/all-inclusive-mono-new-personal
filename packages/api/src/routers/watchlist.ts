import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const watchlistRouter = createTRPCRouter({
  toggleWatchlist: protectedProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getWatchlistService()
        .toggleTeeTimeInWatchlist(ctx.session.user.id, input.teeTimeId);
    }),
  getWatchlist: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getWatchlistService()
        .getWatchlist(ctx.session.user.id, input.courseId, input.limit, input.cursor);
    }),
});
