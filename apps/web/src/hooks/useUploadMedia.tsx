import { assetToURL } from "@golf-district/shared";
import { uploadParts } from "@golf-district/shared/src/utils/upload-parts";
import { api } from "~/utils/api";
import { useState } from "react";
import { toast } from "react-toastify";

export const useUploadMedia = () => {
  const getPresignedUrl = api.upload.getPresignedUrl.useMutation();
  const completeUpload = api.upload.completeUpload.useMutation();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const uploadMedia = async (file: File) => {
    if (isUploading) {
      return;
    }
    setIsUploading(true);
    try {
      const { uploadId, parts, s3Key } = await getPresignedUrl.mutateAsync({
        fileName: file.name,
        size: file.size,
      });
      const { completedUploads, invalidUploads } = await uploadParts(
        file,
        parts
      );
      if (invalidUploads.length > 0) {
        toast.error("An error occurred uploading the media");
        setIsUploading(true);
        return;
      }
      const { key, cdn, extension, assetId } = await completeUpload.mutateAsync(
        {
          s3Key: s3Key,
          uploadId: uploadId,
          parts: completedUploads,
        }
      );
      setIsUploading(false);
      return { assetUrl: assetToURL({ cdn, key, extension }), assetId };
    } catch (error) {
      console.log(error);
      setIsUploading(true);
      toast.error(
        (error as Error).message ?? "An error occurred uploading the media"
      );
    }
  };

  return { uploadMedia, isUploading };
};
