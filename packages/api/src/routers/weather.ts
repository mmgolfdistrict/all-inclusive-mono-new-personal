import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const weatherRouter = createTRPCRouter({
  geForecast: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getWeatherService().getForecast(input.courseId);
    }),
});
