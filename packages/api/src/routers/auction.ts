import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const auctionRouter = createTRPCRouter({
  getAuctionsForCourse: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getAuctionService()
        .getAuctionsForCourse(input.courseId, input.cursor, input.limit);
    }),
  getAuctionById: publicProcedure
    .input(
      z.object({
        auctionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getAuctionService().getAuctionById(input.auctionId);
    }),
  placeBid: protectedProcedure
    .input(
      z.object({
        auctionId: z.string(),
        bid: z.number(),
        paymentMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getAuctionService()
        .placeBid(ctx.session.user.id, input.auctionId, input.bid, input.paymentMethodId);
    }),
  buyNow: protectedProcedure
    .input(
      z.object({
        auctionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getAuctionService().buyNow(ctx.session.user.id, input.auctionId);
    }),
});
