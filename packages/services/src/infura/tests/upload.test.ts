import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { ImageService } from "../image.service";
import { UploadService } from "../upload.service";

const dbMock = {
  insert: createDrizzleMock([]),
};
describe("upload", () => {
  let uploadsService: UploadService;
  let s3ClientMock: ReturnType<typeof mockClient>;
  let imageServiceMock: ImageService;
  beforeEach(() => {
    s3ClientMock = mockClient(S3Client);
    imageServiceMock = new ImageService(dbMock as any);
    uploadsService = new UploadService(
      dbMock as any,
      "aws_accessKeyId",
      "aws_secretAccessKey",
      "aws_region",
      "bucketName",
      "CLOUDFRONT_DOMAIN",
      imageServiceMock
    );
  });
  afterEach(() => {
    s3ClientMock.restore();
  });
  describe("createPresignedUploadURL", () => {
    it("should create presigned upload URL", async () => {
      //mock create presigned url
      return true;
    });
    it("should throw and error if file type is not an image", async () => {
      await expect(uploadsService.createPresignedUploadURL("test.txt", 5000000)).rejects.toThrow(
        "Invalid file type. Only image files are accepted."
      );
    });
    it("should throw and error if file size is too large", async () => {});
  });
  describe("completeMultipartUpload", () => {
    it("should complete multipart upload", async () => {
      s3ClientMock.on(CompleteMultipartUploadCommand).resolves({});
      vitest.spyOn(imageServiceMock, "storeAsset").mockReturnValue(Promise.resolve("mockS3Key"));
      const result = await uploadsService.completeUpload("userID", "mockS3Key.png", "mockUploadId", []);
      console.log(result);
    });
    it("should throw an error if upload fails", async () => {
      s3ClientMock.on(CompleteMultipartUploadCommand).rejects(new Error("Upload Failed"));
      await expect(uploadsService.completeUpload("userId", "mockS3Key", "mockUploadId", [])).rejects.toThrow(
        "Upload Failed"
      );
    });
  });
  describe("abortMultipartUpload", () => {
    it("should abort multipart upload", async () => {
      s3ClientMock.on(AbortMultipartUploadCommand).resolves({});
      await expect(uploadsService.abortUpload("mockS3Key", "mockUploadId")).resolves.not.toThrow();
    });
    it("should throw an error if upload fails", async () => {
      s3ClientMock.on(AbortMultipartUploadCommand).rejects(new Error("Abort Failed"));
      await expect(uploadsService.abortUpload("mockS3Key", "mockUploadId")).rejects.toThrow("Abort Failed");
    });
  });
});
