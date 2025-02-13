import { forgotPasswordSchema } from "@golf-district/shared/src/schema/forgot-password-schema";
import { z } from "zod";
import { resetPasswordSchema } from "../../../shared/src/schema/reset-password-schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  inviteUser: protectedProcedure
    .input(
      z.object({
        emailOrPhone: z.string(),
        teeTimeId: z.string(),
        bookingSlotId: z.string(),
        slotPosition: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserService()
        .inviteUser(
          ctx.session.user.id,
          input.emailOrPhone,
          input.teeTimeId,
          input.bookingSlotId,
          input.slotPosition
        );
    }),
  getInvitedUsers: protectedProcedure
    .input(
      z.object({
        emailOrPhoneNumber: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUserService()
        .getInvitedUsers(ctx.session.user.id, input.emailOrPhoneNumber);
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
        name: z.string().optional(),
        handle: z.string().optional(),
        profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
        profilePictureAssetId: z.string().optional(),
        bannerImageAssetId: z.string().optional(),
        courseId: z.string().optional(),
        // location: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        zipcode: z.string().optional(),
        country: z.string().optional(),
        phoneNumberCountryCode: z.number().optional(),
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
        .getBookingsOwnedForTeeTime(input.teeTimeId, ctx?.session?.user?.id);
    }),
  forgotPasswordRequest: publicProcedure.input(forgotPasswordSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getUserService()
      .forgotPasswordRequest(input.redirectHref, input.email, input.ReCAPTCHA, input.courseProviderId);
  }),
  executeForgotPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ ctx, input }) => {
    return await ctx.serviceFactory
      .getUserService()
      .executeForgotPassword(input?.courseId, input.userId, input.verificationToken, input.password);
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
  getS3HtmlContent: publicProcedure.input(z.object({ keyName: z.string() })).query(async ({ ctx, input }) => {
    return ctx.serviceFactory.getUserService().getS3HtmlContent(input.keyName);
  }),

  isUserBlocked: publicProcedure
    .input(
      z.object({
        userEmail: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().isUserBlocked(input.userEmail);
    }),

  addUserSession: protectedProcedure
    .input(
      z.object({
        status: z.string(),
        courseId: z.string(),
        loginMethod: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getAuthService()
        .addUserSession(
          ctx?.session.user.id,
          input.status,
          input.courseId,
          input.loginMethod,
          ctx?.session.ip,
          ctx?.session.userAgent
        );
    }),

  addCourseUser: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUserService().addCourseUser(input.userId, input.courseId);
    }),
});
