"use client";

import { useMe } from "~/hooks/useMe";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";
import { Spinner } from "../loading/spinner";
import Waitlist from "./waitlist";

dayjs.extend(UTC);

export type WaitlistItem = {
  id: string;
  courseId: string;
  startTime: number;
  endTime: number;
  playerCount: number;
  date: Date;
  courseName: string;
  startTimeFormated?: string;
  endTimeFormated?: string;
};

function Waitlists() {
  const { user } = useMe();
  const { course } = useParams();
  const {
    data: waitlist,
    refetch: refetchWaitlist,
    isLoading,
    isError,
    error,
  } = api.waitlistNotification.getWaitlist.useQuery(
    { courseId: course as string },
    {
      enabled: user?.id ? true : false,
    }
  );

  const groupedByDate = useMemo(
    () =>
      waitlist?.reduce((acc, item) => {
        const newItem = item as WaitlistItem;
        const date = dayjs(newItem.date);
        const formattedDate = date.format("ddd MMM DD, YYYY");

        const startTimeDate = dayjs(date)
          .utc()
          .add(Math.floor(item.startTime / 100), "hour")
          .add(item.startTime % 100, "minute");
        const endTimeDate = dayjs(date)
          .utc()
          .add(Math.floor(item.endTime / 100), "hour")
          .add(item.endTime % 100, "minute");

        newItem.startTimeFormated = startTimeDate.format("hh:mm A");
        newItem.endTimeFormated = endTimeDate.format("hh:mm A");
        if (!acc[formattedDate]) {
          acc[formattedDate] = [];
        }
        acc[formattedDate].push(newItem);
        return acc;
      }, {}),
    [waitlist]
  );

  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1 bg-white px-4 py-3 rounded-xl md:px-8 md:py-6">
      <h1 className="md:text-center text-[20px] capitalize text-secondary-black md:text-[32px]">
        Your notifications
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-[200px] w-full md:min-w-[370px]">
          <Spinner className="w-[50px] h-[50px]" />
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            Error: {error?.message ?? "An error occurred"}
          </div>
        </div>
      ) : waitlist.length === 0 ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">You have no notifications yet</div>
        </div>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
          {groupedByDate
            ? Object.keys(groupedByDate).map((formattedDate) => (
                <Waitlist
                  key={formattedDate}
                  waitlist={groupedByDate[formattedDate]}
                  formattedDate={formattedDate}
                  refetchWaitlist={refetchWaitlist}
                />
              ))
            : null}
        </div>
      )}
    </div>
  );
}

export default Waitlists;
