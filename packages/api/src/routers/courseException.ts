import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const courseExceptionRouter = createTRPCRouter({
  getCourseException: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseExceptionService().getCourseException(input.courseId);
    }),
});
