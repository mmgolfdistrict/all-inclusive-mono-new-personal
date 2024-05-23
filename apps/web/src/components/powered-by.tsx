import { type ComponentProps } from "react";
import { GolfDistrict } from "./icons/golf-district";

export const PoweredBy = (props: ComponentProps<"div">) => {
  return (
    <div
      className="flex flex-col items-center justify-center md:flex-row md:gap-1"
      {...props}
    >
      <div className="text-[10px] text-primary-black md:text-[12px]">
        Powered by
      </div>
      <GolfDistrict
        id={props?.id ?? "powered-by"}
        color="black"
        className="w-[90px] md:w-[80px]"
      />
    </div>
  );
};
