import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const imageRouter = createTRPCRouter({
  getAssetUrl: publicProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await ctx.serviceFactory.getImageService().getAsset(input.assetId);
    }),
  storeAsset: protectedProcedure
    .input(
      z.object({
        assetKey: z.string(),
        extension: z.string(),
        cdn: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.serviceFactory
        .getImageService()
        .storeAsset(ctx.session.user.id, input.assetKey, input.extension, input.cdn);
    }),
});
