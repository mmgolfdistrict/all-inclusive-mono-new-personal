type UploadResponse = {
  completedUploads: { ETag: string | null; PartNumber: number }[];
  invalidUploads: Error[];
};
const PART_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadParts = async (
  file: File,
  urls: Record<number, string>
): Promise<UploadResponse> => {
  const keys = Object.keys(urls);
  const promises: Promise<Response | Error>[] = [];

  for (const indexStr of keys) {
    const index = parseInt(indexStr, 10);
    const start = index * PART_SIZE;
    const end = (index + 1) * PART_SIZE;
    const blob: Blob =
      index < keys.length ? file.slice(start, end) : file.slice(start);

    promises.push(uploadPart(urls[index]!, blob));
  }

  try {
    const results = await Promise.all(promises);

    const invalidUploads = results.filter(
      (result): result is Error => result instanceof Error
    );

    return {
      completedUploads: results.map((part, index) => ({
        ETag: part instanceof Response ? part.headers.get("etag") : null,
        PartNumber: index + 1,
      })),
      invalidUploads,
    };
  } catch (error) {
    console.log("Error uploading parts:", error);
    return { completedUploads: [], invalidUploads: [error as Error] };
  }
};

const uploadPart = async (
  url: string,
  blob: Blob
): Promise<Response | Error> => {
  try {
    const response = await fetch(url, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    return response;
  } catch (error) {
    return error as Error;
  }
};
