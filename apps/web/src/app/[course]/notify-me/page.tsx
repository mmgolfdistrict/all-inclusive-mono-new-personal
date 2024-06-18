"use client";

import type { Day } from "@taak/react-modern-calendar-datepicker";
import { Calendar } from "@taak/react-modern-calendar-datepicker";
import React, { useEffect, useState } from "react";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import { DesktopTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { Close } from "~/components/icons/close";
import { ChoosePlayers } from "~/components/input/choose-players";
import { Input } from "~/components/input/input";
import Waitlists from "~/components/waitlist-page/waitlists";
import { useCourseContext } from "~/contexts/CourseContext";
import { useMe } from "~/hooks/useMe";
import { api } from "~/utils/api";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function NotifyMe({ params }: { params: { course: string } }) {
  const router = useRouter();
  const { user, isLoading } = useMe();
  const { course } = useCourseContext();
  const courseId = params.course;
  const [selectedDates, setSelectedDates] = useState<Day[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [displayDates, setDisplayDates] = useState<string>("");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [timeRange, setTimeRange] = useState<string>("");
  const [players, setPlayers] = useState("1");
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  const minimumDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const handleDoneSetTimeRange = () => {
    if (startTime && endTime) {
      const startTimeNum = Number(startTime?.format("HHmm"));
      const endTimeNum = Number(endTime?.format("HHmm"));

      if (startTimeNum > endTimeNum) {
        setErrorMessage("Start time must be before end time");
        setStartTime(null);
        setEndTime(null);
        setTimeRange("");
        return;
      } else {
        setErrorMessage("");
        setIsTimePickerOpen(false);
      }
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
    if (!startTime || !endTime) {
      toast.error("Please select a time range");
      return;
    }
    const notificationsData = {
      courseId,
      startTime: Number(startTime?.format("HHmm")),
      endTime: Number(endTime?.format("HHmm")),
      dates: selectedDates.map(
        (date) => `${date.year}-${date.month}-${date.day}`
      ),
      playerCount: Number(players),
    };

    await createNotifications(notificationsData, {
      onSuccess: (data) => {
        toast.success(data);

        setSelectedDates([]);
        setStartTime(null);
        setEndTime(null);
        setTimeRange("");
        setPlayers("1");
      },
    });
    await refetchWaitlist();
  };

  useEffect(() => {
    const datesToDisplay = selectedDates.map((date) => {
      return dayjs(`${date.year}-${date.month}-${date.day}`).format("MMM DD");
    });
    setDisplayDates(datesToDisplay.join(", "));
  }, [selectedDates]);

  useEffect(() => {
    if (startTime && endTime) {
      const startTimeString = startTime?.format("hh:mm a");
      const endTimeString = endTime?.format("hh:mm a");
      setTimeRange(`${startTimeString} - ${endTimeString}`);
      setErrorMessage("");
    }
  }, [startTime, endTime]);

  if (!isLoading && !user) {
    router.push(`/${courseId}/login`);
  }

  return (
    <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <div className="flex flex-col justify-center gap-1 md:gap-1 bg-white px-4 py-2 rounded-xl md:px-8 md:py-6">
        <h1 className="md:text-center text-[20px] capitalize text-secondary-black md:text-[32px]">
          Tee Time Waitlist
        </h1>
        <h2 className="md:text-center text-[14px] text-primary-gray md:text-[20px] mb-4">
          Get notified when tee times are available
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
          <div className="col-span-3">
            <Input
              className="cursor-pointer text-ellipsis"
              label="When do you want to play?"
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
                  <h1 className="text-[20px] md:text-2xl">
                    When do you want to play?
                  </h1>
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
          <div className="col-span-3">
            <Input
              className="cursor-pointer text-ellipsis"
              label="What time do you want to play?"
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
                    <h1 className="text-[20px] md:text-2xl">
                      What time range?
                    </h1>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="startTime" className="text-primary-gray">
                        Start Time:
                      </label>
                      <DesktopTimePicker
                        name="startTime"
                        minutesStep={5}
                        onChange={(newTime) => setStartTime(newTime)}
                        views={["hours", "minutes"]}
                        value={startTime}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="endTime" className="text-primary-gray">
                        End Time:
                      </label>
                      <DesktopTimePicker
                        name="endTime"
                        minutesStep={5}
                        onChange={(newTime) => setEndTime(newTime)}
                        views={["hours", "minutes"]}
                        value={endTime}
                      />
                    </div>
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
          <div className="col-span-2">
            <label className="text-[14px] text-primary-gray">
              {"How many players?"}
            </label>
            <ChoosePlayers
              className="py-2 !text-[10px] md:!text-[14px]"
              availableSlots={4}
              players={players}
              setPlayers={setPlayers}
              teeTimeId={"-"}
              playersOptions={["1", "2", "3", "4"]}
            />
          </div>
        </div>
        <FilledButton
          onClick={handleSubmit}
          className="max-w-[200px] w-full mt-4 self-center py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50 transition-opacity duration-300"
          disabled={isCreatingNotifications}
        >
          Get Notified
        </FilledButton>
      </div>
      <Waitlists />
    </section>
  );
}
export default NotifyMe;
