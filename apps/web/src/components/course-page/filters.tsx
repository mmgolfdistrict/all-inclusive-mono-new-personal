"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Switch } from "../buttons/switch";
import { GolfCart } from "../icons/golf-cart";
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
import { getDisabledDays } from "~/utils/calendar";

const DateOptions = [
  "All",
  "Today",
  "This Week",
  "This Weekend",
  "This Month",
  "Furthest Day Out To Book",
  "Custom",
];

const HoleOptions = ["Any", "18", "9"];

const GolferOptions = ["Any", "1", "2", "3", "4"];

const minimumDate = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
};

const disabledDays = getDisabledDays(minimumDate);

export const Filters = () => {
  const {
    dateType,
    setDateType,
    holes,
    setHoles,
    golfers,
    setGolfers,
    showUnlisted,
    setShowUnlisted,
    includesCart,
    setIncludesCart,
    // priceRange,
    setPriceRange,
    startTime,
    setStartTime,
    selectedDay,
    setSelectedDay,
    startTimeOptions,
  } = useFiltersContext();
  const { course } = useCourseContext();
  const { data } = api.searchRouter.findBlackoutDates.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    { courseId: course?.id! },
    { enabled: course?.id !== undefined }
  );

  const blackOutDays = disabledDays.concat(data ?? []);

  const highestPrice = useMemo(() => {
    if (!course) return 0;
    if (course.highestListedTeeTime > course.highestPrimarySaleTeeTime) {
      return course.highestListedTeeTime * 2;
    } else {
      return course.highestPrimarySaleTeeTime * 2;
    }
  }, [course]);

  const lowestPrice = useMemo(() => {
    if (!course) return 0;
    if (course.lowestListedTeeTime < course.lowestPrimarySaleTeeTime) {
      return course.lowestListedTeeTime;
    } else {
      return course.lowestPrimarySaleTeeTime;
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

  const handleSetStartTime = () => {
    setStartTime(localStartTime);
  };

  const handleSetPriceRange = () => {
    setPriceRange(localPriceRange);
  };

  return (
    <div className="flex flex-col gap-4 pr-1">
      <section className="flex flex-col gap-2">
        <div>Date</div>
        <ToggleGroup.Root
          type="single"
          value={dateType}
          onValueChange={(dateType: DateType) => {
            if (dateType) setDateType(dateType);
          }}
          orientation="vertical"
          className="flex flex-col"
        >
          {DateOptions.map((value, index) => (
            <Fragment key={index}>
              <Item
                key={index}
                value={value}
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
              {dateType === "Custom" && value === "Custom" ? (
                <Calendar
                  value={selectedDay}
                  calendarClassName="responsive-calendar"
                  onChange={setSelectedDay}
                  colorPrimary="#40942A"
                  minimumDate={minimumDate}
                  disabledDays={blackOutDays}
                />
              ) : null}
            </Fragment>
          ))}
        </ToggleGroup.Root>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>Start Time</div>
          <div>
            {
              startTimeOptions[
                startTimeOptions.findIndex((i) => i.value === localStartTime[0])
              ]?.displayTime
            }
            -
            {
              startTimeOptions[
                startTimeOptions.findIndex((i) => i.value === localStartTime[1])
              ]?.displayTime
            }
          </div>
        </div>
        <Slider
          min={0}
          max={startTimeOptions.length - 1}
          step={1}
          value={[
            startTimeOptions.findIndex((i) => i.value === localStartTime[0]),
            startTimeOptions.findIndex((i) => i.value === localStartTime[1]),
          ]}
          onPointerUp={() => {
            handleSetStartTime();
          }}
          onValueChange={(time: number[]) => {
            if (
              time &&
              time.length >= 2 &&
              typeof time[0] === "number" &&
              typeof time[1] === "number"
            ) {
              const option1 = startTimeOptions[time[0]];
              const option2 = startTimeOptions[time[1]];
              if (option1 && option2) {
                setLocalStartTime([option1.value, option2.value]);
              }
            }
          }}
          data-testid="slider-start-time-id"
          data-qa={`${startTimeOptions.find((i) => i.value === localStartTime[0])?.displayTime} - ${startTimeOptions.find((i) => i.value === localStartTime[1])?.displayTime
            }`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Switch
            value={showUnlisted}
            setValue={setShowUnlisted}
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
        <div className="flex items-center gap-2">
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
              content="Includes Cart"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div>Holes</div>
        <ToggleGroup.Root
          type="single"
          value={holes}
          onValueChange={(hole: HoleType) => {
            if (hole) setHoles(hole);
          }}
          orientation="horizontal"
          className="flex"
        >
          {HoleOptions.map((value, index) => (
            <Item
              key={index}
              value={value}
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
          value={golfers.toString()}
          onValueChange={(golfer: string) => {
            if (golfer === "Any") {
              setGolfers("Any");
              return;
            }
            if (golfer) setGolfers(Number(golfer) as GolferType);
          }}
          orientation="horizontal"
          className="flex"
        >
          {GolferOptions.map((value, index) => (
            <Item
              key={index}
              value={value}
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
            ${localPriceRange[0] + (course?.markup ? course?.markup/100 : 0)}-${localPriceRange[1]}
          </div>
        </div>
        <Slider
          min={lowestPrice}
          max={highestPrice}
          step={10}
          value={localPriceRange}
          onPointerUp={() => {
            handleSetPriceRange();
          }}
          onValueChange={(value: [number, number]) => {
            if (value) setLocalPriceRange(value);
          }}
          data-testid="slider-price-range-id"
          data-qa={`${localPriceRange?.[0]}-${localPriceRange?.[1]}`}
        />
      </section>
    </div>
  );
};

export const Item = ({
  value,
  className,
  dataTestId,
  dataQa,
  dataTest,
  dataCy,
}: {
  value: string;
  className?: string;
  dataTestId?: string;
  dataQa?: string;
  dataTest?: string;
  dataCy?: string;
}) => {
  return (
    <ToggleGroup.Item
      value={value}
      className={`bg-white px-4 py-2 text-left text-[14px] text-primary-gray transition-colors data-[state=on]:bg-primary data-[state=on]:text-white ${className ?? ""
        }`}
      data-testid={dataTestId}
      data-qa={dataQa}
      data-test={dataTest}
      data-cy={dataCy}
    >
      {value}
    </ToggleGroup.Item>
  );
};
