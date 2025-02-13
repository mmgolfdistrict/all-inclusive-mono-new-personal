import Image from "next/image";
import type { ComponentProps } from "react";

// Change the url here for production

export const DownArrow = (
  props: Omit<ComponentProps<typeof Image>, "src" | "alt" | "width" | "height">
): JSX.Element => (
  <Image
    {...props}
    src="https://demo-cdn.golfdistrict.in/down-arrow-circle-svgrepo-com.svg"
    alt="Down Arrow"
    width={800}
    height={800}
  />
);
