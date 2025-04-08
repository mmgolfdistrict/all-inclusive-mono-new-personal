import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const cacheRouter = createTRPCRouter({
  getCache: publicProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getCacheService().getCache(input.key);
    })
});
