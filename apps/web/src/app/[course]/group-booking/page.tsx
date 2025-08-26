"use client";

import type { Day } from "@taak/react-modern-calendar-datepicker";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import React, { useEffect, useMemo, useState } from "react";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { Campaign } from "~/components/icons/campaign";
import { Close } from "~/components/icons/close";
import { GolfCourse } from "~/components/icons/golf-course";
import { PlaylistAddCheck } from "~/components/icons/playlist-add-check";
import { Timer } from "~/components/icons/timer";
import { Input } from "~/components/input/input";
import { SingleSlider } from "~/components/input/single-slider";
import { useCourseContext } from "~/contexts/CourseContext";
import dayjs from "dayjs";
import { useMediaQuery } from "usehooks-ts";
import type { TeeTimeGroups } from "./GroupBookingPage";
import GroupBookingPage from "./GroupBookingPage";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import { useAppContext } from "~/contexts/AppContext";
import { Info } from "~/components/icons/info";
import { Tooltip } from "~/components/tooltip";
import { SelectGroupSize } from "~/components/input/select-group-size";
import { useSearchParams } from "next/navigation";
const tomorrow = dayjs().add(1, "day");

function GroupBooking({ params }: { params: { course: string } }) {
  const searchParams = useSearchParams();
  const time = searchParams.get("time");
  const date = searchParams.get("date");
  const dateObject = date !== "undefined" && date !== "null" ? {
    day: Number(date?.split("-")[2]),
    month: Number(date?.split("-")[1]),
    year: Number(date?.split("-")[0]),
  } : null;
  const { course } = useCourseContext();
  const STEP = course?.isOnlyGroupOfFourAllowed ? 4 : 1;
  const SLIDER_MIN = course?.groupBookingMinSize ?? 0;
  const SLIDER_MAX = course?.groupBookingMaxSize ?? 0;
  // const showDropdownForPlayers = SLIDER_MAX > 15;

  function getSliderSteps(min, max, step) {
    let count = 0;
    for (let i = min; i <= max; i += step) {
      count++;
    }
    return count;
  }
  const showNumberInBetween = getSliderSteps(SLIDER_MIN, SLIDER_MAX, STEP);

  const courseId = params.course;
  const [courseStartTimeNumber, courseEndTimeNumber] = useMemo(() => {
    if (course?.groupStartTime && course?.groupEndTime) {
      return [course?.groupStartTime, course?.groupEndTime]
    } else {
      const endTime = course?.courseCloseTime ?? 9;
      const startTime = course?.courseOpenTime ?? 9;
      return [startTime, endTime];
    }
  }, [course]);
  const [selectedDate, setSelectedDate] = useState<Day>(date && dateObject ? dateObject : { day: tomorrow.date(), month: tomorrow.month() + 1, year: tomorrow.year() });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [displayDates, setDisplayDates] = useState<string>("");
  const [players, setPlayers] = useState(SLIDER_MIN);
  const { setActivePage, entity } = useAppContext();
  setActivePage("group-booking")
  const [startTime, setStartTime] = useState<[number, number]>([
    courseStartTimeNumber,
    courseEndTimeNumber,
  ]);
  const [timeMobile, setTimeMobile] = useState(startTime);
  const [teeTimeData, setTeeTimeData] = useState<TeeTimeGroups | null>(null);
  const [selectedTime, setSelectedTime] = useState<number[]>([0]);

  const formatTime = (hour: number, minute: number) => {
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const period = hour < 12 ? "AM" : "PM";
    return `${formattedHour}:${minute === 0 ? "00" : minute} ${period}`;
  };

  const startTimeOptions: { displayTime: string; value: number }[] = [];

  const openHour = new Date(course?.openTime ?? "").getHours();
  const closeHour = new Date(course?.closeTime ?? "").getHours();
  for (let hour = openHour; hour <= closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      startTimeOptions.push({
        displayTime: formatTime(hour, minute),
        value: hour * 100 + minute, // `HHmm` format
      });
    }
  }
  const [filteredStartTimeOptions, setFilteredStartTimeOptions] = useState<
    { displayTime: string; value: number }[]
  >([]);

  const { mutateAsync: fetchAvailableTeeTimes, isLoading: isTeeTimesLoading } = api.searchRouter.getAvailableTimesForGroupedBookings.useMutation();

  useEffect(() => {
    if (!course) return;

    const options = startTimeOptions.filter((option) => {
      const optionTimeNum = option.value;
      return (
        optionTimeNum >= courseStartTimeNumber &&
        optionTimeNum <= courseEndTimeNumber
      );
    });

    setFilteredStartTimeOptions(options);
  }, [course]);

  const [localStartTime, setLocalStartTime] = useState<[number, number]>([
    startTime[0],
    startTime[1],
  ]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSetStartTime = () => {
    setStartTime(localStartTime);
    handleResetQueryResults();
  };

  const currentDate = dayjs().add(1, "day");

  const minimumDate = {
    year: currentDate.year(),
    month: currentDate.month() + 1,
    day: currentDate.date(),
  };

  const setFilter = (type, value) => {
    switch (type) {
      case "time": {
        if (isMobile) {
          setTimeMobile(value as [number, number]);
        } else {
          setLocalStartTime(value as [number, number]);
        }
        break;
      }

      default:
        break;
    }
  };

  const handleSubmit = async () => {
    try {
      window.location.hash = ""
      const data = await fetchAvailableTeeTimes({
        courseId,
        startTime: startTime[0],
        endTime: startTime[1],
        dates: [`${(selectedDate.year)}-${selectedDate.month.toString().padStart(2, '0')}-${(selectedDate.day).toString().padStart(2, '0')}`],
        golferCount: players,
        minimumGolferGroup: 4
      });
      if (data) {
        setTeeTimeData(data);
        document.getElementById('your-selection')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setTeeTimeData(null);
      }
    } catch (error) {
      toast.error("Failed to get tee times");
      console.error("Error fetching tee times:", error);
    }
  }

  useEffect(() => {
    const datesToDisplay = dayjs(`${selectedDate.year ?? ""}-${selectedDate.month ?? ""}-${selectedDate.day ?? ""}`).format("MMM DD")

    setDisplayDates(datesToDisplay);
    handleResetQueryResults();
  }, [selectedDate]);

  useEffect(() => {
    if (filteredStartTimeOptions.length > 0 && time && time !== 'undefined' && time !== 'null') {
      if (filteredStartTimeOptions[0] === undefined) return;
      let selectedTimeOption = filteredStartTimeOptions[0];
      let optionIndex = 0;

      for (const option of filteredStartTimeOptions) {
        if (option.value > Number(time)) {
          break;
        }
        selectedTimeOption = option;
        optionIndex++;
      }
      setLocalStartTime((prev) => [
        selectedTimeOption.value,
        prev[1],
      ]);

      setFilter("time", [
        selectedTimeOption.value,
        localStartTime[1],
      ]);
      setSelectedTime([optionIndex]);
      setStartTime((prev) => {
        return [
          selectedTimeOption.value,
          prev[1],
        ];
      })
    }
  }, [filteredStartTimeOptions])

  const handleSingleSliderChange = (value: number[]) => {
    if (value[0]) {
      setPlayers(value[0]);
      handleResetQueryResults();
    } else {
      toast.error("Error selecting number of players");
    }
  };

  const handleResetQueryResults = () => {
    setTeeTimeData(null);
  }
  return (
    <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[85rem] justify-center md:px-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {/* First Column */}
        <div className="col-span-3 flex flex-col items-start pl-4 md:px-6">
          <h1 className="md:text-center text-[1.25rem] capitalize text-secondary-black md:text-[2rem]">
            How Group Booking Works
          </h1>

          <div className="mt-4 w-full">
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <PlaylistAddCheck fill={entity?.color1} width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Set Your Preferences
                </h2>
                <p className="text-justify text-[0.75rem] md:text-[1rem] text-gray-600">
                  Choose your ideal play date, time range, and number of
                  players.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Campaign fill={entity?.color1} width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Visual Time Breakdown
                </h2>
                <p className="text-justify text-[0.75rem] md:text-[1rem] text-gray-600">
                  See your times visually how they are spread apart.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Timer fill={entity?.color1} width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Book in Seconds
                </h2>
                <p className="text-justify text-[0.75rem] md:text-[1rem] text-gray-600">
                  Act fast to lock in your spots before someone else does!
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <GolfCourse fill={entity?.color1} width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Enjoy Your Round
                </h2>
                <p className="text-justify text-[0.75rem] md:text-[1rem] text-gray-600">
                  Confirm your bookings, hit the greens, and make the most of
                  your day!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Column - your existing code */}
        <div className="col-span-5 flex flex-col justify-center gap-1 bg-white  py-2 rounded-xl md:py-6 shadow">
          <h1 className="md:text-center text-[1.25rem] capitalize text-secondary-black px-4 md:text-[2rem]">
            Group Booking
          </h1>
          <h2 className="md:text-center text-[0.875rem] text-primary-gray px-4 md:text-[1.25rem] mb-4">
            Configure your group to book them together.
          </h2>
          <hr />
          <div className="grid grid-rows-3 md:grid-rows-3 lg:grid-rows-3 gap-4 px-4 py-2 md:px-8 md:py-6 items-center">
            <div className="" id="pick-date-field">
              <Input
                readOnly
                className="cursor-pointer text-ellipsis unmask-time"
                label="Select Your Date"
                name="dates"
                register={() => undefined}
                value={displayDates}
                placeholder="Dates..."
                onChange={() => null}
                onClick={() => setIsDatePickerOpen(true)}
              />
              {isDatePickerOpen && (
                <>
                  <div
                    className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
                    onClick={() => setIsDatePickerOpen(false)}
                  >
                    <div className="h-screen bg-[#00000099]" />
                  </div>
                  <div className="date-selector w-[95%] flex flex-col max-w-[31.25rem] p-6 gap-1 mt-14 rounded-xl bg-white fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[60%] z-50">
                    <Close
                      className="absolute right-4 top-4 cursor-pointer"
                      height={24}
                      width={24}
                      onClick={() => setIsDatePickerOpen(false)}
                    />
                    <h1 className="text-[1.25rem] md:text-2xl">Select Your Date</h1>
                    <p className="text-justify text-[0.875rem] mb-4 md:text-md">
                      *Schedule your notifications for the rest of the year
                    </p>
                    <Calendar
                      calendarClassName="!m-[0px] !h-[100%] !w-[75%] xs:!min-w-fit unmask-time !text-[0.625rem]"
                      colorPrimary="#40942A"
                      value={selectedDate}
                      onChange={(date: Day) => setSelectedDate(date)}
                      minimumDate={minimumDate}
                    />
                    <FilledButton
                      className="w-full mt-2 py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem]"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      Done
                    </FilledButton>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2" id="pick-start-time-field">
              <div className="flex items-center justify-between">
                <label className="text-[0.875rem] text-primary-gray" htmlFor="time-range">
                  Select Ideal Start Time
                </label>
                <div>
                  {isMobile
                    ? startTimeOptions[
                      startTimeOptions.findIndex(
                        (i) => i.value === timeMobile[0]
                      )
                    ]?.displayTime
                    : startTimeOptions[
                      startTimeOptions.findIndex(
                        (i) => i.value === localStartTime[0]
                      )
                    ]?.displayTime}
                </div>
              </div>
              <section className="flex flex-col gap-2">
                <SingleSlider
                  id="time-range"
                  min={0}
                  max={filteredStartTimeOptions.length - 1}
                  step={1}
                  value={selectedTime}
                  onValueChange={(values) => {
                    const startIndex = values[0];
                    if (
                      typeof startIndex === "number" &&
                      startIndex >= 0 &&
                      startIndex < filteredStartTimeOptions.length
                    ) {
                      const startOption = filteredStartTimeOptions[startIndex];

                      if (startOption) {
                        setLocalStartTime((prev) => [
                          startOption.value,
                          prev[1],
                        ]);

                        setFilter("time", [
                          startOption.value,
                          localStartTime[1],
                        ]);
                        setSelectedTime([startIndex]);
                      }
                    }
                  }
                  }
                  onPointerUp={handleSetStartTime}
                  aria-label="Select start and end times"
                  data-testid="slider-time-range"
                />
              </section>
            </div>
            <div className="grid grid-cols-1 gap-2" id="pick-number-of-players-field">
              <div className="flex items-center gap-1">
                <label htmlFor="slider-number-of-players" className="text-[0.875rem] text-primary-gray">
                  Select Group Size
                </label>
                <Tooltip
                  trigger={<Info className="h-[0.875rem] w-[0.875rem] text-primary-gray" />}
                  content="For groups over the maximum size, call the course for special accommodations. All other bookings must be made online."
                />
              </div>
              {showNumberInBetween > 15 ? (
                <div className="w-full">
                  <SelectGroupSize
                    values={Array.from(
                      { length: Math.floor((SLIDER_MAX - SLIDER_MIN) / STEP) + 1 },
                      (_, i) => (SLIDER_MIN + STEP * i).toString()
                    )}
                    value={players.toString()}
                    setValue={(val) => {
                      setPlayers(Number(val));
                      handleResetQueryResults();
                    }}
                  />
                </div>
              ) : (
                <div className="relative mt-2">
                  <div className="flex justify-between text-sm mb-2 ">
                    {Array.from({ length: (SLIDER_MAX - SLIDER_MIN) + 1 }, (_, i) => (SLIDER_MIN + i) % STEP === 0 ? (SLIDER_MIN + i) : "").map(
                      (number, idx) => (
                        <span
                          key={`${number}_${idx}`}
                          className="text-center"
                          style={{ width: `1.25rem` }}
                        >
                          {number}
                        </span>
                      )
                    )}
                  </div>
                  <SingleSlider
                    id="slider-number-of-players"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={STEP}
                    onValueChange={(value) => handleSingleSliderChange(value)}
                    aria-label="Select number of players"
                    data-testid="slider-number-of-players"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center" id="see-available-times">
            <FilledButton
              onClick={handleSubmit}
              className="flex items-center justify-center gap-1 max-w-[12.5rem] w-full mt-4 self-center py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem] disabled:opacity-50 transition-opacity duration-300"
              disabled={isTeeTimesLoading || !displayDates}
            >
              See Available Times
            </FilledButton>
          </div>
          <div className="text-justify flex justify-center items-center mt-2 italic text-primary-gray text-[0.75rem] md:text-[1rem] px-4 py-2 md:px-8 md:py-6">
            <p>
              Bookings are paid in advance and non-refundable. If plans change
              simply list your time for sale, and easily cash out.
            </p>
          </div>
        </div>
      </div>
      <hr />
      <GroupBookingPage teeTimesData={teeTimeData} isTeeTimesLoading={isTeeTimesLoading} playerCount={players} />
    </section>
  );
}
export default GroupBooking;
