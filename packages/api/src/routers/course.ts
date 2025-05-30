import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const courseRouter = createTRPCRouter({
  getCoursePreviewImage: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getCoursePreviewImage(input.courseId);
    }),
  getAllSwitchCourses: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getAllSwitchCourses(input.courseId);
    }),
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
        availableSlots: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getCourseService()
        .getNumberOfPlayersByCourse(input.courseId, input.time, input.date, input.availableSlots);
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

  getAuthenticationMethods: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getAuthenticationMethods(input.courseId);
    }),
  getMobileViewVersion: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getMobileViewVersion(input.courseId);
    }),
  getDesktopViewVersion: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getDesktopViewVersion(input.courseId);
    }),
  getPhoneNumberMandatoryAtCheckout: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCourseService().getPhoneNumberMandatoryAtCheckout(input.courseId);
    }),
});
