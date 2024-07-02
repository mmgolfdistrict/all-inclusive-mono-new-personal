import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const systemNotificationRouter = createTRPCRouter({
    getSystemNotification: publicProcedure
    .input(
      z.object({
      })
    )
    .query(async ({ ctx, input }) => {
      return [{
        id:"1234",
        shortMessage:"Test short message",

      }]
    }),
});