import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const systemNotificationRouter = createTRPCRouter({
  getSystemNotification: publicProcedure.input(z.object({})).query(async ({ ctx, input }) => {
    return await ctx.serviceFactory.getSystemNotificationService().getSystemNotification();
  }),

  getCourseGlobalNotification: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getSystemNotificationService()
        .getCourseGlobalNotification(input.courseId);
    }),

    getWalkthroughSetting: publicProcedure.input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.serviceFactory
        .getSystemNotificationService()
        .getWalkthroughSetting();
    }), 

    getGuidMeSetting: publicProcedure.input(z.object({}))
        .query(async ({ ctx }) => {
          return await ctx.serviceFactory
            .getSystemNotificationService()
            .getGuidMeSetting();
        }),

});
