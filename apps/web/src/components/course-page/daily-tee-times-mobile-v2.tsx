import {
  TeeTimeType,
  type CombinedObject,
  type NotificationObject,
} from "@golf-district/shared";
import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { DateType, useFiltersContext } from "~/contexts/FiltersContext";
import { api } from "~/utils/api";
import { dayMonthDate } from "~/utils/formatters";
import { useEffect, useMemo, useRef } from "react";
import { useElementSize, useIntersectionObserver } from "usehooks-ts";
import { useDraggableScroll } from "../../hooks/useDraggableScroll";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import { ChevronUp } from "../icons/chevron-up";
import { TeeTimeV2 } from "../cards/tee-time-v2";
import { TeeTimeSkeletonV2 } from "./tee-time-skeleton-v2";
import { OutlineButton } from "../buttons/outline-button";
import dayjs from "dayjs";
import { CancelIcon } from "../icons/cancel";

export const DailyTeeTimesMobileV2 = ({
  date,
  minDate,
  maxDate,
  setError,
  handleLoading,
  courseException,
  pageDown,
  pageUp,
  scrollY,
  divHeight,
  isLoadingTeeTimeDate,
  allDatesArr,
  // datesWithData
  toggleFilters
}: {
  date: string;
  minDate: string;
  maxDate: string;
  setError: (t: string | null) => void;
  handleLoading?: (val: boolean) => void;
  courseException: NotificationObject | null;
  pageDown: () => void,
  pageUp: () => void
  scrollY: number,
  divHeight?: number,
  isLoadingTeeTimeDate: boolean,
  allDatesArr: string[],
  // datesWithData:string[]
  toggleFilters?: () => void;
}) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDraggableScroll(overflowRef, {
    direction: "horizontal",
  });

  const {
    dateType,
    setDateType,
  } = useFiltersContext();

  const entry = useIntersectionObserver(nextPageRef, {});
  const isVisible = !!entry?.isIntersecting;
  const [sizeRef, { width = 0 }] = useElementSize();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const courseImages = useMemo(() => {
    if (!course) return [];
    return course?.images;
  }, [course]);
  const {
    showUnlisted,
    includesCart,
    golfers,
    holes,
    priceRange,
    startTime,
    sortValue,
    setGolfers,
    setStartTime,
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

  const getNextPage = async () => {
    if (!isLoading && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  useEffect(() => {
    if (isVisible && count !== allTeeTimes?.length) {
      void getNextPage();
    }
  }, [isVisible]);

  const scrollLeft = (scrollWidth = 0) => {
    const boxWidth = overflowRef.current?.children[0]?.clientWidth || 265;
    const getScrollWidth = () => {
      if (width < 700) {
        return boxWidth * 2 + 16 * 2;
      }
      return boxWidth * 3 + 16 * 3;
    };

    overflowRef.current?.classList.add("scroll-smooth");
    overflowRef.current?.scrollBy({
      left: -`${scrollWidth > 0 ? scrollWidth : getScrollWidth()}`,
    });
    overflowRef.current?.classList.remove("scroll-smooth");
  };

  useEffect(() => {
    scrollLeft(width);
  }, [isLoading]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [date]);

  const isAtStart = dayjs(allDatesArr[0]).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD")
  const isAtEnd = dayjs(allDatesArr[allDatesArr.length - 1]).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD")

  return (
    <div className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6">
      <div className="flex flex-wrap justify-between gap-2 unmask-time">
        {isLoadingTeeTimeDate || isLoading || isFetchingNextPage ? (
          <div className="h-8 min-w-[150px] w-[20%] bg-gray-200 rounded-md  animate-pulse unmask-time" />
        ) : (
          <div className="w-full flex items-center gap-3 flex-col">
            <div
              className={`w-full flex items-center justify-between bg-white bg-secondary-white px-4 pb-3 
               ${(courseImages?.length > 0 ? scrollY > 333 : scrollY > 45)
                  ? `sticky shadow-md`
                  : "relative"
                }`}
            >
              {!isAtStart ?
                <ChevronUp fill="#000" className="-rotate-90" onClick={pageDown} /> : <div></div>
              }
              <div
                id="tee-time-box"
                className="text-[16px] md:text-[20px] unmask-time"
                data-testid="date-group-id"
                data-qa={dayMonthDate(date)}
              >
                <OutlineButton
                  className="!px-3 !py-1 w-full flex items-center justify-between gap-2"
                  onClick={toggleFilters}
                >
                  {dayMonthDate(date)}
                  {(dateType !== ("All" as DateType) || golfers !== "Any" || course?.courseOpenTime !== startTime[0] || course?.courseCloseTime !== startTime[1])
                    && (
                      <CancelIcon
                        width={16}
                        height={16}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent triggering parent button click
                          setDateType("All");  // your function to reset
                          setGolfers("Any"); // your function to reset
                          setStartTime([course?.courseOpenTime ?? 0, course?.courseCloseTime ?? 0]); // reset to default open and close times
                        }}
                      />
                    )}
                </OutlineButton>
              </div>
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
              {!isAtEnd ?
                <ChevronUp fill="#000" className="rotate-90" onClick={pageUp} /> : <div></div>
              }
            </div>
            {courseException && (
              <div className="flex-1 flex items-center gap-1">
                <p
                  style={{
                    backgroundColor: courseException.bgColor,
                    color: courseException.color,
                  }}
                  className="inline text-left text-[13px] md:text-lg"
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
          </div>
        )}
      </div>
      <div className="relative" ref={sizeRef} style={{
        marginTop: (courseImages?.length > 0 ? scrollY > 333 : scrollY > 45) ? `100px` : 'auto',
      }}>
        <div
          className="scrollbar-none w-full flex flex-col overflow-x-auto overflow-y-hidden gap-4"
          ref={overflowRef}
          onMouseDown={onMouseDown}
        >
          {allTeeTimes.length === 0 ? isLoadingTeeTimeDate || isLoading || isFetchingNextPage ? Array(TAKE)
            .fill(null)
            .map((_, idx) => <TeeTimeSkeletonV2 key={idx} />) : <div className="flex justify-center items-center h-[400px]">
            <div className="text-center">
              No Tee Times Available.
            </div>
          </div> : allTeeTimes?.map((i: CombinedObject, idx: number) => {
            if (
              i.firstOrSecondHandTeeTime === TeeTimeType.SECOND_HAND ||
              i.availableSlots >= playersCount
            ) {
              return (
                <TeeTimeV2
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
              );
            }
            return null;
          })}
          <div
            ref={nextPageRef}
            className="h-[1px] w-[1px] text-[1px] text-white"
          >
            Loading
          </div>


          {isLoading || isFetchingNextPage || !isFetchedAfterMount
            ? Array(TAKE)
              .fill(null)
              .map((_, idx) => <TeeTimeSkeletonV2 key={idx} />)
            : null}
        </div>

      </div>
    </div>
  );
};
