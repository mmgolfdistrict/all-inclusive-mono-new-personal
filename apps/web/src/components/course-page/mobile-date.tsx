import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext, type DateType } from "~/contexts/FiltersContext";
import { api } from "~/utils/api";
import { getDisabledDays } from "~/utils/calendar";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import { Fragment, useMemo, type Dispatch, type SetStateAction } from "react";
import { useMediaQuery } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Leaflet } from "../modal/leaflet";
import Image from "next/image";
import { Forecast } from "../icons/forecast";

interface DayValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const minimumDate = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
};

const disabledDays = getDisabledDays(minimumDate);

export const MobileDates = ({
  setShowFilters,
  toggleFilters,
  openForecastModal
}: {
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  toggleFilters: () => void;
  openForecastModal: () => void;
}) => {
  const { dateType, setDateType, selectedDay, setSelectedDay } =
    useFiltersContext();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { course } = useCourseContext();

  const { data } = api.searchRouter.findBlackoutDates.useQuery(
    { courseId: course?.id ?? "" },
    { enabled: course?.id !== undefined }
  );

  const blackOutDays = disabledDays.concat(data ?? []);

  const { data: specialEvents } = api.searchRouter.getSpecialEvents.useQuery({
    courseId: course?.id ?? "",
  });
  console.log("specialEvents", specialEvents);

  const DateOptions = useMemo(() => {
    const defaultDateOptions = [
      "Custom",
      "This Week",
      "This Weekend",
      "This Month",
      "Furthest Day Out To Book",
    ];

    const specialEventOptions =
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

  const forecastModalIcon = () => {
    if (setShowFilters) {
      setShowFilters(false)
    }
    openForecastModal();
  }

  return (
    <Leaflet setShow={setShowFilters} className="max-h-[70dvh]">
      <div className="relative flex flex-col gap-4 px-4 pb-20">
        <div className="border-b py-2 text-xl font-semibold">Date Filters</div>
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              Date
            </div>
            {
              dateType !== "Today" &&
              <div className="cursor-pointer" onClick={forecastModalIcon}>
                <Forecast className="cursor-pointer" height="32px" width="32px" />
              </div>
            }
          </div>
          <ToggleGroup.Root
            type="single"
            value={dateType}
            onValueChange={(dateType: DateType) => {
              if (dateType) {
                setDateType(dateType);
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
                  dataTestId="date-filter-id"
                  dataQa={value}
                  icon={
                    specialEvents?.find((event) => event.eventName === value)
                      ?.iconUrl || "no-icon"
                  }
                  label={

                    value

                  }
                  className={`${index === 0
                    ? "rounded-t-2xl border border-stroke"
                    : index === DateOptions.length - 1 &&
                      dateType === "Custom"
                      ? "border-l border-r border-stroke"
                      : index === DateOptions.length - 1
                        ? "rounded-b-2xl border-b border-l border-r border-stroke"
                        : "border-b border-l border-r border-stroke"
                    }`}
                />
                {dateType === "Custom" && value === "Custom" ? (
                  <>
                    <div className="custom_calendar">
                      <Calendar
                        value={selectedDay}
                        calendarClassName="responsive-calendar"
                        onChange={setSelectedDay}
                        colorPrimary="#40942A"
                        minimumDate={minimumDate}
                        disabledDays={blackOutDays}
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
                                setSelectedDay({
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
        <div className="fixed bottom-10 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-4">
          <OutlineButton className="min-w-[40%]" onClick={toggleFilters}>
            Cancel
          </OutlineButton>
          <FilledButton className="w-full" onClick={toggleFilters}>
            Apply
          </FilledButton>
        </div>
      </div>
    </Leaflet>
  );
};

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
  label?: string;
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
