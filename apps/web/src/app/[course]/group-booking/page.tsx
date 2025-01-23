"use client";

import type { Day } from "@taak/react-modern-calendar-datepicker";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import React, { useEffect, useState } from "react";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { Campaign } from "~/components/icons/campaign";
import { Close } from "~/components/icons/close";
import { GolfCourse } from "~/components/icons/golf-course";
import { PlaylistAddCheck } from "~/components/icons/playlist-add-check";
import { Timer } from "~/components/icons/timer";
import { Input } from "~/components/input/input";
import { SingleSlider } from "~/components/input/single-slider";
import { Slider } from "~/components/input/slider";
import { useCourseContext } from "~/contexts/CourseContext";
import dayjs from "dayjs";
import { useMediaQuery } from "usehooks-ts";

function GroupBooking({ params }: { params: { course: string } }) {
  const { course } = useCourseContext();
  const courseId = params.course;
  const [selectedDates, setSelectedDates] = useState<Day[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [displayDates, setDisplayDates] = useState<string>("");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("");
  const [players, setPlayers] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const courseStartTime = dayjs(course?.openTime).format("hh:mm A");
  const courseEndTime = dayjs(course?.closeTime).format("hh:mm A");
  const courseStartTimeNumber = course?.courseOpenTime ?? 9;
  const courseEndTimeNumber = course?.courseCloseTime ?? 9;

  const [startTime, setStartTime] = useState<[number, number]>([
    courseStartTimeNumber,
    courseEndTimeNumber,
  ]);
  const [timeMobile, setTimeMobile] = useState(startTime);

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

  const courseStartTimeObj = dayjs(courseStartTime, "hh:mm A");
  const courseEndTimeObj = dayjs(courseEndTime, "hh:mm A");

  const [filteredStartTimeOptions, setFilteredStartTimeOptions] = useState<
    { displayTime: string; value: number }[]
  >([]);

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
  };

  const currentDate = dayjs().add(1, "day");

  const minimumDate = {
    year: currentDate.year(),
    month: currentDate.month() + 1,
    day: currentDate.date(),
  };

  const handleDoneSetTimeRange = () => {
    let startTimeNum;
    let endTimeNum;
    if (startTime && startTime.length > 1) {
      startTimeNum = Number(startTime[0]);
      endTimeNum = Number(startTime[1]);
    } else {
      console.error("startTime is invalid:", startTime);
    }
    const courseStartNum = Number(courseStartTimeObj.format("HHmm"));
    const courseEndNum = Number(courseEndTimeObj.format("HHmm"));

    const formatTime = (time: string | number) => {
      const timeString = time.toString().padStart(4, "0");
      const hours = parseInt(timeString.slice(0, 2), 10);
      const minutes = parseInt(timeString.slice(2), 10);
      return dayjs().hour(hours).minute(minutes).format("hh:mm a");
    };

    if (startTimeNum < courseStartNum || endTimeNum > courseEndNum) {
      setErrorMessage("Please select a time within the available duration.");
      return;
    }

    if (startTimeNum > endTimeNum) {
      setErrorMessage("Start time must be before end time");
      const startTimeString = formatTime(courseStartNum);
      const endTimeString = formatTime(courseEndNum);
      setTimeRange(`${startTimeString} - ${endTimeString}`);
      // setTimeRange("");
      return;
    } else {
      setErrorMessage("");
      setIsTimePickerOpen(false);
    }
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

  const handleTimePickerClose = () => {
    setIsTimePickerOpen(false);
    setErrorMessage("");
  };

  useEffect(() => {
    const datesToDisplay = selectedDates
      .sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        return dateA.getTime() - dateB.getTime();
      })
      .map((date) =>
        dayjs(`${date.year}-${date.month}-${date.day}`).format("MMM DD")
      );
    setDisplayDates(datesToDisplay.join(", "));
  }, [selectedDates]);

  useEffect(() => {
    if (startTime[0] && startTime[1]) {
      const formatTime = (time: string | number) => {
        const timeString = time.toString().padStart(4, "0");
        const hours = parseInt(timeString.slice(0, 2), 10);
        const minutes = parseInt(timeString.slice(2), 10);
        return dayjs().hour(hours).minute(minutes).format("hh:mm a");
      };

      const startTimeString = formatTime(startTime[0]);
      const endTimeString = formatTime(startTime[1]);
      setTimeRange(`${startTimeString} - ${endTimeString}`);
      setErrorMessage("");
    }
  }, [startTime[0], startTime[1]]);

  const handleSingleSliderChange = (e: any) => {
    setPlayers(e);
  };

  return (
    <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {/* First Column */}
        <div className="col-span-3 flex flex-col items-start pl-4 md:px-6">
          <h1 className="md:text-center text-[20px] capitalize text-secondary-black md:text-[32px]">
            How Group Booking Works
          </h1>

          <div className="mt-4 w-full">
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <PlaylistAddCheck width={isMobile ? "25px" : "30px"} />
              </div>
              <div>
                <h2 className="text-[14px] md:text-[18px] font-semibold">
                  Set Your Preferences
                </h2>
                <p className="text-[12px] md:text-[16px] text-gray-600">
                  Choose your ideal play date, time range, and number of
                  players.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Campaign width={isMobile ? "25px" : "30px"} />
              </div>
              <div>
                <h2 className="text-[14px] md:text-[18px] font-semibold">
                  Visual Time Breakdown
                </h2>
                <p className="text-[12px] md:text-[16px] text-gray-600">
                  See your times visually how they are spread apart.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Timer width={isMobile ? "25px" : "30px"} />
              </div>
              <div>
                <h2 className="text-[14px] md:text-[18px] font-semibold">
                  Book in Seconds
                </h2>
                <p className="text-[12px] md:text-[16px] text-gray-600">
                  Act fast to lock in your spots before someone else does!
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <GolfCourse width={isMobile ? "25px" : "30px"} />
              </div>
              <div>
                <h2 className="text-[14px] md:text-[18px] font-semibold">
                  Enjoy Your Round
                </h2>
                <p className="text-[12px] md:text-[16px] text-gray-600">
                  Confirm your bookings, hit the greens, and make the most of
                  your day!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Column - your existing code */}
        <div className="col-span-5 flex flex-col justify-center gap-1 bg-white  py-2 rounded-xl md:py-6 shadow">
          <h1 className="md:text-center text-[20px] capitalize text-secondary-black px-4 md:text-[32px]">
            Group Booking
          </h1>
          <h2 className="md:text-center text-[14px] text-primary-gray px-4 md:text-[20px] mb-4">
            Configure your group to book them together.
          </h2>
          <hr />
          <div className="grid grid-rows-3 md:grid-rows-3 lg:grid-rows-3 gap-4 px-4 py-2 md:px-8 md:py-6">
            <div className="">
              <Input
                readOnly
                className="cursor-pointer text-ellipsis unmask-time"
                label="Pick Date(s)"
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
                  <div className="date-selector w-[95%] flex flex-col max-w-[500px] p-6 gap-1 mt-14 rounded-xl bg-white fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[60%] z-50">
                    <Close
                      className="absolute right-4 top-4 cursor-pointer"
                      height={24}
                      width={24}
                      onClick={() => setIsDatePickerOpen(false)}
                    />
                    <h1 className="text-[20px] md:text-2xl">Pick Date(s)</h1>
                    <p className="text-[14px] mb-4 md:text-md">
                      *Schedule your notifications for the rest of the year
                    </p>
                    <Calendar
                      calendarClassName="!m-[0px] !h-[100%] !w-[75%] unmask-time"
                      colorPrimary="#40942A"
                      value={selectedDates}
                      onChange={setSelectedDates}
                      minimumDate={minimumDate}
                    />
                    <FilledButton
                      className="w-full mt-2 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px]"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      Done
                    </FilledButton>
                  </div>
                </>
              )}
            </div>
            <div className="">
              <Input
                readOnly
                className="cursor-pointer text-ellipsis"
                label="Select Time Range"
                placeholder="Times..."
                name="times"
                register={() => undefined}
                onClick={() => setIsTimePickerOpen(true)}
                value={timeRange}
                onChange={() => null}
              />
              {isTimePickerOpen && (
                <>
                  <div
                    className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur unmask-time`}
                    onClick={() => setIsTimePickerOpen(false)}
                  >
                    <div className="h-screen bg-[#00000099]" />
                  </div>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <div className="w-[95%] flex flex-col max-w-[500px] p-6 gap-4 mt-14 rounded-xl bg-white fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[60%] z-50">
                      <Close
                        className="absolute right-4 top-4 cursor-pointer"
                        height={24}
                        width={24}
                        onClick={handleTimePickerClose}
                      />
                      <div>
                        <span>
                          Tee time available hours : {courseStartTime} -{" "}
                          {courseEndTime}
                        </span>
                      </div>
                      <h1 className="text-[20px] md:text-2xl">
                        Select Time Range
                      </h1>
                      <section className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>Start Time</div>
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
                            -
                            {isMobile
                              ? startTimeOptions[
                                  startTimeOptions.findIndex(
                                    (i) => i.value === timeMobile[1]
                                  )
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
                          max={filteredStartTimeOptions.length - 1}
                          step={1}
                          value={
                            isMobile
                              ? [
                                  filteredStartTimeOptions.findIndex(
                                    (i) => i.value === timeMobile[0]
                                  ),
                                  filteredStartTimeOptions.findIndex(
                                    (i) => i.value === timeMobile[1]
                                  ),
                                ]
                              : [
                                  filteredStartTimeOptions.findIndex(
                                    (i) => i.value === localStartTime[0]
                                  ),
                                  filteredStartTimeOptions.findIndex(
                                    (i) => i.value === localStartTime[1]
                                  ),
                                ]
                          }
                          onValueChange={(values) => {
                            if (Array.isArray(values) && values.length === 2) {
                              const startIndex = values[0];
                              const endIndex = values[1];

                              if (
                                typeof startIndex === "number" &&
                                typeof endIndex === "number" &&
                                startIndex >= 0 &&
                                endIndex >= 0 &&
                                startIndex < filteredStartTimeOptions.length &&
                                endIndex < filteredStartTimeOptions.length
                              ) {
                                const startOption =
                                  filteredStartTimeOptions[startIndex];
                                const endOption =
                                  filteredStartTimeOptions[endIndex];

                                if (startOption && endOption) {
                                  setLocalStartTime([
                                    startOption.value,
                                    endOption.value,
                                  ]);

                                  setFilter("time", [
                                    startOption.value,
                                    endOption.value,
                                  ]);
                                }
                              }
                            }
                          }}
                          onPointerUp={handleSetStartTime}
                          aria-label="Select start and end times"
                          data-testid="slider-time-range"
                        />
                      </section>
                      <div>
                        <span
                          className={`text-[12px] text-red ${
                            errorMessage ? "" : "hidden"
                          }`}
                        >
                          {errorMessage}
                        </span>
                        <FilledButton
                          className="w-full mt-2 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px]"
                          onClick={handleDoneSetTimeRange}
                        >
                          Done
                        </FilledButton>
                      </div>
                    </div>
                  </LocalizationProvider>
                </>
              )}
            </div>
            <div className="">
              <label className="text-[14px] text-primary-gray">
                {"Number of Players"}
              </label>
              <div className="relative mt-2">
                <div className="flex justify-between text-sm mb-2">
                  {Array.from({ length: 15 }, (_, i) => 10 + i).map(
                    (number) => (
                      <span
                        key={number}
                        className="text-center"
                        style={{ width: "6.66%" }}
                      >
                        {number}
                      </span>
                    )
                  )}
                </div>
                <SingleSlider
                  min={10}
                  max={24}
                  step={1}
                  onValueChange={(e) => handleSingleSliderChange(e)}
                  aria-label="Select number of players"
                  data-testid="slider-number-of-players"
                />
              </div>
            </div>
          </div>
          <FilledButton
            // onClick={handleSubmit}
            className="flex items-center justify-center gap-1 max-w-[200px] w-full mt-4 self-center py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50 transition-opacity duration-300"
            // disabled={}
          >
            See Available Times
          </FilledButton>
          <div className="flex justify-center items-center mt-2 italic text-primary-gray text-[12px] md:text-[16px] px-4 py-2 md:px-8 md:py-6">
            <p>
              Bookings are paid in advance and non-refundable. If plans change
              simply list your time for sale, and easily cash out.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default GroupBooking;
