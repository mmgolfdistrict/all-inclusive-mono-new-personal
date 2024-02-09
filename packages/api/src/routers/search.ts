import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const searchRouter = createTRPCRouter({
  findBlackoutDates: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getSearchService().findBlackoutDates(input.courseId);
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
  getWeatherForDay: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        date: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getSearchService().getWeatherForDay(input?.courseId, input?.date);
    }),
  getTeeTimesForDay: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        date: z.string(),
        minDate: z.string(),
        maxDate: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        holes: z.union([z.literal(9), z.literal(18)]),
        golfers: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        showUnlisted: z.boolean(),
        includesCart: z.boolean(),
        lowerPrice: z.number(),
        upperPrice: z.number(),
        take: z.number().default(5),
        sortTime: z.enum(["asc", "desc"]).default("asc"),
        sortPrice: z.enum(["asc", "desc"]).default("asc"),
        timezoneCorrection: z.number().default(0),
        cursor: z.number().nullish().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSearchService()
        .getTeeTimesForDay(
          input.courseId,
          input.date,
          input.minDate,
          input.maxDate,
          input.startTime,
          input.endTime,
          input.holes,
          input.golfers,
          input.showUnlisted,
          input.includesCart,
          input.lowerPrice,
          input.upperPrice,
          input.take,
          input.sortTime,
          input.sortPrice,
          input.timezoneCorrection,
          input.cursor,
          ctx.session?.user?.id
        );
    }),
  getFarthestTeeTimeDate: publicProcedure
    .input(z.object({ courseId: z.string(), order: z.enum(["asc", "desc"]).default("asc") }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getSearchService().getFarthestTeeTimeDate(input.courseId, input.order);
    }),
});
