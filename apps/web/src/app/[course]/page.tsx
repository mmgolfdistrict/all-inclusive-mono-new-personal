"use client";

import { formatQueryDate } from "@golf-district/shared";
import { FilterSort } from "~/components/buttons/filters-sort";
import { GoBack } from "~/components/buttons/go-back";
import { OutlineButton } from "~/components/buttons/outline-button";
import { CourseBanner } from "~/components/course-page/course-banner";
import { CourseTitle } from "~/components/course-page/course-title";
import { DailyTeeTimes } from "~/components/course-page/daily-tee-times";
import { Filters } from "~/components/course-page/filters";
import { MobileFilters } from "~/components/course-page/mobile-filters";
import {
  MobileSort,
  SortOptions,
  type SortType,
} from "~/components/course-page/mobile-sort";
import { Skeleton } from "~/components/course-page/skeleton";
import { Select } from "~/components/input/select";
import { Spinner } from "~/components/loading/spinner";
import { WeatherIcons } from "~/constants/weather-icons";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { api } from "~/utils/api";
import type { SearchObject } from "~/utils/types";
import dayjs from "dayjs";
import Weekday from "dayjs/plugin/weekday";
import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

dayjs.extend(Weekday);

export default function CourseHomePage() {
  const {
    showUnlisted,
    includesCart,
    golfers,
    holes,
    priceRange,
    startTime,
    dateType,
    selectedDay,
  } = useFiltersContext();
  const { entity } = useAppContext();
  const { course } = useCourseContext();

  const startDate = useMemo(() => {
    if (dateType === "All") {
      return formatQueryDate(new Date());
    } else if (dateType === "Today") {
      return formatQueryDate(new Date());
    } else if (dateType === "This Week") {
      return formatQueryDate(new Date());
    } else if (dateType === "This Weekend") {
      return formatQueryDate(dayjs().day(5).toDate());
    } else if (dateType === "This Month") {
      return formatQueryDate(new Date());
    } else if (dateType === "Furthest Day Out To Book") {
      return formatQueryDate(new Date());
    } else if (dateType === "Custom") {
      if (!selectedDay.from) return formatQueryDate(new Date());
      const dateString = `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`;
      return formatQueryDate(dayjs(dateString).toDate());
    }
    return formatQueryDate(new Date());
  }, [dateType, selectedDay]);

  const endDate = useMemo(() => {
    if (dateType === "All") {
      return formatQueryDate(dayjs().date(360).toDate()); //360 days out
    } else if (dateType === "Today") {
      return formatQueryDate(dayjs().add(1, "day").toDate());
    } else if (dateType === "This Week") {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const newDate = diff + 7;
      return formatQueryDate(dayjs().date(newDate).toDate());
    } else if (dateType === "This Weekend") {
      return formatQueryDate(dayjs().day(8).toDate());
    } else if (dateType === "This Month") {
      const date = new Date();
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      return formatQueryDate(
        dayjs()
          .date(daysInMonth + 1)
          .toDate()
      );
    } else if (dateType === "Furthest Day Out To Book") {
      return formatQueryDate(dayjs().date(360).toDate()); //360 days out
    } else if (dateType === "Custom") {
      if (!selectedDay.to) {
        if (selectedDay.from) {
          const dateString = `${selectedDay.from.year}-${
            selectedDay.from.month
          }-${selectedDay.from.day + 1}`;
          return formatQueryDate(dayjs(dateString).toDate());
        } else {
          return formatQueryDate(dayjs().add(1, "day").toDate());
        }
      }

      const dateString = `${selectedDay.to.year}-${selectedDay.to.month}-${
        selectedDay.to.day + 1
      }`;
      return formatQueryDate(dayjs(dateString).toDate());
    }
    return formatQueryDate(dayjs().date(360).toDate()); //360 days out
  }, [dateType, selectedDay]);

  const {
    data: teeTimeData,
    fetchNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
    error,
  } = api.searchRouter.courseSearch.useInfiniteQuery(
    {
      courseId: course?.id ?? "",
      startDate: startDate,
      endDate: endDate,
      startTime: startTime[0],
      endTime: startTime[1],
      holes: holes === "Any" || holes === "18" ? 18 : 9,
      golfers: golfers === "Any" ? 1 : golfers,
      showUnlisted: showUnlisted,
      withCart: includesCart,
      lowerPrice: priceRange[0]!,
      upperPrice: priceRange[1]!,
      orderBy: dateType === "Furthest Day Out To Book" ? "desc" : "asc",
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage?.cursor && lastPage?.hasMore) {
          const dateFromCursor = new Date(lastPage.cursor);
          if (dateType === "Furthest Day Out To Book") {
            return new Date(
              dateFromCursor.setDate(dateFromCursor.getDate() - 3)
            ); //subtract 3 days
          }
          return new Date(dateFromCursor.setDate(dateFromCursor.getDate() + 3)); //add 3 more days
        }
        return;
      },
      enabled: !!course?.id,
    }
  );

  const amountOfTeeTimes = useMemo(() => {
    if (!teeTimeData) return 0;
    return (
      teeTimeData?.pages[teeTimeData?.pages.length - 1]?.search?.length ?? 0
    );
  }, [teeTimeData]);

  const hasMore = useMemo(() => {
    if (!teeTimeData) return false;
    return teeTimeData?.pages[teeTimeData?.pages.length - 1]?.hasMore ?? false;
  }, [teeTimeData]);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [sortValue, setSortValue] = useState<SortType>(
    "Sort by time - Early to Late"
  );
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if ((showSort || showFilters) && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showSort, isMobile, showFilters]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleSort = () => {
    setShowSort(!showSort);
  };

  const setValue = (value: SortType) => {
    setSortValue(value);
  };

  const teeTimesByDay = useMemo(() => {
    if (teeTimeData) {
      const combinedTeeTimeData =
        teeTimeData?.pages[teeTimeData?.pages.length - 1]?.search ?? [];

      const teeTimesByDay = combinedTeeTimeData?.reduce((acc, teeTime) => {
        const dateTime = teeTime.date.split(" ")[0];
        if (!dateTime) return acc;
        if (acc?.[dateTime]) {
          acc[dateTime]?.push(teeTime);
        } else {
          acc[dateTime] = [teeTime];
        }
        return acc;
      }, {} as Record<string, SearchObject[]>);

      if (!teeTimesByDay) return [];

      const keysSortedByDate = Object.keys(teeTimesByDay).sort((a, b) => {
        if (dateType === "Furthest Day Out To Book") {
          return new Date(b).getTime() - new Date(a).getTime();
        }
        return new Date(a).getTime() - new Date(b).getTime();
      });
      const sortedTeeTimesByDay = keysSortedByDate.reduce(
        (acc, date) => ({
          ...acc,
          [date]: teeTimesByDay[date]?.sort((a, b) => {
            if (sortValue === "Sort by time - Early to Late") {
              return a.time - b.time;
            } else if (sortValue === "Sort by time - Late to Early") {
              return b.time - a.time;
            } else if (sortValue === "Sort by price - Low to High") {
              // && Sort by time - Early to Late
              return a.pricePerGolfer - b.pricePerGolfer;
            } else {
              // Sort by price - High to Low && Sort by time - Early to Late
              return b.pricePerGolfer - a.pricePerGolfer;
            }
          }),
        }),
        {} as Record<string, SearchObject[]>
      );

      return sortedTeeTimesByDay;
    }
  }, [teeTimeData, sortValue, dateType]);

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href="/" text={`Back to all ${entity?.name} Courses`} />
      </div>
      <CourseTitle
        courseName={course?.name ?? ""}
        description={course?.description ?? ""}
        className="px-4 md:px-6"
      />
      <CourseBanner className="pt-4" />
      <section className="relative flex gap-8 pl-0 pt-6 md:pl-6 md:pt-8">
        <div className="hidden min-w-[310px] flex-col md:flex">
          <div
            style={{
              top: "calc(9.5rem + 1px)",
              maxHeight: "calc(100vh - 10.5rem)",
            }}
            className="sticky overflow-y-auto overflow-x-hidden flex flex-col gap-4"
          >
            <Select
              value={sortValue}
              setValue={setValue}
              values={SortOptions}
            />

            <Filters />
          </div>
        </div>
        <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 md:hidden">
          {/* mobile  for filter/sort */}
          <FilterSort toggleFilters={toggleFilters} toggleSort={toggleSort} />
        </div>
        <div className="flex w-full flex-col gap-4 overflow-x-hidden pr-0 md:pr-6">
          <div className="flex justify-between gap-4  px-4 md:px-0">
            <div className="text-secondary-black">
              Showing {amountOfTeeTimes ?? "0"} tee times{" "}
              <span className="text-sm text-primary-gray">
                All times shown in course time zone
              </span>
            </div>
          </div>
          {isLoading ? (
            Array(3)
              .fill(null)
              .map((_, idx) => <Skeleton key={idx} />)
          ) : isError && error ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="text-center">Error: {error?.message}</div>
            </div>
          ) : !teeTimesByDay || Object.keys(teeTimesByDay)?.length === 0 ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="text-center">
                No tee times available for selected filters.
              </div>
            </div>
          ) : (
            <>
              {Object.keys(teeTimesByDay).map((date, idx) => (
                <DailyTeeTimes
                  key={idx}
                  date={date}
                  temperature={
                    (teeTimesByDay[date]?.[0] as SearchObject)?.weather
                      ?.temperature ?? ""
                  }
                  weatherIcon={
                    WeatherIcons[
                      (teeTimesByDay[date]?.[0] as SearchObject)?.weather
                        .iconCode
                    ] ?? <></>
                  }
                  weatherDesciption={
                    (teeTimesByDay[date]?.[0] as SearchObject)?.weather
                      ?.shortForecast ?? ""
                  }
                  teeTimes={teeTimesByDay[date]}
                />
              ))}
              {isFetchingNextPage ? (
                <div className="mx-auto h-[100px] flex items-center justify-center">
                  <Spinner className="w-[40px] h-[40px]" />
                </div>
              ) : null}
              {hasMore && !isFetchingNextPage ? (
                <OutlineButton
                  className="mx-auto w-fit"
                  onClick={() => void fetchNextPage()}
                >
                  Load More
                </OutlineButton>
              ) : null}
            </>
          )}
        </div>
      </section>

      {showSort && (
        <MobileSort
          setShowSort={setShowSort}
          toggleSort={toggleSort}
          setSortValue={setSortValue}
          sortValue={sortValue}
        />
      )}
      {showFilters && (
        <MobileFilters
          setShowFilters={setShowFilters}
          toggleFilters={toggleFilters}
        />
      )}
    </main>
  );
}
