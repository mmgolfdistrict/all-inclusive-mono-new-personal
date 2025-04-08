import { type ComponentProps, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BlurImage } from "./images/blur-image";

export const PoweredBy = (props: ComponentProps<"div">) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // or a loading skeleton, if desired
  }

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
        src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${isMobile ? "mobileheaderlogonew.png" : "desktopheaderlogo.svg"
          }`}
        width={isMobile ? 45 : 157}
        height={45}
      />
    </div>
  );
};
