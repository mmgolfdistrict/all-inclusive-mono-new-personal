import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const entityRouter = createTRPCRouter({
  getEntityByDomain: publicProcedure
    .input(
      z.object({
        domain: z.string(),
        rootDomain: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getEntityService().getEntityFromDomain(input.domain, input.rootDomain);
    }),
  getCoursesByEntityId: publicProcedure
    .input(
      z.object({
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getEntityService().getCoursesByEntityId(input.entityId);
    }),
});
