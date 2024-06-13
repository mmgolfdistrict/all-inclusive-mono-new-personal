import { type ComponentProps } from "react";
import { BlurImage } from "./images/blur-image";

export const PoweredBy = (props: ComponentProps<"div">) => {
  return (
    <div
      className="flex flex-col items-center justify-center md:flex-row md:gap-1"
      {...props}
    >
      <sup className="text-[10px] text-primary-black md:text-[12px]">
        Powered by
      </sup>
      <BlurImage
        src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/headerlogo.png`}
        alt="golf district logo"
        className="w-[50px] object-fit"
        width={20}
        height={20}
      />
    </div>
  );
};
