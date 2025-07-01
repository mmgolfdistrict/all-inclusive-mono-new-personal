import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db, eq, type Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { users } from "@golf-district/database/schema/users";
import Logger from "@golf-district/shared/src/logger";
import { loggerService } from "../webhooks/logging.service";
import type { ImageService } from "./image.service";

export interface Part {
  ETag: string;
  PartNumber: number;
}
/**
 * `UploadService` class providing methods to interact with AWS S3 for managing secure file uploads through presigned URLs.
 * @example
 * const uploadService = new UploadService(
 *   'aws_access_key_id',
 *   'aws_secret_access_key',
 *   'aws_region',
 *   'aws_bucket_name',
 *   'aws_cloudfront_domain'
 * );
 *
 * @see {@link createPresignedUploadURL}
 * @see {@link completeUpload}
 * @see {@link abortUpload}
 * @see {@link generatePresignedUrlsParts}
 */
export class UploadService {
  public static PART_SIZE = 5 * 1024 * 1024; // 5MB
  private s3: S3Client;
  private readonly logger = Logger(UploadService.name);
  private readonly config: {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };

  /**
   * Constructs the UploadService.
   * @param {Db} database - The database instance to use for queries.
   * @param {string} aws_accessKeyId - The access key ID for Amazon S3.
   * @param {string} aws_secretAccessKey - The secret access key for Amazon S3.
   * @param {string} aws_region - The AWS region for S3.
   * @param {string} bucketName - The name of the S3 bucket for file uploads.
   * @param {string} CLOUDFRONT_DOMAIN - The CloudFront domain for serving uploaded files.
   * @param {ImageService} imageService - The ImageService instance for processing images.
   * @example
   * const uploadService = new UploadService(dbInstance, 'your-access-key-id', 'your-secret-access-key', 'us-east-1', 'your-s3-bucket', 'your-cloudfront-domain', imageServiceInstance);
   */
  constructor(
    database: Db,
    aws_accessKeyId: string,
    aws_secretAccessKey: string,
    aws_region: string,
    private readonly bucketName: string,
    private readonly CLOUDFRONT_DOMAIN: string,
    private readonly imageService: ImageService
  ) {
    this.config = {
      region: aws_region,
      credentials: {
        accessKeyId: aws_accessKeyId,
        secretAccessKey: aws_secretAccessKey,
      },
    };

    this.s3 = new S3Client(this.config);
  }

  /**
   * Creates a presigned URL for uploading image files to S3. Accepts `.jpg`, `.jpeg`, `.png`, and `.gif` files.
   *
   * @param {string} originalFileName - The original name of the file to be uploaded.
   * @param {number} size - The size of the file to be uploaded.
   *
   * @returns {Promise<object>} A promise that resolves to an object containing the presigned URL details.
   *
   * @throws Will throw an error if the provided file type is not an image.
   */
  createPresignedUploadURL = async (
    originalFileName: string,
    size: number
  ): Promise<{
    uploadId: string;
    parts: Record<number, string>;
    s3Key: string;
  }> => {
    // this.logger.info(`createPresignedUploadURL called with fileName: ${originalFileName}`);
    const extension = originalFileName.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!allowedExtensions.includes(extension!)) {
      this.logger.warn(`Invalid file type. Only image files are accepted. fileName: ${originalFileName}`);
      throw new Error("Invalid file type. Only image files are accepted.");
    }
    let uniqueFileName = `${new Date().toDateString()}-${originalFileName.replaceAll(
      /\s+/g,
      "-"
    )}`.toLowerCase();
    uniqueFileName = uniqueFileName.replace(/[^0-9a-zA-Z._-]/g, "_").replace(/[+&%]/g, "_");
    const params = {
      Bucket: this.bucketName,
      Key: uniqueFileName,
    };
    const multiPartUploadCommand = new CreateMultipartUploadCommand(params);
    const uploadURL = await this.s3.send(multiPartUploadCommand);
    const parts = await this.generatePresignedUrlsParts(
      this.s3,
      uploadURL.UploadId!,
      Math.ceil(size / UploadService.PART_SIZE),
      this.bucketName,
      uniqueFileName
    ).catch((err) => {
      this.logger.error(`createPresignedUploadURL error generating presigned URLs: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/UploadService/CreatePresignedUploadURL",
        userAgent: "",
        message: "ERROR_GENERATE_PRE_SIGNED_URLS",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          originalFileName,
          size,
        }),
      });
      throw err;
    });
    return {
      uploadId: uploadURL.UploadId!,
      parts,
      s3Key: uniqueFileName,
    };
  };

  /**
   * Completes a multipart upload to S3.
   *
   * @param {string} s3Key - The S3 key (filename) for the upload.
   * @param {string} uploadId - The upload ID for the multipart upload.
   * @param {Part[]} parts - An array of parts for the multipart upload.
   *
   * @returns {Promise<void>} A promise that resolves when the upload is completed.
   */
  completeUpload = async (
    userId: string,
    s3Key: string,
    uploadId: string,
    parts: Part[]
  ): Promise<{ key: string; extension: string; assetId: string }> => {
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    };

    const command = new CompleteMultipartUploadCommand(params);

    await this.s3.send(command).catch((err) => {
      this.logger.error(`completeUpload error completing multipart upload: ${err}`);
      loggerService.errorLog({
        userId,
        url: "/UploadService/CompleteUpload",
        userAgent: "",
        message: "ERROR_COMPLETE_MULTIPART_UPLOAD",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          s3Key,
          uploadId,
          parts,
        }),
      });
      throw err;
    });
    const fileNameWithoutExtension = s3Key.replace(/\.[^/.]+$/, "");
    const extension = s3Key.split(".").pop()!;
    const assetId = await this.imageService
      .storeAsset(userId, fileNameWithoutExtension, extension)
      .catch((err) => {
        this.logger.error(`completeUpload error storing asset: ${err}`);
        loggerService.errorLog({
          userId,
          url: "/UploadService/CompleteUpload",
          userAgent: "",
          message: "ERROR_STORE_ASSET",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            s3Key,
            uploadId,
          }),
        });
        throw Error("Error storing asset");
      });
    return {
      key: fileNameWithoutExtension,
      extension: extension,
      assetId: assetId,
    };
  };

  /**
   * Aborts an ongoing multipart upload in S3. This is useful in situations where an upload might have been interrupted
   * or needs to be manually canceled.
   *
   * @param {string} s3Key - The unique S3 key (filename) associated with the upload.
   * @param {string} uploadId - The specific upload ID that corresponds to the multipart upload.
   *
   * @returns {Promise<void>} A promise that resolves when the multipart upload is successfully aborted.
   * @throws Will throw an error if the abort operation fails.
   */
  abortUpload = async (s3Key: string, uploadId: string): Promise<void> => {
    // this.logger.info(`abortUpload called with s3Key: ${s3Key}, uploadId: ${uploadId}`);
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      UploadId: uploadId,
    };
    const command = new AbortMultipartUploadCommand(params);
    await this.s3.send(command).catch((err) => {
      this.logger.error(`abortUpload error aborting upload: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/UploadService/AbortUpload",
        userAgent: "",
        message: "ERROR_ABORTING_UPLOAD",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          s3Key,
          uploadId,
        }),
      });
      throw err;
    });
  };

  /**
   * Generates presigned URLs for each segment of a multipart upload. Multipart uploads are a way to upload large files
   * in smaller parts, and each part can be uploaded separately. This method helps in generating presigned URLs for
   * each of these parts, allowing secure uploads directly to S3 without exposing AWS credentials.
   *
   * @param {S3Client} s3 - An instance of the AWS S3 client.
   * @param {string} uploadId - The unique ID corresponding to the multipart upload.
   * @param {number} parts - The total number of parts the file is divided into.
   * @param {string} bucketName - The name of the S3 bucket where the file will be uploaded.
   * @param {string} key - The desired S3 key (filename) for the uploaded file.
   *
   * @returns {Promise<Record<number, string>>} A promise that resolves to a record. Each key in the record represents
   * the part number, and the value is the corresponding presigned URL for that part.
   * @throws Will throw an error if generating any presigned URL fails.
   */
  private generatePresignedUrlsParts = async (
    s3: S3Client,
    uploadId: string,
    parts: number,
    bucketName: string,
    key: string
  ): Promise<Record<number, string>> => {
    const baseParams = {
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    };

    const promises: UploadPartCommand[] = [];

    for (let index = 0; index < parts; index++) {
      promises.push(new UploadPartCommand({ ...baseParams, PartNumber: index + 1 }));
    }

    const res = await Promise.all(
      await Promise.all(
        promises.map(async (command) => {
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
          return url;
        })
      ).catch((err) => {
        this.logger.error(`generatePresignedUrlsParts error generating presigned URLs: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/UploadService/GeneratePresignedUrlsParts",
          userAgent: "",
          message: "ERROR_GENERATING_PRE_SIGNED_URLS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            uploadId,
            parts,
            bucketName,
            key,
          }),
        });
        throw err;
      })
    ).catch((err) => {
      this.logger.error(`generatePresignedUrlsParts error generating presigned URLs: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/UploadService/GeneratePresignedUrlsParts",
        userAgent: "",
        message: "ERROR_GENERATING_PRE_SIGNED_URLS",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          uploadId,
          parts,
          bucketName,
          key,
        }),
      });
      throw err;
    });
    return res.reduce((map, part, index) => {
      map[index] = part;
      return map;
    }, {} as Record<number, string>);
  };

  /**
   * Deletes a file from an S3 bucket.
   *
   * @param {string} userId - The ID of the user that owns the asset being deleted.
   * @param {string} imageType - The type of image being deleted.
   * @returns {Promise<void>} A promise that resolves when the file is deleted.
   * @throws Will throw an error if the file deletion fails.
   */
  deleteFile = async (userId: string, imageType: "profileImage" | "bannerImage"): Promise<void> => {
    let assetId;
    // this.logger.info("userId", userId);

    if (imageType === "profileImage") {
      const [asset] = await db
        .select({
          assetId: users.image,
        })
        .from(users)
        .where(eq(users.id, userId))
        .execute();
      if (!asset) {
        throw new Error("User or asset not found");
      }
      assetId = asset.assetId;
    } else if (imageType === "bannerImage") {
      const [asset] = await db
        .select({
          assetId: users.bannerImage,
        })
        .from(users)
        .where(eq(users.id, userId))
        .execute();
      if (!asset) {
        throw new Error("User or asset not found");
      }
      assetId = asset.assetId;
    }
    // this.logger.info("assetId", assetId);
    if (!assetId) {
      throw new Error("asset not found");
    }

    const [assetData] = await db
      .select({
        assetKey: assets.key,
        assetExtension: assets.extension,
      })
      .from(assets)
      .where(eq(assets.id, assetId))
      .execute();
    if (!assetData) {
      throw new Error("asset data not found");
    }

    const s3Key = assetData.assetKey + "." + assetData.assetExtension;
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
      await db.update(assets).set({ isDeleted: true }).where(eq(assets.id, assetId)).execute();
    } catch (error: any) {
      this.logger.error(`deleteFileFromS3Bucket error deleting file: ${error}`);
      loggerService.errorLog({
        userId,
        url: "/UploadService/DeleteFile",
        userAgent: "",
        message: "ERROR_DELETING_FILE",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          userId,
          imageType,
          assetId,
          s3Key,
        }),
      });
      throw error;
    }
  };
}
