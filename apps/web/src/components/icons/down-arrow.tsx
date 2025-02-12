import Image from "next/image";
import type { ImageProps } from 'next/image';
export const DownArrow = (
  props: Omit<ImageProps, "src" | "alt">
): JSX.Element => (
  <Image
    {...props}
    src="https://demo-cdn.golfdistrict.in/down-arrow-circle-svgrepo-com.svg"
    alt="Down Arrow"
    width={800}
    height={800}
  />
);
