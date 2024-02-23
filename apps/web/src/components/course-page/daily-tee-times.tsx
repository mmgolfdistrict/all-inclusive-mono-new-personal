import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { api } from "~/utils/api";
import { dayMonthDate } from "~/utils/formatters";
import { useEffect, useRef } from "react";
import { useElementSize, useIntersectionObserver } from "usehooks-ts";
import { useDraggableScroll } from "../../hooks/useDraggableScroll";
import { TeeTime } from "../cards/tee-time";
import { LeftChevron } from "../icons/left-chevron";
import { TeeTimeSkeleton } from "./tee-time-skeleton";

export const DailyTeeTimes = ({
  date,
  minDate,
  maxDate,
  setError,
  updateCount,
}: {
  date: string;
  minDate: string;
  maxDate: string;
  setError: (t: string | null) => void;
  updateCount: (balance: number) => void;
}) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDraggableScroll(overflowRef, {
    direction: "horizontal",
  });

  const entry = useIntersectionObserver(nextPageRef, {});
  const isVisible = !!entry?.isIntersecting;
  const [sizeRef, { width = 0 }] = useElementSize();

  const { course } = useCourseContext();
  const {
    showUnlisted,
    includesCart,
    golfers,
    holes,
    priceRange,
    startTime,
    sortValue,
  } = useFiltersContext();
  const teeTimeStartTime = startTime[0];
  const teeTimeEndTime = startTime[1] + 59;

  const { data: weather, isLoading: isLoadingWeather } =
    api.searchRouter.getWeatherForDay.useQuery(
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        courseId: course?.id!,
        date,
      },
      {
        enabled: course?.id !== undefined && date !== undefined,
      }
    );

  const TAKE = 8;

  const {
    data: teeTimeData,
    isLoading,
    isFetchedAfterMount,
    isFetchingNextPage,
    fetchNextPage,
    error,
  } = api.searchRouter.getTeeTimesForDay.useInfiniteQuery(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      courseId: course?.id!,
      date,
      minDate,
      maxDate,
      startTime: teeTimeStartTime,
      endTime: teeTimeEndTime,
      holes: holes === "Any" || holes === "18" ? 18 : 9,
      showUnlisted,
      includesCart,
      golfers: golfers === "Any" ? 1 : golfers,
      lowerPrice: priceRange[0]!,
      upperPrice: priceRange[1]!,
      sortTime:
        sortValue === "Sort by time - Early to Late"
          ? "asc"
          : sortValue === "Sort by time - Late to Early"
          ? "desc"
          : "",
      sortPrice:
        sortValue === "Sort by price - Low to High"
          ? "asc"
          : sortValue === "Sort by price - High to Low"
          ? "desc"
          : "",
      timezoneCorrection: course?.timezoneCorrection,
      take: TAKE,
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage?.results?.length === 0) return null;
        if (lastPage?.results?.length < TAKE) return null;
        let c = lastPage.cursor ?? 1;
        c = c + 1;
        return c;
      },
      enabled: course?.id !== undefined && date !== undefined,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    setError(error?.message ?? null);
  }, [error]);

  useEffect(() => {
    const num = teeTimeData?.pages[teeTimeData?.pages?.length - 1]?.count;
    if (!isLoading && isFetchedAfterMount) {
      if (num !== undefined) {
        updateCount(num);
      } else {
        updateCount(0);
      }
    }
  }, [teeTimeData, isLoading, isFetchedAfterMount]);

  const allTeeTimes =
    teeTimeData?.pages[teeTimeData?.pages?.length - 1]?.results ?? [];

  const scrollRight = async () => {
    if (!isLoading) {
      await fetchNextPage();
    }
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: width });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  const getNextPage = async () => {
    if (!isLoading && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  useEffect(() => {
    if (isVisible) {
      void getNextPage();
    }
  }, [isVisible]);

  const scrollLeft = () => {
    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({ left: -`${width}` });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  if (!isLoading && isFetchedAfterMount && allTeeTimes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="text-[13px] md:text-lg">{dayMonthDate(date)}</div>
        {isLoadingWeather && !weather ? (
          <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
        ) : weather && !isLoadingWeather ? (
          <div className="flex items-center gap-1">
            <div>{WeatherIcons[weather?.iconCode ?? ""]}</div>
            <div className="text-[12px] md:text-[16px]">
              {weather?.temperature !== 0 ? `${weather?.temperature}°F` : ""}
            </div>
            <div className="hidden text-sm text-primary-gray md:block">
              {weather?.shortForecast ?? ""}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
      <div className="relative" ref={sizeRef}>
        <div className="absolute top-1/2 hidden md:block -translate-y-1/2 z-[2] flex items-center justify-center -left-1 md:-left-6">
          <button
            onClick={scrollLeft}
            className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
          >
            <LeftChevron fill="#40942A" className="w-[21px]" />
          </button>
        </div>

        <div
          className="scrollbar-none w-full flex overflow-x-auto overflow-y-hidden gap-4"
          ref={overflowRef}
          onMouseDown={onMouseDown}
        >
          {allTeeTimes?.map((i, idx) => (
            <TeeTime
              time={i.date}
              key={idx}
              canChoosePlayer={i.availableSlots > 0}
              availableSlots={i.availableSlots}
              players={String(4 - i.availableSlots)}
              firstHandPurchasePrice={i?.firstHandPurchasePrice}
              price={i.pricePerGolfer}
              isOwned={i?.isOwned}
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
          ))}
          <div
            ref={nextPageRef}
            className="h-[50px] w-[1px] text-[1px] text-white"
          >
            Loading
          </div>

          {isLoading || isFetchingNextPage || !isFetchedAfterMount
            ? Array(TAKE)
                .fill(null)
                .map((_, idx) => <TeeTimeSkeleton key={idx} />)
            : null}
        </div>

        <div className="absolute z-[2] hidden md:block top-1/2 -translate-y-1/2 flex items-center justify-center -right-1 md:-right-6">
          <button
            onClick={scrollRight}
            className="flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator"
          >
            <LeftChevron fill="#40942A" className="w-[21px] rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
