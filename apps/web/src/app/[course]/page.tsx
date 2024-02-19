"use client";

import { formatQueryDate } from "@golf-district/shared";
import { FilledButton } from "~/components/buttons/filled-button";
import { FilterSort } from "~/components/buttons/filters-sort";
import { GoBack } from "~/components/buttons/go-back";
import { CourseBanner } from "~/components/course-page/course-banner";
import { CourseTitle } from "~/components/course-page/course-title";
import { DailyTeeTimes } from "~/components/course-page/daily-tee-times";
import { Filters } from "~/components/course-page/filters";
import { MobileFilters } from "~/components/course-page/mobile-filters";
import { MobileSort, SortOptions } from "~/components/course-page/mobile-sort";
import { ChevronUp } from "~/components/icons/chevron-up";
import { Select } from "~/components/input/select";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import Weekday from "dayjs/plugin/weekday";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ViewportList } from "react-viewport-list";
import { useMediaQuery } from "usehooks-ts";

dayjs.extend(Weekday);
dayjs.extend(RelativeTime);

export default function CourseHomePage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { dateType, selectedDay, sortValue, handleSetSortValue } =
    useFiltersContext();
  const { entity, alertOffersShown, setAlertOffersShown } = useAppContext();
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);

  const updateCount = (balance: number) => {
    setCount(balance);
  };

  const { data: farthestDateOut } =
    api.searchRouter.getFarthestTeeTimeDate.useQuery(
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        courseId: course?.id!,
        order: "desc",
      },
      {
        enabled: course?.id !== undefined,
      }
    );

  const startDate = useMemo(() => {
    if (dateType === "All") {
      return formatQueryDate(new Date());
    } else if (dateType === "Today") {
      // return formatQueryDate(new Date());
      return dayjs
        .utc(formatQueryDate(new Date()))
        .utcOffset(course?.timezoneCorrection ?? 0);
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
      return formatQueryDate(dayjs(farthestDateOut).toDate());
    } else if (dateType === "Today") {
      return formatQueryDate(dayjs().toDate());
    } else if (dateType === "This Week") {
      return formatQueryDate(dayjs().day(7).toDate());
    } else if (dateType === "This Weekend") {
      return formatQueryDate(dayjs().day(7).toDate());
    } else if (dateType === "This Month") {
      const date = new Date();
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      return dayjs()
        .date(daysInMonth)
        .utc()
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999)
        .toDate();
    } else if (dateType === "Furthest Day Out To Book") {
      // return formatQueryDate(dayjs(farthestDateOut).toDate());
      return dayjs(farthestDateOut)
        .utc()
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(999)
        .toDate();
    } else if (dateType === "Custom") {
      if (!selectedDay.to) {
        if (selectedDay.from) {
          const dateString = `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`;
          return formatQueryDate(dayjs(dateString).toDate());
        } else {
          return formatQueryDate(dayjs().toDate());
        }
      }

      const dateString = `${selectedDay.to.year}-${selectedDay.to.month}-${selectedDay.to.day}`;
      return formatQueryDate(dayjs(dateString).toDate());
    }
    return formatQueryDate(dayjs().date(360).toDate()); //360 days out
  }, [dateType, selectedDay, farthestDateOut]);

  const TAKE = 4;

  const [take, setTake] = useState<number>(TAKE);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const utcStartDate = dayjs
    .utc(startDate)
    .utcOffset(course?.timezoneCorrection ?? 0);

  const utcEndDate = dayjs
    .utc(endDate)
    .utcOffset(course?.timezoneCorrection ?? 0);

  const daysData = useMemo(() => {
    const amountOfDays = dayjs(utcEndDate).diff(utcStartDate, "day");

    const daysToTake = amountOfDays > take ? take : amountOfDays;

    const arrayOfDates: string[] = [];
    for (let i = 0; i <= daysToTake; i++) {
      if (dateType === "Furthest Day Out To Book") {
        let date = utcEndDate;
        date = date.subtract(i, "day");
        //if day is today stop loop
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

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);

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

  useEffect(() => {
    setPageNumber(1);
    setTake(TAKE);
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dateType]);
  const { data: unreadOffers } = api.user.getUnreadOffersForCourse.useQuery(
    {
      courseId: courseId ?? "",
    },
    {
      enabled: courseId !== undefined && user?.id !== undefined,
    }
  );
  const router = useRouter();

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

  const datesArr = daysData?.arrayOfDates;

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack
          href="/"
          text={`Back to all ${entity?.name} Courses`}
          dataTestId="back-course-id"
        />
      </div>
      <CourseTitle
        courseName={course?.name ?? ""}
        description={course?.description ?? ""}
        className="px-4 md:px-6"
      />
      <CourseBanner className="pt-4" />
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
          <div className="flex justify-between gap-4  px-4 md:px-0">
            <div className="text-secondary-black">
              Showing {count?.toLocaleString() ?? "0"} tee times{" "}
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
                No tee times available for selected filters.
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full flex-col gap-1 md:gap-4" ref={ref}>
                <ViewportList
                  viewportRef={ref}
                  items={datesArr.slice(
                    (pageNumber - 1) * TAKE,
                    pageNumber * TAKE
                  )}
                >
                  {(date, idx) => (
                    <DailyTeeTimes
                      setError={(e: string | null) => {
                        setError(e);
                      }}
                      key={idx}
                      date={date}
                      updateCount={updateCount}
                      minDate={utcStartDate.toString()}
                      maxDate={utcEndDate.toString()}
                    />
                  )}
                </ViewportList>
              </div>
              {daysData.amountOfPages > 1 && count > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <FilledButton
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${
                      pageNumber === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={pageDown}
                  >
                    <ChevronUp fill="#fff" className="-rotate-90" />
                  </FilledButton>
                  <div className="text-primary-gray px-3 py-2 bg-[#ffffff] rounded-md">
                    {pageNumber} / {daysData.amountOfPages}
                  </div>
                  <FilledButton
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${
                      pageNumber === daysData.amountOfPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={pageUp}
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
    </main>
  );
}
