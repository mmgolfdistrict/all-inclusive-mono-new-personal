import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const searchRouter = createTRPCRouter({
  courseSearch: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        startDate: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        holes: z.union([z.literal(9), z.literal(18)]),
        golfers: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        showUnlisted: z.boolean(),
        withCart: z.boolean(),
        lowerPrice: z.number(),
        upperPrice: z.number(),
        cursor: z.date().nullable().optional(),
        take: z.number().default(10),
        endDate: z.string(),
        orderBy: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSearchService()
        .searchTeeTimes(
          input.courseId,
          input.startDate,
          input.startTime,
          input.endTime,
          input.holes,
          input.golfers,
          input.showUnlisted,
          input.withCart,
          input.lowerPrice,
          input.upperPrice,
          input.take,
          input.cursor,
          input.endDate,
          input.orderBy,
          ctx.session?.user?.id
        );
    }),
  getTeeTimeById: publicProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSearchService()
        .getTeeTimeById(input.teeTimeId, ctx.session?.user?.id);
    }),
  //maybe this should be private?
  searchUsers: publicProcedure
    .input(
      z.object({
        searchText: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getSearchService().searchUsers(input.searchText);
    }),
  getListingById: publicProcedure
    .input(
      z.object({
        listingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSearchService()
        .getListingById(input.listingId, ctx.session?.user?.id);
    }),
  getUnlistedTeeTimes: publicProcedure
    .input(
      z.object({
        ownerId: z.string(),
        teeTimeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSearchService()
        .getUnlistedTeeTimes(input.ownerId, input.teeTimeId, ctx.session?.user?.id);
    }),
});
