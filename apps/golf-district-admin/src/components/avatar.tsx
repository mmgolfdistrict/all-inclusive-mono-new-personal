import * as RadixAvatar from "@radix-ui/react-avatar";
import { useState } from "react";

export const Avatar = ({
  src,
  name,
  className,
}: {
  src?: string;
  name?: string;
  className?: string;
}) => {
  const [isLoading, setLoading] = useState<boolean>(true);

  return (
    <RadixAvatar.Root
      className={`inline-flex min-h-[32px] min-w-[32px] max-h-[32px] max-w-[32px] h-[32px] w-[32px] select-none items-center justify-center overflow-hidden rounded-full bg-stroke align-middle duration-700 ease-in-out ${
        isLoading ? "scale-105 blur-lg" : "scale-100 blur-0"
      } ${className ?? ""}`}
    >
      <RadixAvatar.Image
        className={`h-full w-full rounded-full object-cover`}
        src={src ?? "/defaults/default-profile.webp"}
        alt="user"
        onLoadingStatusChange={(status) => {
          if (status === "loaded") {
            setLoading(false);
          }
        }}
      />

      <RadixAvatar.Fallback
        className="leading-1 flex h-full w-full items-center justify-center bg-primary text-[15px] font-medium text-white"
        delayMs={600}
      >
        {name?.slice(0, 1)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
