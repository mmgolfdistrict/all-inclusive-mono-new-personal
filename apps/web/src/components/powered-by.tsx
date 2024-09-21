import { type ComponentProps } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BlurImage } from "./images/blur-image";

export const PoweredBy = (props: ComponentProps<"div">) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div
      className="flex flex-col items-center justify-center md:flex-row md:gap-1"
      {...props}
    >
      <sup className="text-[10px] text-primary-black md:text-[12px]">
        Powered by
      </sup>
      <BlurImage
        alt="golf district logo"
        src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
          isMobile ? "mobileheaderlogo.png" : "desktopheaderlogo.svg"
        }`}
        width={`${isMobile ? "157" : "157"}`}
        height={`${isMobile ? "39" : "39"}`}
      />
    </div>
  );
};
