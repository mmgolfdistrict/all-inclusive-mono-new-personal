import { forgotPasswordSchema } from "@golf-district/shared/src/schema/forgot-password-schema";
import { z } from "zod";
import { resetPasswordSchema } from "../../../shared/src/schema/reset-password-schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  inviteUser: protectedProcedure
    .input(
      z.object({
        emailOrPhone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().inviteUser(ctx.session.user.id, input.emailOrPhone);
    }),
  getUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().getUserById(input.userId, ctx.session?.user?.id);
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
        .getUnreadOffersForCourse(input.courseId, ctx?.session?.user?.id);
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
        phoneNumber: z.string().optional(),
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
  forgotPasswordRequest: publicProcedure.input(forgotPasswordSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getUserService()
      .forgotPasswordRequest(input.redirectHref, input.email, input.ReCAPTCHA, input.courseProviderId);
  }),
  executeForgotPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getUserService()
      .executeForgotPassword(input.userId, input.verificationToken, input.password);
  }),
  getUpcomingTeeTimesForUser: publicProcedure
    .input(z.object({ userId: z.string(), courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserService()
        .getUpcomingTeeTimesForUser(input.userId, input.courseId, ctx.session?.user?.id);
    }),
  getTeeTimeHistoryForUser: publicProcedure
    .input(z.object({ userId: z.string(), courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().getTeeTimeHistoryForUser(input.userId, input.courseId);
    }),
  getProvidersByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().getProvidersByUserId(input.userId);
    }),
});
