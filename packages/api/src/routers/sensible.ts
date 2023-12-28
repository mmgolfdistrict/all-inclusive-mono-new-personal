import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const sensibleRouter = createTRPCRouter({
  getQuote: publicProcedure
    .input(
      z.object({
        product_id: z.string(),
        coverageStartDate: z.string(),
        coverageEndDate: z.string(),
        currency: z.string(),
        langLocale: z.string(),
        exposureName: z.string(),
        exposureLatitude: z.number(),
        exposureLongitude: z.number(),
        exposureTotalCoverageAmount: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getSensibleService().getQuote(input);
    }),
});
