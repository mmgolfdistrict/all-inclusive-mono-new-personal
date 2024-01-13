import { useOverflowCheck } from "~/hooks/useOverflowCheck";
import { dayMonthDate } from "~/utils/formatters";
import type { SearchObject } from "~/utils/types";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { useDraggableScroll } from "../../hooks/useDraggableScroll";
import { TeeTime } from "../cards/tee-time";
import { LeftChevron } from "../icons/left-chevron";

export const DailyTeeTimes = ({
  date,
  weatherDesciption,
  temperature,
  weatherIcon,
  teeTimes,
  ...props
}: {
  date: string;
  weatherIcon: ReactNode;
  temperature: number;
  weatherDesciption: string;
  teeTimes?: SearchObject[];
  props?: ComponentProps<"div">;
}) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const { isOverflowingLeft, isOverflowingRight } = useOverflowCheck(
    overflowRef,
    []
  );
  const { onMouseDown } = useDraggableScroll(overflowRef, {
    direction: "horizontal",
  });

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
      className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6 "
      {...props}
    >
      <div className="flex flex-wrap justify-between gap-2">
        {/* dont add utcOffset to this, the cleaned yyyy-mm-dd is being passed here */}
        <div className="text-[13px] md:text-lg">{dayMonthDate(date)}</div>
        {weatherDesciption !== "" ? (
          <div className="flex items-center gap-1">
            <div>{weatherIcon}</div>
            <div className="text-[12px] md:text-[16px]">{temperature}°F</div>
            <div className="hidden text-sm text-primary-gray md:block">
              {weatherDesciption}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
      <div
        className="scrollbar-none relative flex gap-2 md:gap-4 overflow-x-auto overflow-y-hidden"
        ref={overflowRef}
        onMouseDown={onMouseDown}
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
        {teeTimes && teeTimes.length > 0 ? (
          teeTimes?.map((i, idx) => (
            <TeeTime
              time={i.date}
              key={idx}
              canChoosePlayer={i.availableSlots > 0}
              availableSlots={i.availableSlots}
              players={String(4 - i.availableSlots)}
              firstHandPurchasePrice={i?.firstHandPurchasePrice}
              price={i.pricePerGolfer}
              isForSale={i?.isListed}
              isOwned={
                i?.firstOrSecondHandTeeTime === "SECOND_HAND" ||
                i?.firstOrSecondHandTeeTime === "UNLISTED"
              }
              soldById={i?.soldById}
              soldByImage={i?.soldByImage}
              soldByName={i?.soldByName}
              teeTimeId={i?.teeTimeId}
              isLiked={i?.userWatchListed}
              status={i?.firstOrSecondHandTeeTime}
              minimumOfferPrice={i?.minimumOfferPrice}
              bookingIds={i?.bookingIds ?? []}
              listingId={i?.listingId}
            />
          ))
        ) : (
          <div className="text-center">No times for this date</div>
        )}
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
