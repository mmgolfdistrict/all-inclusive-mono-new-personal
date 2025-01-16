import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const releaseHistoryRouter = createTRPCRouter({
  getReleaseHistory: publicProcedure.input(z.object({})).query(async ({ ctx, input }) => {
    return await ctx.serviceFactory.getReleaseHistoryService().getReleaseHistory();
  }),
});
