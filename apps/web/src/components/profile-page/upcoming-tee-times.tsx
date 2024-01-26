"use client";

import { useOverflowCheck } from "~/hooks/useOverflowCheck";
import { api } from "~/utils/api";
import { useEffect, useRef } from "react";
import { TeeTime } from "../cards/tee-time";
import { Skeleton } from "../course-page/skeleton";
import { LeftChevron } from "../icons/left-chevron";

export const UpcomingTeeTimes = ({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const { isOverflowingLeft, isOverflowingRight, handleOverflowCheck } =
    useOverflowCheck(overflowRef, []);

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

  const { data, isLoading, error, isError } =
    api.user.getUpcomingTeeTimesForUser.useQuery({ courseId, userId });

  useEffect(() => {
    handleOverflowCheck();
  }, [data, isLoading, error]);

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="text-lg font-semibold">Upcoming tee times</div>
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
        {isLoading ? (
          Array(3)
            .fill(null)
            .map((_, idx) => <Skeleton key={idx} />)
        ) : isError && error ? (
          <div className="flex justify-center items-center h-[200px]">
            <div className="text-center">Error: {error?.message}</div>
          </div>
        ) : !data || data?.length === 0 ? (
          <div className="flex flex-col items-center w-full justify-center gap-4 px-4 pb-2 h-[200px] text-[14px] md:px-6 md:pb-3">
            <div className="text-center">No tee times found.</div>
          </div>
        ) : (
          data?.map((i, idx) => (
            <TeeTime
              time={i.date ?? ""}
              key={idx}
              canChoosePlayer={i.availableSlots > 0}
              players={String(4 - i.availableSlots)}
              price={i.pricePerGolfer}
              isOwned={!i.isListed}
              soldById={i.soldById}
              soldByImage={i.soldByImage}
              soldByName={i.soldByName}
              availableSlots={i.availableSlots}
              teeTimeId={i.teeTimeId}
              isLiked={i.userWatchListed}
              status={"UNLISTED"}
              // fix status
              minimumOfferPrice={i.minimumOfferPrice}
              bookingIds={i.bookings}
              listingId={""}
              // fix listingId
              firstHandPurchasePrice={i.purchasedFor}
            />
          ))
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
