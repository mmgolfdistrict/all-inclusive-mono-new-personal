import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const waitlistNotificationRouter = createTRPCRouter({
  sendNotifications: publicProcedure.query(async ({ ctx }) => {
    await ctx.serviceFactory.getWaitlistNotificationService().sendWaitlistNotifications();
    return "Sending Notifications";
  }),
  getWaitlist: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getWaitlistNotificationService()
        .getWaitlist(ctx.session.user.id, input.courseId);
    }),
  createWaitlistNotification: protectedProcedure
    .input(
      z.object({
        dates: z.string().array(),
        courseId: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        playerCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getWaitlistNotificationService()
        .createWaitlistNotifications({ ...input, userId: ctx.session.user.id });
    }),
  deleteWaitlistNotification: protectedProcedure
    .input(
      z.object({
        ids: z.string().array(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getWaitlistNotificationService().deleteWaitlistNotifications(input.ids);
    }),
});
