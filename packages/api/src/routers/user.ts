import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().getUserById(ctx.session?.user.id, input.userId);
    }),
  getUnreadOffersForCourse: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getNotificationService()
        .getUnreadOffersForCourse(input.courseId, ctx?.session?.user.id);
    }),
  readOffersForCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getNotificationService()
        .readOffersForCourse(ctx.session.user.id, input.courseId);
    }),
  updatePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserService()
        .updatePassword(ctx.session.user.id, input.oldPassword, input.newPassword);
    }),
  updateUser: protectedProcedure
    .input(
      z.object({
        handle: z.string().optional(),
        profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
        profilePictureAssetId: z.string().optional(),
        bannerImageAssetId: z.string().optional(),
        location: z.string().optional(),
        phoneNotifications: z.boolean().optional(),
        emailNotification: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().updateUser(ctx.session.user.id, input);
    }),
  getBookingsOwnedForTeeTime: publicProcedure
    .input(
      z.object({
        teeTimeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserService()
        .getBookingsOwnedForTeeTime(input.teeTimeId, ctx?.session?.user.id);
    }),
});
