import React from 'react';
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useElementSize, useIntersectionObserver } from "usehooks-ts";
import { TeeTime } from "../cards/tee-time";
import { Info } from "../icons/info";
import { LeftChevron } from "../icons/left-chevron";
import { Tooltip } from "../tooltip";
import { TeeTimeSkeleton } from "./tee-time-skeleton";
import { useAppContext } from "~/contexts/AppContext";
import { SafeContent } from "~/utils/safe-content";

export const DailyTeeTimes = ({
  date,
  minDate,
  maxDate,
  setError,
  handleLoading,
  courseException,
  dateType,
}: {
  date: string;
  minDate: string;
  maxDate: string;
  setError: (t: string | null) => void;
  handleLoading?: (val: boolean) => void;
  courseException: NotificationObject | null;
  dateType: string
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
  const { course, getAllowedPlayersForTeeTime } = useCourseContext();
  const { entity } = useAppContext();
  const handleScroll = () => {
    const container = overflowRef.current;
    if (!container) return;

    const isAtStart = container.scrollLeft === 0;
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

  const allowedPlayers = useMemo(() => getAllowedPlayersForTeeTime(), [course]);

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
    updateArrowState(container)
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

  useEffect(() => {
    setIsAtStart(true);
    setIsAtEnd(false);
    if (overflowRef.current) {
      overflowRef.current.scrollLeft = 0;
    }
  }, [dateType]);

  const updateArrowState = (container: HTMLElement) => {
    if (!container) return;

    const isAtStart = container.scrollLeft === 0;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 20;

    setIsAtStart(isAtStart);
    setIsAtEnd(isAtEnd);
  };

  useEffect(() => {
    const container = overflowRef.current;
    if (container) {
      updateArrowState(container);

      const handleScroll = () => {
        updateArrowState(container);
      };

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [overflowRef]);

  if (!isLoading && isFetchedAfterMount && allTeeTimes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6">
      <div className="flex flex-wrap justify-between gap-2 unmask-time">
        {isLoading ? (
          <div className="h-8 min-w-[9.375rem] w-[20%] bg-gray-200 rounded-md  animate-pulse unmask-time" />
        ) : (
          <div
            id="tee-time-box"
            className="text-base md:text-xl unmask-time"
            data-testid="date-group-id"
            data-qa={dayMonthDate(date)}
          >
            {dayMonthDate(date)}
          </div>
        )}
        {courseException && (
          <div className="flex-1 flex items-center gap-1">
            <p
              style={{
                backgroundColor: courseException.bgColor,
                color: courseException.color,
              }}
              className={`inline text-left text-[0.8125rem] md:text-lg rounded px-2`}
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
                content={SafeContent({ htmlContent: courseException.longMessage })}
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
              className="text-xs md:text-base unmask-temperature"
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
            <LeftChevron fill={entity?.color1} className="w-[1.3125rem]" />
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
                      allowSplit={i?.allowSplit}
                    />
                  </li>
                );
              }
            })}
            <div
              ref={nextPageRef}
              className="h-[3.125rem] w-[0.0625rem] text-[0.0625rem] text-white"
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
            className={`flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator ${isAtEnd || allTeeTimes.length <= 3 ? 'hidden' : 'flex'}`}
            data-testid="tee-time-right-chevron-id"
            data-qa={dayMonthDate(date)}
            disabled={isAtEnd || allTeeTimes.length <= 3}
          >
            <LeftChevron fill={entity?.color1} className="w-[1.3125rem] rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
