import {
  TeeTimeType,
  type CombinedObject,
  type NotificationObject,
} from "@golf-district/shared";
import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useDraggableScroll } from "~/hooks/useDraggableScroll";
import { api } from "~/utils/api";
import { dayMonthDate } from "~/utils/formatters";
import { useEffect, useRef, useState } from "react";
import { useElementSize, useIntersectionObserver } from "usehooks-ts";
import { TeeTime } from "../cards/tee-time";
import { Info } from "../icons/info";
import { LeftChevron } from "../icons/left-chevron";
import { Tooltip } from "../tooltip";
import { TeeTimeSkeleton } from "./tee-time-skeleton";

export const DailyTeeTimes = ({
  date,
  minDate,
  maxDate,
  setError,
  handleLoading,
  courseException,
}: {
  date: string;
  minDate: string;
  maxDate: string;
  setError: (t: string | null) => void;
  handleLoading?: (val: boolean) => void;
  courseException: NotificationObject | null;
}) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDraggableScroll(overflowRef, {
    direction: "horizontal",
  });
  const [isAtStart, setIsAtStart] = useState(true);  
  const [isAtEnd, setIsAtEnd] = useState(false);  
  const entry = useIntersectionObserver(nextPageRef, {});
  const isVisible = !!entry?.isIntersecting;
  const [sizeRef] = useElementSize();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const handleScroll = () => {
    const container = overflowRef.current;
    if (!container) return;
  
    const isAtStart = container.scrollLeft  === 0;
    const isAtEnd =
      container.scrollLeft + container.clientWidth + 150 >= container.scrollWidth;
  
    setIsAtStart(isAtStart);
    setIsAtEnd(isAtEnd);
  };

  useEffect(() => {
    const container = overflowRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
  
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);
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
  const teeTimeEndTime = startTime[1];

  const { data: allowedPlayers } =
    api.course.getNumberOfPlayersByCourse.useQuery({
      courseId: courseId ?? "",
    });

  const numberOfPlayers = allowedPlayers?.numberOfPlayers[0];

  const playersCount = numberOfPlayers ? Number(numberOfPlayers) : 0;

  const { data: weather, isLoading: isLoadingWeather } =
    api.searchRouter.getWeatherForDay.useQuery(
      {
        courseId: course?.id ?? "",
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
    refetch,
  } = api.searchRouter.getTeeTimesForDay.useInfiniteQuery(
    {
      courseId: course?.id ?? "",
      date,
      minDate,
      maxDate,
      startTime: teeTimeStartTime,
      endTime: teeTimeEndTime,
      holes: holes === "Any" || holes === "18" ? 18 : 9,
      showUnlisted,
      includesCart,
      golfers: golfers === "Any" ? -1 : golfers,
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

    const count = teeTimeData?.pages[0]?.count;

  const allTeeTimes =
    teeTimeData?.pages[teeTimeData?.pages?.length - 1]?.results ?? [];

  const isScrolling = useRef(false);

  const scrollCarousel = (direction: "left" | "right") => {
    const container = overflowRef.current;
    if (!container) return;

    const boxWidth = 265; // need to change when card width changes
    const containerWidth = container.clientWidth;

    const visibleCount = Math.floor(containerWidth / (boxWidth + 16));
    const scrollAmount = visibleCount * (boxWidth + 16);

    if (direction === "right") {
      container.classList.add("scroll-smooth");
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    } else {
      container.classList.add("scroll-smooth");
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => scrollCarousel("right");
  const scrollLeft = () => scrollCarousel("left");

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

  const getTextColor = (type) => {
    if (type === "FAILURE") return "red";
    if (type === "SUCCESS") return "primary";
    if (type === "WARNING") return "primary-gray";
  };

  if (!isLoading && isFetchedAfterMount && allTeeTimes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6">
      <div className="flex flex-wrap justify-between gap-2 unmask-time">
        {isLoading ? (
          <div className="h-8 min-w-[150px] w-[20%] bg-gray-200 rounded-md  animate-pulse unmask-time" />
        ) : (
          <div
            id="tee-time-box"
            className="text-[16px] md:text-[20px] unmask-time"
            data-testid="date-group-id"
            data-qa={dayMonthDate(date)}
          >
            {dayMonthDate(date)}
          </div>
        )}
        {courseException && (
          <div className="flex-1 flex items-center gap-1">
            <p
              className={`text-${getTextColor(
                courseException.displayType
              )} inline text-left text-[13px] md:text-lg`}
            >
              {courseException.shortMessage}
            </p>

            {courseException.longMessage && (
              <Tooltip
                className="text-left"
                trigger={
                  <span className="cursor-pointer" title="More Info">
                    <Info className="h-4 md:h-5" />
                  </span>
                }
                content={courseException.longMessage}
              />
            )}
          </div>
        )}

        {isLoadingWeather && !weather ? (
          <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
        ) : weather && !isLoadingWeather ? (
          <div className="flex items-center gap-1">
            <div>{WeatherIcons[weather?.iconCode ?? ""]}</div>
            <div
              className="text-[12px] md:text-[16px] unmask-temperature"
              data-testid="weather-degrees-id"
              data-qa={weather?.temperature}
            >
              {weather?.temperature !== 0 ? `${weather?.temperature}°F` : ""}
            </div>
            <div
              className="hidden text-sm text-primary-gray md:block"
              data-testid="weather-text-id"
              data-qa={weather?.shortForecast}
            >
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
            onClick={() => scrollLeft()}
            className={`flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator ${isAtStart ? 'hidden' : 'flex'}`}
            data-testid="tee-time-left-chevron-id"
            data-qa={dayMonthDate(date)}
            // disabled={isAtStart}
          >
            <LeftChevron fill="#40942A" className="w-[21px]" />
          </button>
        </div>

        <div
          className="scrollbar-none w-full flex overflow-x-auto overflow-y-hidden gap-4"
          ref={overflowRef}
          onMouseDown={onMouseDown}
          style={{
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth", // Ensures smooth scrolling behavior
          }}
        >
          <ul
            style={{
              position: "relative",
              display: "flex",
              margin: "0px",
              padding: "0px",
              listStyle: "none",
              overflowY: "visible",
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory", // Makes sure items snap to center
              scrollMarginInlineStart: "2.5em", // Optional margin at the start of scroll
            }}
          >
            {allTeeTimes?.map((i: CombinedObject, idx: number) => {
              if (
                i.firstOrSecondHandTeeTime === TeeTimeType.SECOND_HAND ||
                i.availableSlots >= playersCount
              ) {
                return (
                  <li
                    key={idx}
                    style={{
                      scrollSnapAlign: "start",
                      paddingRight: "16px",
                    }}
                  >
                    <TeeTime
                      time={i.date}
                      key={idx}
                      items={i}
                      index={idx}
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
                      listedSlots={i?.listedSlots}
                      handleLoading={handleLoading}
                      refetch={refetch}
                      groupId={i?.groupId}
                    />
                  </li>
                );
              }
            })}
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
          </ul>
        </div>

        <div className="absolute z-[2] hidden md:block top-1/2 -translate-y-1/2 flex items-center justify-center -right-1 md:-right-6">
          <button
            onClick={scrollRight}
            className={`flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator ${isAtEnd ? 'hidden' : 'flex'}`}
            data-testid="tee-time-right-chevron-id"
            data-qa={dayMonthDate(date)}
            disabled={isAtEnd}
          >
            <LeftChevron fill="#40942A" className="w-[21px] rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
