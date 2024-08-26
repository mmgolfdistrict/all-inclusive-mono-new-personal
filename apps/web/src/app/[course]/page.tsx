"use client";

import { formatQueryDate, formatQueryDateEnd } from "@golf-district/shared";
import { FilledButton } from "~/components/buttons/filled-button";
import { FilterSort } from "~/components/buttons/filters-sort";
import { GoBack } from "~/components/buttons/go-back";
import { CourseBanner } from "~/components/course-page/course-banner";
import { DailyTeeTimes } from "~/components/course-page/daily-tee-times";
import { Filters } from "~/components/course-page/filters";
import { MobileDates } from "~/components/course-page/mobile-date";
import { MobileFilters } from "~/components/course-page/mobile-filters";
import { MobileSort, SortOptions } from "~/components/course-page/mobile-sort";
import { Calendar } from "~/components/icons/calendar";
import { ChevronUp } from "~/components/icons/chevron-up";
import { FiltersIcon } from "~/components/icons/filters";
import { SortIcon } from "~/components/icons/sort";
import { Select } from "~/components/input/select";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import RelativeTime from "dayjs/plugin/relativeTime";
import Weekday from "dayjs/plugin/weekday";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ViewportList } from "react-viewport-list";
import { useMediaQuery } from "usehooks-ts";
import { LoadingContainer } from "./loader";

dayjs.extend(Weekday);
dayjs.extend(RelativeTime);
dayjs.extend(isoWeek);
export default function CourseHomePage() {
  const TAKE = 4;
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [showDates, setShowDates] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const [take, setTake] = useState<number>(TAKE);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const {
    showUnlisted,
    includesCart,
    golfers,
    holes,
    priceRange,
    startTime,
    sortValue,
    dateType,
    selectedDay,
    handleSetSortValue,
  } = useFiltersContext();
  const { entity, alertOffersShown, setAlertOffersShown } = useAppContext();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const courseId = course?.id;
  const [count, setCount] = useState<number>(0);
  const updateUser = api.user.updateUser.useMutation();

  const updateHandle = async (uName) => {
    try {
      await updateUser.mutateAsync({
        handle: uName,
        courseId,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const updateCount = (balance: number) => {
    setCount(balance);
  };

  const farthestDateOut = useMemo(() => {
    return dayjs().utc().add(course?.furthestDayToBook ?? 0, "day").format("YYYY-MM-DD");
  }, [course?.furthestDayToBook]);

  const { data: unreadOffers } = api.user.getUnreadOffersForCourse.useQuery(
    {
      courseId: courseId ?? "",
    },
    {
      enabled: courseId !== undefined && user?.id !== undefined,
    }
  );

  const { data: specialEvents } = api.searchRouter.getSpecialEvents.useQuery({
    courseId: courseId ?? "",
  });
  console.log("specialEvents", specialEvents);

  const getSpecialDayDate = (label) => {
    const specialDay = specialEvents?.find((day) => day.eventName === label);
    return specialDay
      ? { start: dayjs(specialDay.startDate), end: dayjs(specialDay.endDate) }
      : null;
  };

  const startDate = useMemo(() => {
    const formatDate = (date: Date) => formatQueryDate(date);
    const getUtcDate = (date: Date) => {
      const currentDate = dayjs.utc(formatDate(date));
      const currentDateWithTimeZoneOffset = currentDate.toString();
      return currentDateWithTimeZoneOffset;
    };
    const specialDate = getSpecialDayDate(dateType);
    console.log("specialDate", specialDate);

    if (specialDate) {
      const startOfDay = dayjs(specialDate.start);
      const result2 = formatQueryDate(startOfDay.toDate());

      return result2;
    }

    const todayDate = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${month}-${day}`;
    };

    switch (dateType) {
      case "All": {
        return getUtcDate(new Date());
      }
      case "This Week":
      case "This Month":
      case "Furthest Day Out To Book": {
        return formatDate(new Date());
      }
      case "Today": {
        return getUtcDate(new Date());
      }
      case "This Weekend": {
        const weekendDate = dayjs().day(5).toDate();
        return formatDate(weekendDate);
      }
      case "Custom": {
        if (!selectedDay.from) return formatDate(new Date());
        const { year, month, day } = selectedDay.from;
        const dateString = `${year}-${month}-${day}`;
        if (dateString === todayDate(new Date())) {
          const customDate2 = dayjs(formatDate(new Date()));
          const result2 = customDate2
            .add(course?.timezoneCorrection ?? 0, "hour")
            .toDate();
          return formatDate(result2);
        }
        const customDate = dayjs(dateString).toDate();

        return formatDate(customDate);
      }
      default: {
        return formatDate(new Date());
      }
    }
  }, [dateType, selectedDay]);

  const endDate = useMemo(() => {
    const formatDate = (date: Date) => formatQueryDate(date);
    const getUtcDate = (date: Date) => {
      const currentDate = dayjs.utc(formatDate(date));
      const currentDateWithTimeZoneOffset = currentDate
        .add(course?.timezoneCorrection ?? 0, "hour")
        .toString();
      return currentDateWithTimeZoneOffset;
    };

    const specialDate = getSpecialDayDate(dateType);
    console.log("specialDate", specialDate);

    if (specialDate) {
      const endOfDay = dayjs(specialDate.end);
      const result2 = formatQueryDate(endOfDay.toDate());
      return result2;
    }

    switch (dateType) {
      case "All": {
        return formatQueryDate(dayjs(farthestDateOut).toDate());
      }
      case "Today": {
        const endOfDayUTC = dayjs.utc().endOf("day");
        const result2 = endOfDayUTC
          .add(course?.timezoneCorrection ?? 0, "hour")
          .toString();
        return result2;
      }
      case "This Week": {
        const endOfDayUTC = dayjs.utc().endOf("isoWeek");
        const result2 = endOfDayUTC
          .add(course?.timezoneCorrection ?? 0, "hour")
          .toString();
        return result2;
      }
      case "This Weekend": {
        return formatQueryDate(dayjs().day(7).toDate());
      }
      case "This Month": {
        const endOfMonth = dayjs().endOf("month").toDate();
        return endOfMonth > dayjs(farthestDateOut).toDate()
          ? farthestDateOut
          : endOfMonth;
      }
      case "Furthest Day Out To Book": {
        return dayjs(farthestDateOut)
          .utc()
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(999)
          .toDate();
      }
      case "Custom": {
        if (!selectedDay.to) {
          if (selectedDay.from) {
            const { year, month, day } = selectedDay.from;
            const dateString = `${year}-${month}-${day}`;
            const endOfDay = dayjs(dateString).endOf("day");
            const result2 = endOfDay
              .add(course?.timezoneCorrection ?? 0, "hour")
              .toString();
            return result2;
            // return formatDate(endOfDay);
          } else {
            return formatQueryDate(dayjs().endOf("day").toDate());
          }
        }

        const { year, month, day } = selectedDay.to;
        const dateString = `${year}-${month}-${day}`;
        const endOfDay = dayjs(dateString).endOf("day");
        const result2 = endOfDay
          .add(course?.timezoneCorrection ?? 0, "hour")
          .toString();
        return result2;
      }

      default: {
        return formatQueryDate(dayjs().date(360).toDate()); // 360 days out
      }
    }
  }, [dateType, selectedDay, farthestDateOut]);

  const utcStartDate = dayjs
    .utc(startDate)
    .utcOffset(course?.timezoneCorrection ?? 0);

  const utcEndDate = dayjs
    .utc(endDate)
    .utcOffset(course?.timezoneCorrection ?? 0);

  const daysData = useMemo(() => {
    const amountOfDays = dayjs(utcEndDate).diff(utcStartDate, "day");
    const daysToTake = amountOfDays;
    const arrayOfDates: string[] = [];

    for (let i = 0; i <= daysToTake; i++) {
      if (dateType === "Furthest Day Out To Book") {
        let date = utcEndDate;
        date = date.subtract(i, "day");
        // if day is today, stop loop
        if (date.add(1, "day").isSame(dayjs(), "day")) break;
        arrayOfDates.push(date.toString());
        continue;
      } else {
        let date = utcStartDate;
        date = date.add(i, "day");
        arrayOfDates.push(date.toString());
        continue;
      }
    }

    const amountOfPages = Math.ceil((amountOfDays + 1) / TAKE);
    return { arrayOfDates, amountOfPages };
  }, [startDate, endDate, dateType, take]);

  const { data: datesWithData, isLoading: isLoadingTeeTimeDate } =
    api.searchRouter.checkTeeTimesAvailabilityForDateRange.useQuery(
      {
        dates: [],
        courseId: course?.id ?? "",
        startTime: startTime[0],
        endTime: startTime[1],
        minDate: utcStartDate.toString(),
        maxDate: utcEndDate.toString(),
        holes: holes === "Any" || holes === "18" ? 18 : 9,
        golfers: golfers === "Any" ? -1 : golfers,
        showUnlisted: showUnlisted,
        includesCart: includesCart,
        lowerPrice: priceRange[0] ?? 0,
        upperPrice: priceRange[1] ?? 0,
        take: take,
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
      },
      {
        enabled: course?.id !== undefined,
      }
    );

  useEffect(() => {
    if ((showSort || showFilters) && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showSort, isMobile, showFilters]);

  useEffect(() => {
    setPageNumber(1);
    setTake(TAKE);

    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dateType]);

  useEffect(() => {
    if (!alertOffersShown && unreadOffers && Number(unreadOffers) > 0) {
      toast.info(
        <span>
          You have {unreadOffers} offers waiting in My Offers. Review your
          offers if you want to sell your time, counteroffer for a higher price,
          or decline.
        </span>,
        {
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          onClick: () => {
            router.push(`/${courseId}/my-tee-box?section=offers-received`);
          },
          theme: "light",
        }
      );
      setAlertOffersShown(true);
    }
  }, [unreadOffers]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleSort = () => {
    setShowSort(!showSort);
  };

  const toggleDates = () => {
    setShowDates(!showDates);
  };

  const pageUp = () => {
    if (pageNumber === daysData.amountOfPages) return;
    setPageNumber((prev) => prev + 1);
    setTake((prev) => prev + TAKE);
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const pageDown = () => {
    if (pageNumber === 1) return;
    setPageNumber((prev) => prev - 1);
    setTake((prev) => prev - TAKE);
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoading = (val: boolean) => {
    setIsLoading(val);
  };
  useEffect(() => {
    setPageNumber(1);
  }, [priceRange]);

  let datesArr = JSON.parse(
    JSON.stringify(datesWithData ?? daysData.arrayOfDates)
  );
  const amountOfPage = Math.ceil(
    (datesWithData
      ? datesWithData.length - 1 === 0
        ? 1
        : datesWithData.length - 1
      : daysData.amountOfPages) / TAKE
  );
  if (dateType === "Furthest Day Out To Book") {
    datesArr = datesArr.reverse();
  }
  const finalRes = [...datesArr].slice(
    (pageNumber - 1) * TAKE,
    pageNumber * TAKE
  );

  const [scrollY, setScrollY] = useState(0);

  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <LoadingContainer isLoading={isLoadingTeeTimeDate || isLoading}>
        <div></div>
      </LoadingContainer>
      <div className="flex items-center justify-between px-4 md:px-6">
        {entity?.redirectToCourseFlag ? null : (
          <GoBack href="/" text={`Back to all ${entity?.name} Courses`} />
        )}
      </div>
      {/* <CourseTitle
        courseName={course?.name ?? ""}
        description={course?.description ?? ""}
        className="px-4 md:px-6"
      /> */}
      <CourseBanner
        className="pt-4"
        userId={user?.id ?? ""}
        updateHandle={updateHandle}
      />
      <section className="relative flex gap-8 pl-0 pt-6 md:pl-6 md:pt-8 mx-auto w-full">
        <div
          ref={scrollRef}
          className="absolute -top-[7.5rem] md:-top-[9.2rem]"
        />
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
              setValue={handleSetSortValue}
              values={SortOptions}
            />
            <Filters />
          </div>
        </div>
        <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 md:hidden">
          {/* mobile  for filter/sort */}
          <FilterSort toggleFilters={toggleFilters} toggleSort={toggleSort} />
        </div>
        <div className="flex w-full flex-col gap-1 md:gap-4 overflow-x-hidden pr-0 md:pr-6">
          <div
            className={`flex space-x-2 md:hidden px-4 ${
              scrollY > 333
                ? "fixed top-[7.8rem] left-0 w-full z-10 bg-secondary-white pt-2 pb-3 shadow-md"
                : "relative"
            }`}
          >
            <button
              onClick={toggleFilters}
              className="p-2 text-xs flex items-center space-x-2 flex items-center gap-1 rounded-full border-b border-r border-t border-l border-stroke"
            >
              <FiltersIcon className="h-[14px] w-[14px]" />
              All Filters
            </button>
            <button
              onClick={toggleDates}
              className="p-2 text-xs flex items-center space-x-2 flex items-center gap-1 rounded-full border-b border-r border-t border-l border-stroke"
            >
              <Calendar className="h-[14px] w-[14px]" /> Date
            </button>
          </div>
          <div className="flex justify-between gap-4  px-4 md:px-0">
            <div className="text-secondary-black">
              {/* Showing {count?.toLocaleString() ?? "0"} tee times{" "} */}
              <span className="text-sm text-primary-gray">
                All times shown in course time zone
              </span>
            </div>
          </div>
          {error ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="text-center">Error: {error}</div>
            </div>
          ) : datesArr?.length === 0 ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="text-center">
                {isLoadingTeeTimeDate
                  ? "Loading..."
                  : "No Tee Times Available."}
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full flex-col gap-1 md:gap-4" ref={ref}>
                <ViewportList viewportRef={ref} items={finalRes}>
                  {(date, idx) => (
                    <DailyTeeTimes
                      setError={(e: string | null) => {
                        setError(e);
                      }}
                      key={idx}
                      date={date}
                      minDate={utcStartDate.toString()}
                      maxDate={utcEndDate.toString()}
                      handleLoading={handleLoading}
                    />
                  )}
                </ViewportList>
              </div>
              {daysData.amountOfPages > 1 ? (
                <div className="flex items-center justify-center gap-2 pt-1 md:pt-0 md:pb-4">
                  <FilledButton
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${
                      pageNumber === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={pageDown}
                    data-testid="chevron-down-id"
                  >
                    <ChevronUp fill="#fff" className="-rotate-90" />
                  </FilledButton>
                  <div className="text-primary-gray px-3 py-2 bg-[#ffffff] rounded-md">
                    {pageNumber} / {amountOfPage}
                  </div>
                  <FilledButton
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${
                      pageNumber === daysData.amountOfPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={pageUp}
                    data-testid="chevron-up-id"
                  >
                    <ChevronUp fill="#fff" className="rotate-90" />
                  </FilledButton>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {showSort && (
        <MobileSort
          setShowSort={setShowSort}
          toggleSort={toggleSort}
          setSortValue={handleSetSortValue}
          sortValue={sortValue}
        />
      )}
      {showFilters && (
        <MobileFilters
          setShowFilters={setShowFilters}
          toggleFilters={toggleFilters}
        />
      )}
      {showDates && (
        <MobileDates
          setShowFilters={setShowDates}
          toggleFilters={toggleDates}
        />
      )}
    </main>
  );
}
