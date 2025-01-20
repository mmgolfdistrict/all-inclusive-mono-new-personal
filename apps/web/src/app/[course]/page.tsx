"use client";

import type { NotificationObject } from "@golf-district/shared";
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
import { Select } from "~/components/input/select";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import type { GolferType } from "~/contexts/FiltersContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import RelativeTime from "dayjs/plugin/relativeTime";
import Weekday from "dayjs/plugin/weekday";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ViewportList } from "react-viewport-list";
import { useMediaQuery } from "usehooks-ts";
import { LoadingContainer } from "./loader";
import { microsoftClarityEvent } from "~/utils/microsoftClarityUtils";
import { Close } from "~/components/icons/close";
import { ForecastModal } from "~/components/modal/forecast-modal";

dayjs.extend(Weekday);
dayjs.extend(RelativeTime);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);
export default function CourseHomePage() {
  const searchParams = useSearchParams();
  const queryDateType = searchParams.get("dateType");
  const queryDate = searchParams.get("date");
  const queryStartTime = searchParams.get("startTime");
  const queryEndTime = searchParams.get("endTime");
  const queryPlayerCount = searchParams.get("playerCount");

  const TAKE = 4;
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [showDates, setShowDates] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const [isForecastModalOpen, setIsForecastModalOpen] =
    useState<boolean>(false);
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
    setDateType,
    setSelectedDay,
    setStartTime,
    setGolfers,
  } = useFiltersContext();
  const { entity, alertOffersShown, setAlertOffersShown } = useAppContext();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const courseId = course?.id;
  const updateUser = api.user.updateUser.useMutation();

  const updateHandle = async (uName) => {
    try {
      await updateUser.mutateAsync({
        handle: uName,
        courseId,
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const farthestDateOut = useMemo(() => {
    return dayjs()
      .utc()
      .add(course?.furthestDayToBook ?? 0, "day")
      .format("YYYY-MM-DD");
  }, [course?.furthestDayToBook]);

  const highestPrice = useMemo(() => {
    if (!course) return 0;
    if (course.highestListedTeeTime > course.highestPrimarySaleTeeTime) {
      return Math.ceil(course.highestListedTeeTime / 10) * 10;
    } else {
      return Math.ceil(course.highestPrimarySaleTeeTime / 10) * 10;
    }
  }, [course]);

  const lowestPrice = useMemo(() => {
    if (!course) return 0;
    if (course.lowestListedTeeTime < course.lowestPrimarySaleTeeTime) {
      return Math.floor(course.lowestListedTeeTime / 10) * 10;
    } else {
      return Math.floor(course.lowestPrimarySaleTeeTime / 10) * 10;
    }
  }, [course]);

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

  const getSpecialDayDate = (label) => {
    const specialDay = specialEvents?.find((day) => day.eventName === label);
    return specialDay
      ? { start: dayjs(specialDay.startDate), end: dayjs(specialDay.endDate) }
      : null;
  };

  const formatDateString = (
    date: string | number | Date | Dayjs | null | undefined
  ): string => {
    if (!date) {
      return ""; // Handle the case where date is null or undefined
    }
    return dayjs(date).utc().format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
  };

  const getUtcDate = (
    date: string | number | Dayjs | Date | null | undefined,
    timezoneCorrection = 0
  ): string => {
    const currentDate = dayjs.utc(formatDateString(date));
    return currentDate.add(timezoneCorrection, "hour").toString();
  };

  const startDate = useMemo(() => {
    const specialDate = getSpecialDayDate(dateType);
    if (specialDate) {
      return formatDateString(dayjs(specialDate.start).toDate());
    }

    switch (dateType) {
      case "All":
      case "This Week":
      case "This Month":
      case "Furthest Day Out To Book":
        return formatDateString(new Date());
      case "Today":
        return getUtcDate(new Date(), course?.timezoneCorrection);
      case "This Weekend":
        return formatDateString(dayjs().day(5).toDate());
      case "Custom": {
        if (!selectedDay.from) return formatDateString(new Date());
        const customDate = dayjs(
          `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`
        ).toDate();
        return formatDateString(customDate);
      }
      default:
        return formatDateString(new Date());
    }
  }, [dateType, selectedDay]);

  const endDate = useMemo(() => {
    const specialDate = getSpecialDayDate(dateType);
    if (specialDate) {
      return formatDateString(dayjs(specialDate.end).toDate());
    }

    switch (dateType) {
      case "All":
        return formatDateString(dayjs(farthestDateOut).toDate());
      case "Today":
        return getUtcDate(
          dayjs().endOf("day").toDate(),
          course?.timezoneCorrection
        );
      case "This Week":
        return getUtcDate(
          dayjs().endOf("isoWeek").toDate(),
          course?.timezoneCorrection
        );
      case "This Weekend":
        return formatDateString(dayjs().day(7).toDate());
      case "This Month": {
        const endOfMonth = dayjs().endOf("month").toDate();
        return endOfMonth > dayjs(farthestDateOut).toDate()
          ? formatDateString(farthestDateOut)
          : formatDateString(endOfMonth);
      }
      case "Furthest Day Out To Book":
        return formatDateString(
          dayjs(farthestDateOut)
            .utc()
            .hour(23)
            .minute(59)
            .second(59)
            .millisecond(999)
            .toDate()
        );
      case "Custom": {
        if (!selectedDay.to) {
          if (selectedDay.from) {
            const endOfDay = dayjs(
              `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`
            ).endOf("day");
            return getUtcDate(endOfDay.toDate(), course?.timezoneCorrection);
          }
          return formatDateString(dayjs().endOf("day").toDate());
        }
        const endDateCustom = dayjs(
          `${selectedDay.to.year}-${selectedDay.to.month}-${selectedDay.to.day}`
        ).endOf("day");
        return getUtcDate(endDateCustom.toDate(), course?.timezoneCorrection);
      }
      default:
        return formatDateString(dayjs().add(360, "days").toDate());
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
        golfers: golfers === "Any" ? 1 : golfers,
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
        isHolesAny: holes === "Any",
        isGolferAny: golfers === "Any",
        highestPrice: highestPrice,
        lowestPrice: lowestPrice,
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
    if (pageNumber === amountOfPage) return;
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

  useEffect(() => {
    if (queryDateType === "custom" && queryDate) {
      setDateType("Custom");

      const courseOpenTime = Number(dayjs(course?.openTime).format("HHmm"));
      const courseCloseTime = Number(dayjs(course?.closeTime).format("HHmm"));
      const startTime = Math.max(courseOpenTime, Number(queryStartTime));
      const endTime = Math.min(courseCloseTime, Number(queryEndTime));
      setStartTime([startTime, endTime]);

      const playerCount =
        Number(queryPlayerCount) <= 0 || Number(queryPlayerCount) > 4
          ? "Any"
          : Number(queryPlayerCount);
      setGolfers((playerCount as GolferType) || "Any");
    }
  }, [queryDateType]);

  useEffect(() => {
    if (queryDateType === "custom" && queryDate) {
      const [year, month, day] = queryDate.split("-");
      if (year && month && day) {
        setSelectedDay({
          from: { year: Number(year), month: Number(month), day: Number(day) },
          to: { year: Number(year), month: Number(month), day: Number(day) },
        });
      }
    }
  }, [dateType]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("googlestate");
      localStorage.removeItem("credentials");
      localStorage.removeItem("linkedinstate");
      localStorage.removeItem("facebookstate");

      microsoftClarityEvent({
        action: ``,
        category: "",
        label: "",
        value: "",
        additionalContent: {
          courseName: course?.name,
          websiteURL: course?.websiteURL
        }
      });
    }
  }, []);
  let datesArr = JSON.parse(
    JSON.stringify(datesWithData ?? daysData.arrayOfDates)
  );
  const amountOfPage = Math.ceil(
    (datesWithData
      ? datesWithData.length - 1 === 0
        ? 1
        : datesWithData.length
      : daysData.amountOfPages) / TAKE
  );

  // datesArr = datesArr.filter((date: string) =>
  //   dayjs(date).isBetween(dayjs(startDate), dayjs(endDate), "day", "[]")
  // );

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

  const { data: courseException } =
    api.courseException.getCourseException.useQuery({
      courseId: courseId ?? "",
    });

  const getCourseException = (playDate: string): null | NotificationObject => {
    let flag = false;
    let msg: NotificationObject | null = null;
    courseException?.forEach((ce) => {
      const startDate = new Date(ce.startDate);
      const endDate = new Date(ce.endDate);
      const dateToCheck = new Date(playDate);
      if (dateToCheck > startDate && dateToCheck < endDate) {
        flag = true;
        msg = ce;
      }
    });
    if (flag) {
      return msg;
    }
    return null;
  };

  // const { data: systemNotifications } =
  //   api.systemNotification.getSystemNotification.useQuery({});

  // const { data: courseGlobalNotification } =
  //   api.systemNotification.getCourseGlobalNotification.useQuery({
  //     courseId: courseId ?? "",
  //   });

  // const notificationsCount =
  //   (systemNotifications ? systemNotifications.length : 0) +
  //   (courseGlobalNotification ? courseGlobalNotification.length : 0);

  // const marginTop =
  //   notificationsCount > 0 ? `mt-${notificationsCount * 6}` : "";

  const openForecastModal = () => {
    setIsForecastModalOpen(true);
  };

  // Function to close the modal
  const closeForecastModal = () => {
    setIsForecastModalOpen(false);
  };
  return (
    <main className={`bg-secondary-white py-4 md:py-6 `}>
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
            <Filters openForecastModal={openForecastModal} />
          </div>
        </div>
        <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 md:hidden">
          {/* mobile  for filter/sort */}
          <FilterSort toggleFilters={toggleFilters} toggleSort={toggleSort} />
        </div>
        <div className="flex w-full flex-col gap-1 md:gap-4 overflow-x-hidden pr-0 md:pr-6">
          <div
            className={`flex space-x-2 md:hidden px-4 ${scrollY > 333
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
                      courseException={getCourseException(date as string)}
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
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${pageNumber === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    onClick={pageDown}
                    data-testid="chevron-down-id"
                  >
                    <ChevronUp fill="#fff" className="-rotate-90" />
                  </FilledButton>
                  <div className="text-primary-gray px-3 py-2 bg-[#ffffff] rounded-md unmask-pagination">
                    {pageNumber} / {amountOfPage}
                  </div>
                  <FilledButton
                    className={`!px-3 !py-2 !min-w-fit !rounded-md ${pageNumber === amountOfPage
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
          openForecastModal={openForecastModal}
        />
      )}
      {showDates && (
        <MobileDates
          setShowFilters={setShowDates}
          toggleFilters={toggleDates}
          openForecastModal={openForecastModal}
        />
      )}
      {isForecastModalOpen && (
        <ForecastModal closeForecastModal={closeForecastModal} startDate={startDate} endDate={endDate} />
      )}
    </main>
  );
}
