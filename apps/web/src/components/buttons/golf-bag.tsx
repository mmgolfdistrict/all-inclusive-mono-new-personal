import type { ButtonHTMLAttributes } from "react";
import { GolfBag as GolfBagIcon } from "../icons/golf-bag";

interface GolfBagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: string | number;
  className?: string;
}

export const GolfBag = ({ className, count, ...rest }: GolfBagProps) => {
  return (
    <button className={`relative cursor-pointer ${className ?? ""}`} {...rest} data-testid="golf-count-button-id">
      <GolfBagIcon className="h-[34px] w-[20px] " />
      {Number(count) > 0 && (
        <div className="absolute -right-3.5 top-0 flex h-5 w-5 min-w-fit select-none items-center justify-center rounded-full border-2 border-white bg-red p-1 text-[10px] font-semibold text-white">
          {count}
        </div>
      )}
    </button>
  );
};
