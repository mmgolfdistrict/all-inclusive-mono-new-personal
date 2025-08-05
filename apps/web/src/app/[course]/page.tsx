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
import { ForecastModal } from "~/components/modal/forecast-modal";
import { useAppContext } from "~/contexts/AppContext";
import { useBookingSourceContext } from "~/contexts/BookingSourceContext";
import { useCourseContext } from "~/contexts/CourseContext";
import type { DateType, GolferType } from "~/contexts/FiltersContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { microsoftClarityEvent } from "~/utils/microsoftClarityUtils";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import RelativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import Weekday from "dayjs/plugin/weekday";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ViewportList } from "react-viewport-list";
import { useMediaQuery } from "usehooks-ts";
import { LoadingContainer } from "./loader";
import { DailyTeeTimesMobileV2 } from "~/components/course-page/daily-tee-times-mobile-v2";
import { DailyTeeTimesDesktopV2 } from "~/components/course-page/daily-tee-time-desktop-v2";

dayjs.extend(Weekday);
dayjs.extend(RelativeTime);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
export default function CourseHomePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const searchParams = useSearchParams();
  const queryDateType = searchParams.get("dateType");
  const queryDate = searchParams.get("date");
  const queryStartTime = searchParams.get("startTime");
  const queryEndTime = searchParams.get("endTime");
  const queryPlayerCount = searchParams.get("playerCount");
  const source = searchParams.get("source");
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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const ALLOW_COURSE_SWITCHING = course?.isAllowCourseSwitching;
  const { setBookingSource } = useBookingSourceContext();
  const { isNavExpanded, setActivePage } = useAppContext();
  setActivePage("teeTime")
  function getUserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function compareTimesWithTimezones() {
    const date1 = dayjs().tz(getUserTimezone()).utcOffset()
    const date2 = dayjs().tz(course?.timezoneISO).utcOffset()

    if (date1 > date2) {
      return "user";
    } else if (date1 < date2) {
      return "course";
    } else {
      return "user";
    }
  }

  const formatDateString = (
    date: string | number | Date | Dayjs | null | undefined
  ): string => {
    if (!date) {
      return ""; // Handle the case where date is null or undefined
    }
    const compareTimeZone = compareTimesWithTimezones()

    if (compareTimeZone === "user") {
      return dayjs(date).format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
    }
    return dayjs(date)
      .tz(course?.timezoneISO)
      .format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
  };

  const formatDateStringEnd = (
    date: string | number | Date | Dayjs | null | undefined
  ): string => {
    if (!date) {
      return ""; // Handle the case where date is null or undefined
    }
    return dayjs(date)
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999)
      .format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
  };

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
  const courseId = course?.id;
  const { data: MOBILE_VIEW_VERSION } =
    api.course.getMobileViewVersion.useQuery({
      courseId: courseId ?? "",
    });

  const entityId = entity?.id;

  const { data: allCoursesData, isLoading: allCoursesDataLoading } =
    api.entity.getCoursesByEntityId.useQuery(
      { entityId: entityId! },
      { enabled: entityId !== undefined }
    );

  const { data: allSwitchCoursesData } = api.course.getAllSwitchCourses.useQuery({ courseId: course?.id ?? "" })

  const { data: DESKTOP_VIEW_VERSION } =
    api.course.getDesktopViewVersion.useQuery({
      courseId: courseId ?? "",
    });

  const TAKE = MOBILE_VIEW_VERSION === "v2" && isMobile ? 1 : 4;
  const [take, setTake] = useState<number>(TAKE);

  const updateUser = api.user.updateUser.useMutation();
  const { data: specialEvents, isLoading: specialEventsLoading } =
    api.searchRouter.getSpecialEvents.useQuery({
      courseId: courseId ?? "",
    });

  const updateHandle = async (uName) => {
    try {
      await updateUser.mutateAsync({
        handle: uName,
        courseId,
        color1: entity?.color1 ?? "#000000",
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

  // const getUtcDate = (
  //   date: string | number | Dayjs | Date | null | undefined,
  //   timezoneCorrection = 0
  // ): string => {
  //   const currentDate = dayjs.utc(formatDateString(date));
  //   return currentDate.add(timezoneCorrection, "hour").toString();
  // };

  useEffect(() => {
    if (queryDateType === "custom" && queryDate) {
      setDateType("Custom");

      // const courseOpenTime = Number(dayjs(course?.openTime).format("HHmm"));
      // const courseCloseTime = Number(dayjs(course?.closeTime).format("HHmm"));
      const courseOpenTime = course?.courseOpenTime ?? 9;
      const courseCloseTime = course?.courseCloseTime ?? 9;
      const startTime = Math.max(courseOpenTime, Number(queryStartTime));
      const endTime = Math.min(courseCloseTime, Number(queryEndTime));
      setStartTime([startTime, endTime]);

      const playerCount =
        Number(queryPlayerCount) <= 0 || Number(queryPlayerCount) > 4
          ? "Any"
          : Number(queryPlayerCount);
      setGolfers((playerCount as GolferType) || "Any");

      const [year, month, day] = queryDate.split("-");
      if (year && month && day) {
        setSelectedDay({
          from: { year: Number(year), month: Number(month), day: Number(day) },
          to: { year: Number(year), month: Number(month), day: Number(day) },
        });
      }
      const specialDate = getSpecialDayDate(queryDateType);
      if (queryDateType) {
        if (specialDate) {
          setDateType(queryDateType as DateType);
        }
      }
    }
  }, [queryDateType, specialEvents]);

  const getSpecialDayDate = (label) => {
    const today = dayjs(new Date());
    const specialDay = specialEvents?.find((day) => day.eventName === label);

    if (specialDay) {
      const specialStartDate = dayjs(specialDay.startDate);

      const start = today.isAfter(specialStartDate) ? today : specialStartDate;

      return {
        start: start,
        end: specialDay.endDate ? dayjs(specialDay.endDate) : null,
      };
    }

    return null;
  };

  const startDate = useMemo(() => {
    const specialDate = getSpecialDayDate(dateType);
    if (specialDate) {
      return formatDateString(specialDate.start);
    }
    setPageNumber(1);
    switch (dateType) {
      case "All": {
        const currentTime = dayjs(new Date());
        const currentTimePlus30 = currentTime.add(30, 'minute');

        const closingHour = Math.floor(startTime[1] / 100);
        const closingMinute = startTime[1] % 100;

        const closingTime = currentTime.set('hour', closingHour).set('minute', closingMinute).set('second', 0);

        if (currentTimePlus30.isAfter(closingTime)) {
          return formatDateString(currentTime.add(1, 'day').startOf('day'))
        }

        return formatDateString(currentTimePlus30);
      }
      case "This Week": {
        if (isMobile) {
          const currentTime = dayjs(new Date());
          const currentTimePlus30 = currentTime.add(30, 'minute');

          const closingHour = Math.floor(startTime[1] / 100);
          const closingMinute = startTime[1] % 100;

          const closingTime = currentTime.set('hour', closingHour).set('minute', closingMinute).set('second', 0);

          if (currentTimePlus30.isAfter(closingTime)) {
            return formatDateString(currentTime.add(1, 'day').startOf('day'))
          }

          return formatDateString(currentTimePlus30);
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "This Month": {
        if (isMobile) {
          const currentTime = dayjs(new Date());
          const currentTimePlus30 = currentTime.add(30, 'minute');

          const closingHour = Math.floor(startTime[1] / 100);
          const closingMinute = startTime[1] % 100;

          const closingTime = currentTime.set('hour', closingHour).set('minute', closingMinute).set('second', 0);

          if (currentTimePlus30.isAfter(closingTime)) {
            return formatDateString(currentTime.add(1, 'day').startOf('day'))
          }

          return formatDateString(currentTimePlus30);
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "Furthest Day Out To Book":
        return formatDateString(dayjs(new Date()).add(30, "minute"));
      case "Today": {
        const currentTime = dayjs();
        const currentTimePlus30 = currentTime.add(30, 'minute');

        const closingHour = Math.floor(startTime[1] / 100);
        const closingMinute = startTime[1] % 100;

        const closingTime = currentTime.set('hour', closingHour).set('minute', closingMinute).set('second', 0);

        if (currentTimePlus30.isAfter(closingTime)) {
          return formatDateString(currentTime.add(1, 'day').startOf('day').add(30, 'minute'));
        }

        return formatDateString(currentTimePlus30);
      }
      case "This Weekend": {
        if (isMobile) {
          const today = dayjs().startOf("day");
          const weekend = dayjs().day(5); // This Friday

          const currentTime = dayjs();
          const currentTimePlus30 = currentTime.add(30, "minute");

          const closingHour = Math.floor(startTime[1] / 100);
          const closingMinute = startTime[1] % 100;

          const closingTime = currentTime.set("hour", closingHour).set("minute", closingMinute).set("second", 0);

          // If today is Friday or later
          if (weekend.isSame(today, "day") || weekend.isBefore(today, "day")) {
            if (currentTimePlus30.isAfter(closingTime)) {
              return formatDateString(currentTime.add(1, "day").startOf("day"));
            }
            return formatDateString(currentTimePlus30);
          }

          // Weekend is in the future
          return formatDateString(weekend.startOf("day").toDate());
        }
      }
      // eslint-disable-next-line no-fallthrough
      case "Custom": {
        if (!selectedDay.from) return formatDateString(new Date());
        const customDate = dayjs(
          `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`
        ).startOf("day");
        const today = dayjs().startOf("day");
        if (customDate.isSame(today)) {
          return formatDateString(dayjs(new Date()).add(30, "minute"));
        }
        return formatDateString(customDate);
      }
      default:
        return formatDateString(new Date());
    }
  }, [dateType, selectedDay, queryDateType, specialEvents]);

  const endDate = useMemo(() => {
    const specialDate = getSpecialDayDate(dateType);
    if (specialDate) {
      return formatDateString(specialDate.end);
    }
    setPageNumber(1);

    switch (dateType) {
      case "All":
        return formatDateStringEnd(farthestDateOut);
      case "Today":
        {
          const currentTime = dayjs();
          const currentTimePlus30 = currentTime.add(30, 'minute');

          const closingHour = Math.floor(startTime[1] / 100);
          const closingMinute = startTime[1] % 100;

          const closingTime = currentTime.set('hour', closingHour).set('minute', closingMinute).set('second', 0);

          if (currentTimePlus30.isAfter(closingTime)) {
            return formatDateStringEnd(dayjs().add(1, "day").endOf("day").toDate());
          }

          return formatDateStringEnd(dayjs().endOf("day").toDate());
        }
      case "This Week": {
        const currentDay = dayjs();
        const isSunday = currentDay.day() === 0;

        if (isSunday) {
          return formatDateStringEnd(currentDay.add(1, 'week').endOf('isoWeek').toDate());
        }

        return formatDateStringEnd(currentDay.endOf('isoWeek').toDate());
      }
      case "This Weekend": {
        const currentDay = dayjs();
        const isSunday = currentDay.day() === 0;

        if (isSunday) {
          return formatDateStringEnd(currentDay.add(1, 'week').endOf('isoWeek'));
        }

        return formatDateStringEnd(currentDay.day(7).endOf('day'));
      }
      case "This Month": {
        const today = dayjs();
        const lastDayOfMonth = today.endOf('month');
        if (today.isSame(lastDayOfMonth, 'day')) {
          return formatDateStringEnd(lastDayOfMonth.add(1, 'month').endOf('month').toDate());
        }

        return formatDateStringEnd(lastDayOfMonth.toDate());
      }
      case "Furthest Day Out To Book":
        return formatDateStringEnd(dayjs(farthestDateOut).toDate());
      case "Custom": {
        if (!selectedDay.to) {
          if (selectedDay.from) {
            const endOfDay = dayjs(
              `${selectedDay.from.year}-${selectedDay.from.month}-${selectedDay.from.day}`
            ).endOf("day");
            return formatDateStringEnd(endOfDay);
          }
          return formatDateStringEnd(dayjs().endOf("day").toDate());
        }
        const endDateCustom = dayjs(
          `${selectedDay.to.year}-${selectedDay.to.month}-${selectedDay.to.day}`
        ).endOf("day");
        return formatDateStringEnd(endDateCustom);
      }
      default:
        return formatDateString(dayjs().add(360, "days").toDate());
    }
  }, [dateType, selectedDay, farthestDateOut, specialEvents]);

  // const utcStartDate = dayjs
  //   .utc(startDate)
  //   .utcOffset(course?.timezoneCorrection ?? 0);

  const utcEndDate = dayjs
    .utc(endDate)
    .utcOffset(course?.timezoneCorrection ?? 0);

  const daysData = useMemo(() => {
    const amountOfDays = dayjs(utcEndDate).diff(startDate, "day");
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
        const date = startDate;
        // date = date.add(i, "day");
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
        minDate: startDate,
        maxDate: endDate,
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
    if (isMobile) {
      if (dateType === "Furthest Day Out To Book") {
        setSelectedDate((prev) => {
          if (!prev) return null;

          const prevDate = dayjs(prev).subtract(1, "day");
          const start = dayjs(startDate);

          if (prevDate.isBefore(start, "day")) return prev; // don't go before startDate

          // update state
          setPageNumber((prevPage) => prevPage - 1);
          setTake((prevTake) => prevTake - TAKE);
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });

          return prevDate.toDate().toUTCString();
        });
      } else {
        setSelectedDate((prev) => {
          if (!prev) return null;

          const nextDate = dayjs(prev).add(1, "day");
          const end = dayjs(endDate);

          if (nextDate.isAfter(end, "day")) return prev; // don't exceed endDate

          // update state
          setPageNumber((prevPage) => prevPage + 1);
          setTake((prevTake) => prevTake + TAKE);
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });

          return nextDate.toDate().toUTCString();
        });
      }
    } else {
      if (pageNumber === amountOfPage) return;
      setPageNumber((prev) => prev + 1);
      setTake((prev) => prev + TAKE);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const pageDown = () => {
    if (isMobile) {
      if (dateType === "Furthest Day Out To Book") {
        setSelectedDate((prev) => {
          if (!prev) return null;

          const nextDate = dayjs(prev).add(1, "day");
          const end = dayjs(endDate);

          if (nextDate.isAfter(end, "day")) return prev; // don't exceed endDate

          // update state
          setPageNumber((prevPage) => prevPage + 1);
          setTake((prevTake) => prevTake + TAKE);
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });

          return nextDate.toDate().toUTCString();
        });
      } else {
        setSelectedDate((prev) => {
          if (!prev) return null;

          const prevDate = dayjs(prev).subtract(1, "day");
          const start = dayjs(startDate);

          if (prevDate.isBefore(start, "day")) return prev; // don't go before startDate

          // update state
          setPageNumber((prevPage) => prevPage - 1);
          setTake((prevTake) => prevTake - TAKE);
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });

          return prevDate.toDate().toUTCString();
        });
      }
    } else {
      if (pageNumber === 1) return;
      setPageNumber((prev) => prev - 1);
      setTake((prev) => prev - TAKE);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLoading = (val: boolean) => {
    setIsLoading(val);
  };
  useEffect(() => {
    setPageNumber(1);
  }, [priceRange]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("googlestate");
      localStorage.removeItem("credentials");
      localStorage.removeItem("linkedinstate");
      localStorage.removeItem("facebookstate");
      localStorage.removeItem("applestate");

      microsoftClarityEvent({
        action: ``,
        category: "",
        label: "",
        value: "",
        additionalContent: {
          courseName: course?.name,
          websiteURL: course?.websiteURL,
        },
      });
    }
  }, []);

  const getWeekends = (dates: string[]): string[] => {
    return Array.isArray(dates)
      ? dates.filter((dateStr) => {
        return dateStr.includes('Fri') || dateStr.includes('Sat') || dateStr.includes('Sun');
      })
      : [];
  };

  let datesArr = dateType === "This Weekend" ? getWeekends(datesWithData ?? daysData.arrayOfDates) : JSON.parse(
    JSON.stringify(datesWithData ?? daysData.arrayOfDates)
  );
  const amountOfPage = Math.ceil(
    (datesArr
      ? datesArr.length - 1 === 0
        ? 1
        : datesArr.length
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
    if (source) {
      setBookingSource(source.slice(0, 50));
      sessionStorage.setItem("source", source.slice(0, 50));
    }
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

  const courseImages = useMemo(() => {
    if (!course) return [];
    return course?.images;
  }, [course]);

  const openForecastModal = () => {
    setIsForecastModalOpen(true);
  };
  const divHeight =
    typeof window != "undefined"
      ? document?.getElementById("notification-container")?.offsetHeight
      : undefined;

  // Function to close the modal
  const closeForecastModal = () => {
    setIsForecastModalOpen(false);
  };

  const [selectedCourse, setSelectedCourse] = useState<string>("Select a course");

  const handleCourseSwitch = (courseName: string) => {
    setSelectedCourse(courseName);

    const selected = allSwitchCoursesData && allSwitchCoursesData.length > 0 ?
      allSwitchCoursesData?.find((c) => c.name === courseName) :
      allCoursesData?.find((c) => c.name === courseName);

    if (selected) {
      allSwitchCoursesData && allSwitchCoursesData.length > 0 ? router.push(`/${selected?.switchableCourseId}`) : router.push(`/${selected?.id}`);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(startDate);

  useEffect(() => {
    if (selectedDate && startDate) {
      const diff = dayjs(selectedDate).diff(dayjs(startDate), 'day');
      setPageNumber(diff + 1); // Assuming page 1 is the startDate
    }
  }, [selectedDate, startDate]);

  const dateRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedDate) {
        const ref = dateRefs.current[dayjs(selectedDate).format("YYYY-MM-DD")];
        if (ref) {
          ref.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }
    }, 100); // Waits 100ms to ensure rendering is done

    return () => clearTimeout(timeout);
  }, [selectedDate, isLoadingTeeTimeDate, isLoading, specialEventsLoading, allCoursesDataLoading]);

  useEffect(() => {
    if (dateType === "Furthest Day Out To Book") {
      if (isMobile) {
        const formattedEndDate = dayjs.utc(endDate).format("ddd, DD MMM YYYY 00:00:00 [GMT]");
        setSelectedDate(formattedEndDate);
      } else {
        setSelectedDate(startDate); // use swapped logic for desktop
      }
    } else if (startDate) {
      setSelectedDate(startDate);
    }
  }, [startDate, endDate, dateType, isMobile]);


  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <main className={`bg-secondary-white py-4 md:py-6`}>
      <LoadingContainer
        isLoading={isLoadingTeeTimeDate || isLoading || specialEventsLoading || allCoursesDataLoading}
      >
        <div></div>
      </LoadingContainer>
      {
        !isMobile &&
        <div className="flex gap-8 items-center px-4 md:px-6 ">
          <div className="min-w-[19.375rem]">
            {ALLOW_COURSE_SWITCHING ? <Select
              className="w-full"
              values={
                allSwitchCoursesData && allSwitchCoursesData.length > 0
                  ? allSwitchCoursesData.map((courseItem: { name: string }) => courseItem.name)
                  : (allCoursesData ?? [])
                    .filter((courseItem: { id: string }) => courseItem.id !== course.id)
                    .map((courseItem: { name: string }) => courseItem.name)
              }
              value={selectedCourse}
              setValue={handleCourseSwitch}
            />
              : entity?.redirectToCourseFlag ? null : (
                <GoBack href="/" text={`Back to All Courses`} />
              )}
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex justify-between gap-4  px-4 md:px-0">
              <div className="text-secondary-black">
                {/* Showing {count?.toLocaleString() ?? "0"} tee times{" "} */}
                <span className="text-justify text-sm text-primary-gray">
                  All times shown in course time zone
                </span>
              </div>
            </div>
            {/* <Select
              value={sortValue}
              setValue={handleSetSortValue}
              values={SortOptions}
            /> */}
          </div>
        </div>
      }
      {/* <CourseTitle
        courseName={course?.name ?? ""}
        description={course?.description ?? ""}
        className="px-4 md:px-6"  
      /> */}
      <CourseBanner
        className={!isMobile ? "pt-4" : ""}
        userId={user?.id ?? ""}
        updateHandle={updateHandle}
      />
      <section className="relative flex gap-8 pl-0 md:pl-6 md:pt-8 mx-auto w-full">
        <div
          ref={scrollRef}
          className="absolute -top-[7.5rem] md:-top-[9.2rem]"
        />
        <div className="hidden min-w-[19.375rem] flex-col md:flex">
          <div
            style={{
              top: "calc(9.5rem + 1px)",
              maxHeight: "calc(100vh - 10.5rem)",
            }}
            className="sticky overflow-y-auto overflow-x-hidden flex flex-col gap-4"
          >

            <Filters openForecastModal={openForecastModal} />
          </div>
        </div>
        <div className={`fixed ${isNavExpanded ? "bottom-[9.6rem]" : "bottom-[4.8rem]"} left-1/2 z-10 -translate-x-1/2 md:hidden`}>
          {/* mobile  for filter/sort */}
          <FilterSort toggleFilters={toggleFilters} toggleSort={toggleSort} />
        </div>
        <div className="flex w-full flex-col gap-1 md:gap-4 overflow-x-hidden pr-0p md:pr-6">
          {/* scrollable dates  */}

          {(MOBILE_VIEW_VERSION === "v2" && isMobile) && (
            <div
              className={`w-full overflow-x-auto left-0 top-0 z-10 bg-secondary-white pt-2 pb-2 ${(courseImages?.length > 0 ? scrollY > 333 : scrollY > 45)
                ? "fixed shadow-md"
                : ""
                }`}
              style={{
                top: (courseImages?.length > 0 ? scrollY > 333 : scrollY > 45)
                  ? `${divHeight || 0}px`
                  : "auto",
              }}
            >
              <div
                className="flex gap-2 overflow-x-auto overflow-y-hidden px-2"
                style={{
                  maxWidth: "100%",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE/Edge
                }}
              >
                <div
                  className="flex gap-2 min-w-max"
                  style={{
                    display: "flex",
                  }}
                >
                  {datesArr.map((dateStr: string, idx: number) => {
                    // const dateObj = dayjs(dateStr as string | number | Date | Dayjs | null | undefined);
                    const dateObj = dayjs.utc(dateStr as string | number | Date | Dayjs | null | undefined);

                    const isSelected =
                      selectedDate &&
                      dayjs(selectedDate).utc().format("YYYY-MM-DD") === dateObj.format("YYYY-MM-DD");

                    return (
                      (isLoadingTeeTimeDate || isLoading || specialEventsLoading || allCoursesDataLoading)
                        ? Array.from({ length: 7 }).map((_, idx) => (
                          <div
                            key={`skeleton-${idx}`}
                            className="w-12 h-20 bg-gray-200 rounded-lg animate-pulse"
                          />
                        )) : <button
                          ref={(el) => {
                            if (el) dateRefs.current[dateObj.format("YYYY-MM-DD")] = el;
                          }}
                          key={idx} // unique index-based key
                          onClick={() => handleDateSelect(dateStr)}
                          className={`flex flex-col items-center justify-center rounded-lg px-2 text-sm border transition-all shadow-sm
              ${isSelected
                              ? "text-white font-semibold"
                              : "bg-white text-primary-black border-gray-300 hover:bg-gray-100"
                            }`}
                          style={{
                            borderColor: isSelected ? entity?.color1 : "rgb(255 255 255)",
                            backgroundColor: isSelected ? entity?.color1 : "rgb(255 255 255)",
                          }}
                        >
                          <span className="text-md font-med tracking-wide">
                            {dateObj.format("MMM")}
                          </span>
                          <span className="text-xl font-bold leading-tight">
                            {dateObj.format("D")}
                          </span>
                          <span className="text-[0.8125rem] font-medium">
                            {dateObj.format("ddd")}
                          </span>
                        </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error ? (
            <div className="flex justify-center items-center h-[12.5rem]">
              <div className="text-center">Error: {error}</div>
            </div>
          ) : datesArr?.length === 0 ? (
            <div className="flex justify-center items-center h-[12.5rem]">
              <div className="text-center">
                {isLoadingTeeTimeDate
                  ? "Loading..."
                  : "No Tee Times Available."}
              </div>
            </div>
          ) : (
            MOBILE_VIEW_VERSION === "v2" && isMobile ?
              <>
                <div className="flex w-full flex-col gap-1 md:gap-4" ref={ref}>
                  <ViewportList viewportRef={ref} items={finalRes}>
                    {(date, idx) => (
                      <DailyTeeTimesMobileV2
                        setError={(e: string | null) => {
                          setError(e);
                        }}
                        courseException={getCourseException(date as string)}
                        key={idx}
                        date={selectedDate || date}
                        minDate={startDate.toString()}
                        maxDate={endDate.toString()}
                        handleLoading={handleLoading}
                        pageUp={pageUp}
                        pageDown={pageDown}
                        scrollY={scrollY}
                        divHeight={divHeight}
                        isLoadingTeeTimeDate={isLoadingTeeTimeDate}
                        // datesWithData={datesWithData}
                        allDatesArr={datesArr}
                        toggleFilters={toggleFilters}
                      />
                    )}
                  </ViewportList>
                </div>
              </>
              :
              DESKTOP_VIEW_VERSION === "v2" ?
                <>
                  <div className="flex w-full flex-col gap-1 md:gap-4" ref={ref}>
                    <DailyTeeTimesDesktopV2
                      setError={(e: string | null) => {
                        setError(e);
                      }}
                      minDate={startDate.toString()}
                      maxDate={endDate.toString()}
                      handleLoading={handleLoading}
                      dateType={dateType}
                      dates={datesArr}
                      isLoadingTeeTimeDate={isLoadingTeeTimeDate}
                    />
                  </div>
                </>
                :
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
                          minDate={startDate.toString()}
                          maxDate={endDate.toString()}
                          handleLoading={handleLoading}
                          dateType={dateType}
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

      {/* {showSort && (
        <MobileSort
          setShowSort={setShowSort}
          toggleSort={toggleSort}
          setSortValue={handleSetSortValue}
          sortValue={sortValue}
        />
      )} */}
      {
        showFilters && (
          <MobileFilters
            setShowFilters={setShowFilters}
            toggleFilters={toggleFilters}
            openForecastModal={openForecastModal}
          />
        )
      }
      {
        showDates && (
          <MobileDates
            setShowFilters={setShowDates}
            toggleFilters={toggleDates}
          />
        )
      }
      {
        isForecastModalOpen && (
          <ForecastModal
            closeForecastModal={closeForecastModal}
            startDate={startDate}
            endDate={endDate}
          />
        )
      }
    </main >
  );
}
