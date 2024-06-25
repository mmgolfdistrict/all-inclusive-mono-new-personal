import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userWaitlistRouter = createTRPCRouter({
  sendWaitlistNotifications: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserWaitlistService().sendWaitlistNotifications(input.courseId);
    }),
  sendWaitlistNotificationToUser: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        userId: z.string(),
        courseLogoURL: z.string(),
        subDomainURL: z.string(),
        courseName: z.string(),
        notificationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserWaitlistService()
        .sendWaitlistNotificationToUser(
          input.courseId,
          input.userId,
          input.courseLogoURL,
          input.subDomainURL,
          input.courseName,
          input.notificationId
        );
    }),
  sendNotificationsForAvailableTeeTime: publicProcedure
    .input(z.object({ date: z.string(), time: z.number(), courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserWaitlistService()
        .sendNotificationsForAvailableTeeTime(input.date, input.time, input.courseId);
    }),
  getWaitlist: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserWaitlistService()
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
        .getUserWaitlistService()
        .createWaitlistNotifications({ ...input, userId: ctx.session.user.id });
    }),
  deleteWaitlistNotification: protectedProcedure
    .input(
      z.object({
        ids: z.string().array(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserWaitlistService().deleteWaitlistNotifications(input.ids);
    }),
});
