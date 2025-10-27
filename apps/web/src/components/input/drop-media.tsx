import { useEffect, useState } from "react";
import { Upload } from "../icons/upload";
import { BlurImage } from "../images/blur-image";
import { useAppContext } from "~/contexts/AppContext";

interface DropMediaProps {
  label: string;
  id: string;
  name: string;
  subtext?: string;
  isBackgroundImage?: boolean;
  register: unknown;
  src?: string | null;
  isUploading?: boolean;
  dataTestId?: string;
}

export const DropMedia = ({
  label,
  id,
  subtext,
  name,
  isBackgroundImage,
  register,
  src,
  isUploading,
  dataTestId,
}: DropMediaProps) => {
  const [dragging, setDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { entity } = useAppContext();

  useEffect(() => {
    setImageSrc(src ?? null);
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
      inputElement.files = e.dataTransfer.files;

      const onChangeEvent = new Event("change", { bubbles: true });
      inputElement.dispatchEvent(onChangeEvent);
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleFileChange = (e: Event) => {
    if (isUploading) return;
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileSystem = () => {
    if (isUploading) return;
    const inputElement = document.getElementById(id);
    if (inputElement) {
      inputElement.click();
    }
  };

  useEffect(() => {
    const inputElement = document.getElementById(id);
    const dropElement = document.getElementById(`drop-media-${id}`);
    if (inputElement) {
      inputElement.addEventListener("change", handleFileChange);
    }
    if (dropElement) {
      dropElement.addEventListener("drop", handleDrop);
    }
    return () => {
      if (inputElement) {
        inputElement.removeEventListener("change", handleFileChange);
      }
      if (dropElement) {
        dropElement.removeEventListener("drop", handleDrop);
      }
    };
  }, [id]);

  return (
    <div
      className={`flex cursor-pointer flex-col gap-1 w-full ${isUploading ? "animate-pulse" : ""
        }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={openFileSystem}
      id={`drop-media-${id}`}
      data-testid={dataTestId}
    >
      <div>
        <label
          className="text-[0.875rem] cursor-pointer text-primary-gray"
          htmlFor={id}
        >
          {label}
        </label>
        <div className="text-[0.75rem] cursor-pointer font-thin">{subtext}</div>
      </div>
      <div
        className={`flex items-center justify-between gap-2 rounded-lg transition-colors ${dragging ? " bg-secondary-white" : ""
          }`}
      >
        <div
          className={`flex h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-primary ${!imageSrc ? "block" : "hidden"
            }
          `}
        >
          <input
            type="file"
            id={id}
            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            className="hidden"
            // @ts-ignore
            {...register(name)}
          />
          <Upload className="w-[1.25rem]" fill={entity?.color1} />
          <div className="text-sm text-primary-gray">
            Drag & drop or <span className="text-primary">browse</span>
          </div>
        </div>
        {imageSrc && (
          <BlurImage
            src={imageSrc}
            alt="Dropped file"
            width={isBackgroundImage ? 500 : 176}
            height={176}
            unoptimized
            className={` ${isBackgroundImage
              ? "h-44 w-full rounded-lg object-cover"
              : "min-w-44 h-44 w-44 rounded-full border-4 border-stroke object-cover"
              } `}
          />
        )}
      </div>
    </div>
  );
};
