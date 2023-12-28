"use client";

import { useOverflowCheck } from "~/hooks/useOverflowCheck";
import { useRef, type ReactNode } from "react";
import { LeftChevron } from "../icons/left-chevron";

export const UpcomingTeeTimes = ({ children }: { children: ReactNode }) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const { isOverflowingLeft, isOverflowingRight } = useOverflowCheck(
    overflowRef,
    []
  );

  const scrollRight = () => {
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: 325 });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  const scrollLeft = () => {
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: -325 });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  return (
    <div
      className={`flex flex-col gap-4 bg-white px-4 py-3 md:rounded-xl md:px-8 md:py-6`}
    >
      <div className="text-[18px] text-secondary-black md:text-[24px]">
        Upcoming tee times
      </div>
      <div
        className="scrollbar-none relative flex gap-4 overflow-x-auto overflow-y-hidden"
        ref={overflowRef}
      >
        {isOverflowingLeft && (
          <div className="sticky left-2 flex items-center justify-center md:left-5">
            <button
              onClick={scrollLeft}
              className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
            >
              <LeftChevron fill="#40942A" className="w-[21px]" />
            </button>
          </div>
        )}
        {children}
        {isOverflowingRight && (
          <div className="sticky right-2 flex items-center justify-center md:right-5">
            <button
              onClick={scrollRight}
              className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
            >
              <LeftChevron fill="#40942A" className="w-[21px] rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
