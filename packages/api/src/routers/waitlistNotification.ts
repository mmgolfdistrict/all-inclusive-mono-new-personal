import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const waitlistNotificationRouter = createTRPCRouter({
  getWaitlist: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getWaitlistNotificationService()
        .getWaitlist(input.userId, input.courseId);
    }),
  createWaitlistNotification: publicProcedure
    .input(
      z.object({
        dates: z.string().array(),
        userId: z.string(),
        courseId: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        playerCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getWaitlistNotificationService().createWaitlistNotifications(input);
    }),
  deleteWaitlistNotification: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getWaitlistNotificationService().deleteWaitlistNotification(input.id);
    }),
});
