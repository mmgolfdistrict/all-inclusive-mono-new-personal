import { type ComponentProps } from "react";
import { GolfDistrict } from "./icons/golf-district";
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
      {/* <GolfDistrict
        id={props?.id ?? "powered-by"}
        color="black"
        className="w-[90px] md:w-[80px]"
      /> */}
      <BlurImage
        src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/logo.png`}
        // src="https://d3oay9b1er2tcs.cloudfront.net/fri_dec_08_2023-arrowood-_3_.jpg"
        alt="golf district logo"
        width={150}
        height={100}
        className="w-[50px] object-fit"
      />
    </div>
  );
};
