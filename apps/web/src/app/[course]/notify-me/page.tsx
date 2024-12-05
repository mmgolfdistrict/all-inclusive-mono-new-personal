"use client";

import type { Day } from "@taak/react-modern-calendar-datepicker";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import React, { useEffect, useState } from "react";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { Announcement } from "~/components/icons/announcement";
import { Close } from "~/components/icons/close";
import { GolfCourse } from "~/components/icons/golf-course";
import { PlaylistAddCheck } from "~/components/icons/playlist-add-check";
import { Stopwatch } from "~/components/icons/stop-watch";
import { ChoosePlayers } from "~/components/input/choose-players";
import { Input } from "~/components/input/input";
import { Slider } from "~/components/input/slider";
import Waitlists from "~/components/waitlist-page/waitlists";
import { useCourseContext } from "~/contexts/CourseContext";
import { useMe } from "~/hooks/useMe";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useMediaQuery } from "usehooks-ts";

function NotifyMe({ params }: { params: { course: string } }) {
  const router = useRouter();
  const { user, isLoading } = useMe();
  const { course } = useCourseContext();
  const courseId = params.course;
  const [selectedDates, setSelectedDates] = useState<Day[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [displayDates, setDisplayDates] = useState<string>("");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("");
  const [players, setPlayers] = useState("1");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const courseStartTime = dayjs(course?.openTime).format("hh:mm A");
  const courseEndTime = dayjs(course?.closeTime).format("hh:mm A");
  const courseStartTimeNumber = Number(dayjs(course?.openTime).format("HHmm"));
  const courseEndTimeNumber = Number(dayjs(course?.closeTime).format("HHmm"));

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

  for (let hour = 6; hour <= 21; hour++) {
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

    const courseStartTimeObj = dayjs(course.openTime, "hh:mm A");
    const courseEndTimeObj = dayjs(course.closeTime, "hh:mm A");

    const courseStartTimeNum = Number(courseStartTimeObj.format("HHmm"));
    const courseEndTimeNum = Number(courseEndTimeObj.format("HHmm"));

    const options = startTimeOptions.filter((option) => {
      const optionTimeNum = option.value;
      return (
        optionTimeNum >= courseStartTimeNum && optionTimeNum <= courseEndTimeNum
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

  if (!course?.supportsWaitlist || !course) {
    router.push(`/${courseId}`);
  }

  const { refetch: refetchWaitlist } = api.userWaitlist.getWaitlist.useQuery(
    { courseId },
    {
      enabled: user?.id ? true : false,
    }
  );

  const {
    mutateAsync: createNotifications,
    isLoading: isCreatingNotifications,
  } = api.userWaitlist.createWaitlistNotification.useMutation();

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

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select a date");
      return;
    }
    if (!startTime[0] || !startTime[1]) {
      toast.error("Please select a time range");
      return;
    }
    const formatTimeToHHmm = (time) => {
      const timeString = time.toString().padStart(4, "0");
      const hours = timeString.slice(0, 2);
      const minutes = timeString.slice(2);
      return `${hours}${minutes}`;
    };

    const notificationsData = {
      courseId,
      startTime: Number(formatTimeToHHmm(startTime[0])),
      endTime: Number(formatTimeToHHmm(startTime[1])),
      dates: selectedDates.map(
        (date) => `${date.year}-${date.month}-${date.day}`
      ),
      playerCount: Number(players),
    };

    const formatTime = (time: string | number) => {
      const timeString = time.toString().padStart(4, "0");
      const hours = parseInt(timeString.slice(0, 2), 10);
      const minutes = parseInt(timeString.slice(2), 10);
      return dayjs().hour(hours).minute(minutes).format("hh:mm a");
    };

    await createNotifications(notificationsData, {
      onSuccess: (data) => {
        toast.success(data);

        setSelectedDates([]);
        const startTimeString = formatTime(courseStartTimeNumber);
        const endTimeString = formatTime(courseEndTimeNumber);
        setTimeRange(`${startTimeString} - ${endTimeString}`);
        // setTimeRange("");
        setLocalStartTime([courseStartTimeNumber, courseEndTimeNumber]);
        setStartTime([courseStartTimeNumber, courseEndTimeNumber]);
        setPlayers("1");
        setTimeMobile([courseStartTimeNumber, courseEndTimeNumber]);
      },
    });

    await refetchWaitlist();
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

  if (!isLoading && !user) {
    router.push(`/${courseId}/login`);
  }

  return (
    <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {/* First Column */}
        <div className="col-span-3 flex flex-col justify-center items-start">
          <h1 className="md:text-center text-[20px] capitalize text-secondary-black md:text-[32px]">
            How Waitlist Works
          </h1>

          <div className="mt-4 w-full">
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <PlaylistAddCheck width="30px" />
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
                <Announcement width="30px" />
              </div>
              <div>
                <h2 className="text-[14px] md:text-[18px] font-semibold">
                  Receive Alerts Instantly
                </h2>
                <p className="text-[12px] md:text-[16px] text-gray-600">
                  We'll alert you when a tee time becomes avialable or listed
                  for sale.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Stopwatch width="30px" />
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
                <GolfCourse width="40px" />
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
        <div className="col-span-5 flex flex-col justify-center gap-1 bg-white px-4 py-2 rounded-xl md:px-8 md:py-6">
          <h1 className="md:text-center text-[20px] capitalize text-secondary-black md:text-[32px]">
            Tee Time Waitlist
          </h1>
          <h2 className="md:text-center text-[14px] text-primary-gray md:text-[20px] mb-4">
            Get alerted when tee times are available
          </h2>
          <hr />
          <div className="grid grid-rows-3 md:grid-rows-3 lg:grid-rows-3 gap-4">
            <div className="">
              <Input
                className="cursor-pointer text-ellipsis"
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
                      calendarClassName="!m-[0px] !h-[100%] !w-[75%]"
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
                    className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
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
              <ChoosePlayers
                className="py-2 !text-[10px] md:!text-[14px]"
                availableSlots={4}
                players={players}
                setPlayers={setPlayers}
                teeTimeId={"-"}
                playersOptions={["1", "2", "3", "4"]}
                numberOfPlayers={["1", "2", "3", "4"]}
              />
            </div>
          </div>
          <FilledButton
            onClick={handleSubmit}
            className="max-w-[200px] w-full mt-4 self-center py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50 transition-opacity duration-300"
            disabled={isCreatingNotifications}
          >
            Get Alerted
          </FilledButton>
          <div className="flex justify-center items-center mt-2 italic text-primary-gray text-[12px] md:text-[16px]">
            <p>
              Bookings are paid in advance and non-refundable. If plans change
              simply list your time for sale, and easily cash out.
            </p>
          </div>
        </div>
      </div>
      <hr />
      <Waitlists />
    </section>
  );
}
export default NotifyMe;
