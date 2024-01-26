import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DeleteIcon } from "../icons/delete";

interface DropMediaProps {
  label: string;
  id: string;
  name: string;
  subtext?: string;
  register: unknown;
  src?: string[];
  isUploading?: boolean;
  allowMultiple: boolean;
}

export const DropMedia = ({
  label,
  id,
  subtext,
  name,
  register,
  src,
  isUploading,
  allowMultiple,
}: DropMediaProps) => {
  const [dragging, setDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string[]>([]);

  useEffect(() => {
    if (src) {
      if (Array.isArray(src) && src.length === 0) {
        return;
      }
      setImageSrc(() => src);
    }
  }, [src]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (isUploading) return;
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (isUploading) return;
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    if (isUploading) return;
    e.preventDefault();
    setDragging(false);
    const inputElement = document.getElementById(id) as HTMLInputElement;
    const file = e?.dataTransfer?.files[0];
    if (inputElement && file) {
      if (
        !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        )
      ) {
        toast.error(
          "Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP file."
        );
        return;
      }
      inputElement.files = e.dataTransfer.files;

      const onChangeEvent = new Event("change", { bubbles: true });
      inputElement.dispatchEvent(onChangeEvent);
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (!allowMultiple) return setImageSrc([reader.result as string]);
      setImageSrc((prev: string[]) => [
        ...(prev || []),
        reader.result as string,
      ]);
    };
    if (file) reader.readAsDataURL(file);
  };

  // const handleFileChange = (e: Event) => {
  //   if (isUploading) return;
  //   const input = e.target as HTMLInputElement;
  //   const file = input.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       setImageSrc((prev: string[] | null) => [
  //         ...(prev || []),
  //         reader.result as string,
  //       ]);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const openFileSystem = () => {
  //   if (isUploading) return;
  //   if (imageSrc?.length > 0) return;
  //   const inputElement = document.getElementById(id);
  //   if (inputElement) {
  //     inputElement.click();
  //   }
  // };

  useEffect(() => {
    const inputElement = document.getElementById(id);
    const dropElement = document.getElementById(`drop-media-${id}`);
    if (inputElement) {
      // inputElement.addEventListener("change", handleFileChange);
    }
    if (dropElement) {
      dropElement.addEventListener("drop", handleDrop);
    }
    return () => {
      if (inputElement) {
        // inputElement.removeEventListener("change", handleFileChange);
      }
      if (dropElement) {
        dropElement.removeEventListener("drop", handleDrop);
      }
    };
  }, [id]);

  return (
    <div
      className={`flex flex-col gap-1 ${isUploading ? "animate-pulse" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      // onClick={openFileSystem}
      id={`drop-media-${id}`}
    >
      <label className="text-[14px] text-primary-gray" htmlFor={id}>
        {label}
      </label>
      <div
        className={`flex items-center justify-between gap-2 rounded-lg transition-colors ${
          dragging ? "bg-secondary-gray" : ""
        }`}
      >
        <div
          className={`flex h-44 w-full flex-col items-center justify-center rounded-lg border border-2 border-dashed border-primary-gray ${
            imageSrc?.length === 0 ? "block" : "hidden"
          }
          `}
        >
          <input
            type="file"
            id={id}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            // @ts-ignore
            {...register(name)}
          />
          <div className="text-sm text-primary-gray">
            Drag & drop an image (PNG, JPG, JPEF, WEBP)
          </div>
          <div className="text-[12px] font-thin">{subtext}</div>
        </div>

        {Array.isArray(imageSrc) && imageSrc.length > 0 ? (
          <div
            className={`flex min-h-[160px] w-full p-4 flex-col gap-2 items-center justify-center ${
              dragging ? "bg-secondary-gray" : "bg-secondary-white"
            } rounded-lg border border-2 border-dashed border-primary-gray`}
          >
            {imageSrc.map((src, idx) => (
              <ImageRow
                src={src}
                key={idx}
                index={idx}
                handleRemoveImage={(src) => {
                  if (Array.isArray(imageSrc)) {
                    setImageSrc(imageSrc.filter((image) => image !== src));
                  }
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ImageRow = ({
  src,
  handleRemoveImage,
  index,
}: {
  src: string;
  handleRemoveImage: (src: string) => void;
  index: number;
}) => {
  const fileExt = useMemo(() => {
    const splitSrc = src.split("/");
    const ext = splitSrc[1]?.split(";")[0];
    return ext ? `.${ext}` : "";
  }, [src]);

  const fileSize = useMemo(() => {
    if (src.startsWith("http") || src.startsWith("https")) {
      void fetch(src)
        .then((response) => response.blob())
        .then((blob) => {
          // Size in bytes
          const sizeInBytes = blob.size;
          // Size in megabytes
          const sizeInMegabytes = sizeInBytes / (1024 * 1024);
          return sizeInMegabytes;
        });
    }
    if (src.startsWith("data:")) {
      // Find the base64 part of the data URL
      const base64Data = src.split(",")[1];
      // Decode the base64 string and get its length
      if (!base64Data) return 0;
      const sizeInBytes = atob(base64Data).length;
      // Convert to megabytes
      const sizeInMegabytes = sizeInBytes / (1024 * 1024);
      return sizeInMegabytes.toFixed(2);
    }
    return 0;
  }, [src]);

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Image
          src={src}
          alt="Dropped file"
          width={36}
          height={36}
          className={`max-w-[36px] min-w-[36px] h-[36px] w-[36px] rounded-md object-cover`}
        />
        <div>
          <div className="text-sm text-primary-gray">
            {index + 1}
            {fileExt}
          </div>
          <div className="text-[12px] font-thin">{fileSize} MB</div>
        </div>
      </div>
      <button onClick={() => handleRemoveImage(src)}>
        <DeleteIcon className="w-[20px] h-[20px] max-w-[20px] max-h-[20px]" />
      </button>
    </div>
  );
};
