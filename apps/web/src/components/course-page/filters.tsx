"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import {
  forwardRef,
  Fragment,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Switch } from "../buttons/switch";
import { Hidden } from "../icons/hidden";
import { Info } from "../icons/info";
import { Slider } from "../input/slider";
import { Tooltip } from "../tooltip";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import { useCourseContext } from "~/contexts/CourseContext";
import type { DateType, GolferType, HoleType } from "~/contexts/FiltersContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { api } from "~/utils/api";
import { debounceFunction } from "~/utils/debounce";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import Image from "next/image";
import { useMediaQuery } from "usehooks-ts";
import { useRouter } from "next/navigation";

interface DayValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface ChildComponentRef {
  getChildValue: () => void;
}

const HoleOptions = ["Any", "18", "9"];

const GolferOptions = ["Any", "1", "2", "3", "4"];

const minimumDate = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
};
const nextYearDate = new Date();
nextYearDate.setFullYear(new Date().getFullYear() + 1);

const maximumDate = {
  year: nextYearDate.getFullYear(),
  month: nextYearDate.getMonth() + 1,
  day: nextYearDate.getDate(),
};

// const disabledDays = getDisabledDays(minimumDate);

export const Filters = forwardRef<ChildComponentRef>((props, ref) => {
  const {
    dateType,
    setDateType,
    holes,
    setHoles,
    golfers,
    setGolfers,
    showUnlisted,
    setShowUnlisted,
    priceRange,
    setPriceRange,
    startTime,
    setStartTime,
    selectedDay,
    setSelectedDay,
    startTimeOptions,
  } = useFiltersContext();
  const { course } = useCourseContext();
  const [dateTypeMobile, setDateTypeMobile] = useState(dateType);
  const [timeMobile, setTimeMobile] = useState(startTime);
  const [switchMobile, setSwitchMobile] = useState(showUnlisted);
  const [holeMobile, setHoleMobile] = useState(holes);
  const [golferMobile, setGolferMobile] = useState(golfers);
  const [selectedDayMobile, setSelectedDayMobile] = useState(selectedDay);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // const { data } = api.searchRouter.findBlackoutDates.useQuery(
  //   { courseId: course?.id ?? "" },
  //   { enabled: course?.id !== undefined }
  // );

  // console.log(data,"blackOutDaysblackOutDaysblackOutDaysblackOutDaysblackOutDaysblackOutDays")

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

  useEffect(() => {
    setPriceRange([lowestPrice, highestPrice]);
  }, [highestPrice, lowestPrice]);

  const [localStartTime, setLocalStartTime] = useState<[number, number]>([
    startTime[0],
    startTime[1],
  ]);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    lowestPrice,
    highestPrice,
  ]);
  const [priceMobile, setPriceMobile] = useState(priceRange);
  const handleSetStartTime = () => {
    setStartTime(localStartTime);
  };

  const handleSetPriceRange = () => {
    setPriceRange(localPriceRange);
  };

  const formatDate = (dateObj) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const day = dateObj?.day;
    const month = months[dateObj?.month - 1];

    return `${month}-${day}`;
  };

  useImperativeHandle(ref, () => ({
    getChildValue() {
      return {
        dateType: dateTypeMobile,
        startTime: timeMobile,
        holes: holeMobile,
        selectedDay: selectedDayMobile,
        golfers: golferMobile,
        priceRange: priceMobile,
      };
    },
  }));

  const setFilter = (type, value) => {
    router.push(`/${course?.id}`)

    switch (type) {
      case "dateType": {
        if (isMobile) {
          setDateTypeMobile(value as DateType);
        } else {
          setDateType(value as DateType);
        }
        break;
      }
      case "time": {
        if (isMobile) {
          setTimeMobile(value as [number, number]);
        } else {
          setLocalStartTime(value as [number, number]);
        }
        break;
      }
      case "hole": {
        if (isMobile) {
          setHoleMobile(value as HoleType);
        } else {
          setHoles(value as HoleType);
        }
        break;
      }
      case "golfer": {
        if (isMobile) {
          setGolferMobile(value as GolferType);
        } else {
          setGolfers(value as GolferType);
        }
        break;
      }
      case "price": {
        if (isMobile) {
          setPriceMobile(value as [number, number]);
        } else {
          setLocalPriceRange(value as [number, number]);
        }
        break;
      }
      case "selectedDay": {
        if (isMobile) {
          setSelectedDayMobile(
            value as {
              from: DayValue;
              to: DayValue;
            }
          );
        } else {
          setSelectedDay(
            value as {
              from: DayValue;
              to: DayValue;
            }
          );
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const startTimeRounded = Math.round(startTime[0] / 100) * 100;
    const endTimeRounded = Math.round(startTime[1] / 100) * 100;

    setLocalStartTime([startTimeRounded, endTimeRounded]);
  }, [startTime]);

  const { data: specialEvents } = api.searchRouter.getSpecialEvents.useQuery({
    courseId: course?.id ?? "",
  });

  const DateOptions = useMemo(() => {
    const defaultDateOptions = [
      "All",
      "Today",
      "This Week",
      "This Weekend",
      "This Month",
      "Furthest Day Out To Book",
      "Custom",
    ];

    const specialEventOptions: string[] =
      specialEvents?.slice(0, 2).map((event) => event.eventName) || [];

    return [...specialEventOptions, ...defaultDateOptions];
  }, [specialEvents]);

  const dateToDayValue = (date: Date): DayValue => ({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  });
  return (
    <div className="flex flex-col gap-4 pr-1">
      <section className="flex flex-col gap-2">
        <div>Date</div>
        <ToggleGroup.Root
          type="single"
          value={isMobile ? dateTypeMobile : dateType}
          onValueChange={(dateType: DateType) => {
            if (dateType) {
              setFilter("dateType", dateType);
              googleAnalyticsEvent({
                action: `FILTER BY ${dateType}`,
                category: "FILTER_DATA",
                label: "filtered data by date",
                value: "",
              });
            }
          }}
          orientation="vertical"
          className="flex flex-col"
        >
          {DateOptions.map((value, index) => (
            <Fragment key={index}>
              <Item
                key={index}
                value={value}
                icon={
                  specialEvents?.find((event) => event.eventName === value)
                    ?.iconUrl || "no-icon"
                }
                label={
                  value === "Custom" ? (
                    <div className="w-full flex justify-between">
                      <span>{value}</span>
                      <span>
                        {isMobile
                          ? dateTypeMobile === "Custom" && (
                            <>
                              {selectedDayMobile.from
                                ? formatDate(selectedDayMobile.from)
                                : ""}
                              {selectedDayMobile.to
                                ? ` - ${formatDate(selectedDayMobile.to)}`
                                : ""}
                            </>
                          )
                          : dateType === "Custom" && (
                            <>
                              {selectedDay.from
                                ? formatDate(selectedDay.from)
                                : ""}
                              {selectedDay.to
                                ? ` - ${formatDate(selectedDay.to)}`
                                : ""}
                            </>
                          )}
                      </span>
                    </div>
                  ) : (
                    value
                  )
                }
                dataTestId="date-filter-id"
                dataQa={value}
                className={`${index === 0
                  ? "rounded-t-2xl border border-stroke"
                  : index === DateOptions.length - 1 && dateType === "Custom"
                    ? "border-l border-r border-stroke"
                    : index === DateOptions.length - 1
                      ? "rounded-b-2xl border-b border-l border-r border-stroke"
                      : "border-b border-l border-r border-stroke"
                  }`}
              />
              {(dateTypeMobile === "Custom" || dateType === "Custom") &&
                value === "Custom" ? (
                <>
                  <div className="custom_calendar">
                    <Calendar
                      value={isMobile ? selectedDayMobile : selectedDay}
                      calendarClassName="responsive-calendar"
                      onChange={
                        isMobile ? setSelectedDayMobile : setSelectedDay
                      }
                      colorPrimary="#40942A"
                      minimumDate={minimumDate}
                      maximumDate={maximumDate}
                    // disabledDays={blackOutDays}
                    />
                    <div
                      className={`z-50 text-sm w-full flex justify-center flex-wrap p-0 px-4 pb-4 `}
                    >
                      {specialEvents?.map((event, i) => (
                        <>
                          <button
                            key={i}
                            className={`inline-block mt-1 ${isMobile ? "mx-4" : "mx-2"
                              }`}
                            onClick={() => {
                              const startDate = new Date(event.startDate);
                              const endDate = new Date(event.endDate);
                              setFilter("selectedDay", {
                                from: dateToDayValue(startDate),
                                to: dateToDayValue(endDate),
                              });
                            }}
                          >
                            {event.eventName}
                          </button>
                        </>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </Fragment>
          ))}
        </ToggleGroup.Root>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>Start Time</div>
          <div>
            {isMobile
              ? startTimeOptions[
                startTimeOptions.findIndex((i) => i.value === timeMobile[0])
              ]?.displayTime
              : startTimeOptions[
                startTimeOptions.findIndex(
                  (i) => i.value === localStartTime[0]
                )
              ]?.displayTime}
            -
            {isMobile
              ? startTimeOptions[
                startTimeOptions.findIndex((i) => i.value === timeMobile[1])
              ]?.displayTime
              : startTimeOptions[
                startTimeOptions.findIndex(
                  (i) => i.value === localStartTime[1]
                )
              ]?.displayTime}
          </div>
        </div>
        <Slider
          min={0}
          max={startTimeOptions.length - 1}
          step={1}
          value={
            isMobile
              ? [
                startTimeOptions.findIndex((i) => i.value === timeMobile[0]),
                startTimeOptions.findIndex((i) => i.value === timeMobile[1]),
              ]
              : [
                startTimeOptions.findIndex(
                  (i) => i.value === localStartTime[0]
                ),
                startTimeOptions.findIndex(
                  (i) => i.value === localStartTime[1]
                ),
              ]
          }
          onPointerUp={() => {
            handleSetStartTime();
          }}
          onValueChange={(time: number[]) => {
            googleAnalyticsEvent({
              action: `FILTER BY START TIME AND END TIME`,
              category: "FILTER_DATA",
              label: "filtered data by date",
              value: "",
            });
            if (
              time &&
              time.length >= 2 &&
              typeof time[0] === "number" &&
              typeof time[1] === "number"
            ) {
              const option1 = startTimeOptions[time[0]];
              const option2 = startTimeOptions[time[1]];
              if (option1 && option2) {
                setFilter("time", [option1.value, option2.value]);
              }
            }
          }}
          data-testid="slider-start-time-id"
          data-qa={`${startTimeOptions.find((i) => i.value === localStartTime[0])
            ?.displayTime
            } - ${startTimeOptions.find((i) => i.value === localStartTime[1])
              ?.displayTime
            }`}
        />
      </section>

      <section className="flex flex-col gap-4">
        {course?.supportsOffers ? (
          <div className="flex items-center gap-2">
            <Switch
              value={isMobile ? switchMobile : showUnlisted}
              setValue={isMobile ? setSwitchMobile : setShowUnlisted}
              dataTestId="filter-switch-not-for-sale-make-an-offer-id"
            />
            <div className="flex items-center gap-1 text-primary-gray">
              <Hidden className="h-[17px] w-[20px]" />
              <div className="text-[15px]">Not for Sale, Make an Offer</div>
              <Tooltip
                trigger={<Info className="h-[14px] w-[14px]" />}
                content="Includes unlisted tee times if checked"
              />
            </div>
          </div>
        ) : null}
        {/* <div className="flex items-center gap-2">
          <Switch
            value={includesCart}
            setValue={setIncludesCart}
            dataTestId="filter-switch-include-cart-id"
          />
          <div className="flex items-center gap-1 text-primary-gray">
            <GolfCart className="h-[17px] w-[20px]" />
            <div className="text-[15px]">Includes Cart</div>
            <Tooltip
              trigger={<Info className="h-[14px] w-[14px]" />}
              content="The cart fee is included in the greens fee when toggled on. Purchasing without a cart may not be available."
            />
          </div>
        </div> */}
      </section>

      <section className="flex flex-col gap-2">
        <div>Holes</div>
        <ToggleGroup.Root
          type="single"
          value={isMobile ? holeMobile : holes}
          onValueChange={(hole: HoleType) => {
            googleAnalyticsEvent({
              action: `FILTER BY Holes`,
              category: "FILTER_DATA",
              label: "filtered data by date",
              value: "",
            });
            if (hole) setFilter("hole", hole);
          }}
          orientation="horizontal"
          className="flex"
        >
          {HoleOptions.map((value, index) => (
            <Item
              key={index}
              value={value}
              label={value}
              dataTestId="hole-filter-id"
              dataQa={value}
              className={`${index === 0
                ? "rounded-l-full border-b border-l border-t border-stroke"
                : index === HoleOptions.length - 1
                  ? "rounded-r-full border-b border-r border-t border-stroke"
                  : "border border-stroke"
                } px-[2.5rem]`}
            />
          ))}
        </ToggleGroup.Root>
      </section>
      <section className="flex flex-col gap-2">
        <div>Golfers</div>
        <ToggleGroup.Root
          type="single"
          value={isMobile ? golferMobile.toString() : golfers.toString()}
          onValueChange={(golfer: string) => {
            googleAnalyticsEvent({
              action: `FILTER BY GOLFERS`,
              category: "FILTER_DATA",
              label: "filtered data by date",
              value: "",
            });
            if (golfer === "Any") {
              setGolfers("Any");
              return;
            }
            if (golfer) setFilter("golfer", Number(golfer) as GolferType);
          }}
          orientation="horizontal"
          className="flex"
        >
          {GolferOptions.map((value, index) => (
            <Item
              key={index}
              value={value}
              label={value}
              dataTestId="golfer-filter-id"
              dataQa={value}
              className={`${index === 0
                ? "rounded-l-full border-b border-l border-t border-stroke"
                : index === GolferOptions.length - 1
                  ? "rounded-r-full border border-stroke"
                  : "border-b border-l border-t border-stroke"
                } px-[1.44rem]`}
            />
          ))}
        </ToggleGroup.Root>
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            Price Range <span className="font-[300]">(per golfer)</span>
          </div>
          <div>
            {isMobile
              ? `$${priceMobile[0]} - $${priceMobile[1]}`
              : `$${localPriceRange[0]} - $${localPriceRange[1]}`}
          </div>
        </div>
        <Slider
          min={lowestPrice}
          max={highestPrice}
          step={5}
          value={isMobile ? priceMobile : localPriceRange}
          onPointerUp={() => {
            handleSetPriceRange();
          }}
          onValueChange={(value: [number, number]) => {
            googleAnalyticsEvent({
              action: `FILTER BY PRICE RANGE`,
              category: "FILTER_DATA",
              label: "filtered data by date",
              value: "",
            });
            debounceFunction(setFilter("price", value), 1000);
          }}
          data-testid="slider-price-range-id"
          data-qa={
            isMobile
              ? `${priceMobile?.[0]}-${priceMobile?.[1]}`
              : `${localPriceRange?.[0]}-${localPriceRange?.[1]}`
          }
        />
      </section>
    </div>
  );
});

export const Item = ({
  value,
  className,
  dataTestId,
  dataQa,
  dataTest,
  dataCy,
  label,
  icon,
}: {
  value: string;
  className?: string;
  dataTestId?: string;
  dataQa?: string;
  dataTest?: string;
  dataCy?: string;
  label?: ReactNode;
  icon?: string | null;
}) => {
  return (
    <ToggleGroup.Item
      value={value}
      className={`bg-white flex items-center px-4 py-2 text-left text-[14px] text-primary-gray transition-colors data-[state=on]:bg-primary data-[state=on]:text-white ${className ?? ""
        }`}
      data-testid={dataTestId}
      data-qa={dataQa}
      data-test={dataTest}
      data-cy={dataCy}
    >
      {icon === "no-icon" ? (
        <div className="mr-2 h-5 w-5" />
      ) : (
        icon && (
          <Image
            src={icon}
            alt={`${value} icon`}
            width={22}
            height={22}
            className="mr-2 h-5 w-5"
          />
        )
      )}
      {label}
    </ToggleGroup.Item>
  );
};

Filters.displayName = "Filters";
