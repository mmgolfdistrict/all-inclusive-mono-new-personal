import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const profanityRouter = createTRPCRouter({
  checkProfanity: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.serviceFactory.getProfanityService().isProfane(input.text);
    }),
});
