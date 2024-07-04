import type { UserCreationData } from "@golf-district/service/src/user/user.service";
import { registerSchema } from "@golf-district/shared";
import { z } from "zod";
import { createTRPCRouter, publicProcedureWithCaptcha } from "../trpc";

export const registerRouter = createTRPCRouter({
  register: publicProcedureWithCaptcha.input(registerSchema).mutation(async ({ input, ctx }) => {
    const createUserData: UserCreationData = {
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      handle: input.username,
      phoneNumber: input.phoneNumber,
      // location: input.location,
      address1: input.address1,
      // address2: input.address2,
      state: input.state,
      city: input.city,
      zipcode: input.zipcode,
      country: input.country,
      redirectHref: input.redirectHref,
      ReCAPTCHA: input.ReCAPTCHA,
    };
    return await ctx.serviceFactory.getUserService().createUser(input?.courseId, createUserData);
  }),
  isValidHandle: publicProcedureWithCaptcha.input(z.string()).query(async ({ input, ctx }) => {
    return await ctx.serviceFactory.getUserService().isValidHandle(input);
  }),
  verifyEmail: publicProcedureWithCaptcha
    .input(
      z.object({
        userId: z.string(),
        token: z.string(),
        courseId: z.string().optional(),
        redirectHref: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.serviceFactory
        .getUserService()
        .verifyUserEmail(input?.courseId, input.userId, input.token, input.redirectHref);
    }),
  generateUsername: publicProcedureWithCaptcha.input(z.number()).query(async ({ input, ctx }) => {
    return await ctx.serviceFactory.getUserService().generateUsername(input);
  }),
});
