"use client";

import { BookingGroup, CombinedObject } from "@golf-district/shared";
import { useOverflowCheck } from "~/hooks/useOverflowCheck";
import { api } from "~/utils/api";
import { useRef } from "react";
import { useElementSize } from "usehooks-ts";
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
  const { isOverflowingLeft, isOverflowingRight } = useOverflowCheck(
    overflowRef,
    []
  );
  const [sizeRef, { width }] = useElementSize();

  const scrollRight = () => {
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: width });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  const scrollLeft = () => {
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: -`${width}` });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  const { data, isLoading, error, isError } =
    api.user.getUpcomingTeeTimesForUser.useQuery({
      courseId,
      userId,
    });

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="text-lg font-semibold">Upcoming tee times</div>
      </div>
      <div className="relative" ref={sizeRef}>
        {isOverflowingLeft && (
          <div className="absolute hidden sm:block left-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-[2] md:left-5">
            <button
              onClick={scrollLeft}
              className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
            >
              <LeftChevron fill="#40942A" className="w-[21px]" />
            </button>
          </div>
        )}
        <div
          className="scrollbar-none flex gap-4 overflow-x-auto overflow-y-hidden md:px-6 px-4 w-full pb-3"
          ref={overflowRef}
        >
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
            data?.map((i: BookingGroup, idx: number) => (
              <TeeTime
                time={i.date ?? ""}
                key={idx}
                items={i}
                index={idx}
                canChoosePlayer={
                  i.availableSlots > 0 && i.teeTimeStatus === "LISTED"
                }
                players={String(i.availableSlots)}
                price={i.pricePerGolfer}
                isOwned={true}
                soldById={i.soldById}
                soldByImage={i.soldByImage}
                soldByName={i.soldByName}
                availableSlots={i.availableSlots}
                teeTimeId={i.teeTimeId}
                isLiked={i.userWatchListed}
                status={
                  i.teeTimeStatus === "LISTED" ? "SECOND_HAND" : "UNLISTED"
                }
                minimumOfferPrice={i.minimumOfferPrice}
                bookingIds={i.bookings}
                listingId={i.listingId ?? undefined}
                firstHandPurchasePrice={i.purchasedFor}
                showFullDate={true}
              />
            ))
          )}
        </div>
        {isOverflowingRight && (
          <div className="absolute right-2 hidden sm:block top-1/2 -translate-y-1/2 flex items-center justify-center z-[2] md:right-5">
            <button
              onClick={scrollRight}
              className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
              data-testid="scroll-right-button-id"
            >
              <LeftChevron fill="#40942A" className="w-[21px] rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
