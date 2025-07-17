"use client";

import type { Day } from "@taak/react-modern-calendar-datepicker";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import React, { useEffect, useState } from "react";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { Bell } from "~/components/icons/bell";
import { Campaign } from "~/components/icons/campaign";
import { Close } from "~/components/icons/close";
import { GolfCourse } from "~/components/icons/golf-course";
import { PlaylistAddCheck } from "~/components/icons/playlist-add-check";
import { Timer } from "~/components/icons/timer";
import { ChoosePlayers } from "~/components/input/choose-players";
import { Input } from "~/components/input/input";
import { Slider } from "~/components/input/slider";
import Waitlists from "~/components/waitlist-page/waitlists";
import { useAppContext } from "~/contexts/AppContext";
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
  const [players, setPlayers] = useState("1");
  const courseStartTimeNumber = course?.courseOpenTime ?? 9;
  const courseEndTimeNumber = course?.courseCloseTime ?? 9;
  const { setActivePage } = useAppContext();
  setActivePage("notify-me");

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
    if (!isLoading && !user) {
      router.push(`/${courseId}/login`);
      return;
    }
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

    await createNotifications(notificationsData, {
      onSuccess: (data) => {
        const toastContent = (
          <div>
            <p>{data}</p>
            <p className="text-green-600 text-[0.875rem] font-bold">
              If you don’t see the notification emails please check your Junk
              Mail or Spam folder. Remember to add no-reply@golfdistrict.com to
              the safe senders list.
            </p>
          </div>
        );
        toast.success(toastContent);

        setSelectedDates([]);
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

  return (
    <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[85rem] md:px-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {/* First Column */}
        <div className="col-span-3 flex flex-col items-start pl-4 md:px-6">
          <h1 className="md:text-center text-[1.25rem] capitalize text-secondary-black md:text-[2rem]">
            How Waitlist Works
          </h1>

          <div className="mt-4 w-full">
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <PlaylistAddCheck width={isMobile ? "1.5625rem" : "1.875rem"} />
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
                <Campaign width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Receive Alerts Instantly
                </h2>
                <p className="text-justify text-[0.75rem] md:text-[1rem] text-gray-600">
                  We will alert you when a tee time becomes available or listed
                  for sale.
                </p>
              </div>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mr-4">
                <Timer width={isMobile ? "1.5625rem" : "1.875rem"} />
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
                <GolfCourse width={isMobile ? "1.5625rem" : "1.875rem"} />
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
            Tee Time Waitlist
          </h1>
          <h2 className="md:text-center text-[0.875rem] text-primary-gray px-4 md:text-[1.25rem] mb-4">
            Get alerted when tee times are available
          </h2>
          <hr />
          <div className="grid grid-rows-3 md:grid-rows-3 lg:grid-rows-3 gap-4 px-4 py-2 md:px-8 md:py-6">
            <div className="" id="notify-pick-date">
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
                  <div className="date-selector w-[95%] flex flex-col max-w-[31.25rem] p-6 gap-1 mt-[3.5rem] rounded-xl bg-white fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-50">
                    <Close
                      className="absolute right-4 top-4 cursor-pointer"
                      height={24}
                      width={24}
                      onClick={() => setIsDatePickerOpen(false)}
                    />
                    <h1 className="text-[1.25rem] md:text-2xl">Pick Date(s)</h1>
                    <p className="text-[0.875rem] mb-4 md:text-md">
                      *Schedule your notifications for the rest of the year
                    </p>
                    <Calendar
                      calendarClassName="!m-auto xs:!min-w-fit !h-full !w-[75%] unmask-time !text-[0.625rem]"
                      colorPrimary="#40942A"
                      value={selectedDates}
                      onChange={setSelectedDates}
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
                <label
                  className="text-[0.875rem] text-primary-gray"
                  htmlFor="time-range"
                >
                  Select Time Range
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
              <section className="flex flex-col gap-2">
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
                        const endOption = filteredStartTimeOptions[endIndex];

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
            </div>
            <div className="" id="notify-number-of-players">
              <label className="text-[0.875rem] text-primary-gray">
                {"Number of Players"}
              </label>
              <ChoosePlayers
                className="py-2 !text-[0.625rem] md:!text-[0.875rem]"
                availableSlots={4}
                players={players}
                setPlayers={setPlayers}
                teeTimeId={"-"}
                playersOptions={["1", "2", "3", "4"]}
                numberOfPlayers={["1", "2", "3", "4"]}
                supportsGroupBooking={course?.supportsGroupBooking}
              />
            </div>
          </div>
          <FilledButton
            onClick={handleSubmit}
            className="flex items-center justify-center gap-1 max-w-[12.5rem] w-full mt-4 self-center py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem] disabled:opacity-50 transition-opacity duration-300"
            disabled={isCreatingNotifications}
            id="notify-get-alerted"
          >
            <Bell width="0.9375rem" />
            Get Alerted
          </FilledButton>
          <div className="flex justify-center items-center text-justify mt-2 italic text-primary-gray text-[0.75rem] md:text-[1rem] px-4 py-2 md:px-8 md:py-6">
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
