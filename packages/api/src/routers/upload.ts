import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const uploadRouter = createTRPCRouter({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUploadService().createPresignedUploadURL(input.fileName, input.size);
    }),
  completeUpload: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        uploadId: z.string(),
        parts: z.array(
          z.object({
            ETag: z.string(),
            PartNumber: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory
        .getUploadService()
        .completeUpload(ctx.session.user.id, input.s3Key, input.uploadId, input.parts);
    }),
  abortUpload: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        uploadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.serviceFactory.getUploadService().abortUpload(input.s3Key, input.uploadId);
    }),
});
