import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const domainRouter = createTRPCRouter({
  verifyDomain: publicProcedure
    .input(
      z.object({
        domain: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getDomainService().verify(input.domain);
    }),
});
