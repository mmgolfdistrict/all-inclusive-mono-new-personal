import { type ComponentProps } from "react";

export const PoweredBy = (props: ComponentProps<"div">) => {
  return (
    <div
      className="flex flex-col items-center justify-center md:flex-row md:gap-1"
      {...props}
    >
      <sup className="text-[10px] text-primary-black md:text-[12px]">
        Powered by
      </sup>
      <img alt="golf district logo" src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/headerlogo.png`}></img>
    </div>
  );
};
