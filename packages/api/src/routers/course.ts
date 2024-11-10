import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const courseRouter = createTRPCRouter({
  getCourseById: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getCourseById(input.courseId);
    }),
  getSupportedCharitiesForCourseId: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getSupportedCharitiesForCourseId(input.courseId);
    }),
  getNumberOfPlayersByCourse: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        time: z.number().optional(),
        date: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getNumberOfPlayersByCourse(input.courseId, input.time, input.date);
    }),
  getPrivacyPolicyAndTCByCourse: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getPrivacyPolicyAndTCByCourse(input.courseId);
    }),
});
