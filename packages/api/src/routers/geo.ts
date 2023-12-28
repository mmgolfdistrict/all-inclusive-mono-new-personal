import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const geoCodeRouter = createTRPCRouter({
  getGeoCode: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getGeoService().geoCodeAddress(input.address);
    }),
});
