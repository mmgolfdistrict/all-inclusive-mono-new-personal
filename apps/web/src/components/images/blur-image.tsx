"use client";

import Image from "next/image";
import { useState } from "react";
import type { ComponentProps } from "react";

export const BlurImage = (props: ComponentProps<typeof Image>) => {
  const [isLoading, setLoading] = useState<boolean>(true);

  return (
    <Image
      className={`
        duration-700 ease-in-out
        ${props?.className ?? ""}
        ${isLoading ? "scale-105 blur-lg" : "scale-100 blur-0"}
      `}
      onLoadingComplete={() => setLoading(false)}
      {...props}
      alt={props.alt}
    />
  );
};
