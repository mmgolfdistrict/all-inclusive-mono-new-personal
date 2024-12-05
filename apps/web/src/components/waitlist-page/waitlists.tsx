"use client";

import { useMe } from "~/hooks/useMe";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { DeleteIcon } from "../icons/delete";
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
  const [selectedNotifications, setSelectedNotifications] = useState<
    WaitlistItem[]
  >([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutateAsync: deleteNotifications } =
    api.userWaitlist.deleteWaitlistNotification.useMutation();

  const handleNotificationClick = (notification: WaitlistItem) => {
    if (selectedNotifications.includes(notification)) {
      setSelectedNotifications(
        selectedNotifications.filter((item) => item.id !== notification.id)
      );
    } else {
      setSelectedNotifications([...selectedNotifications, notification]);
    }
  };

  const handleSelectNotifications = (
    notifications: WaitlistItem[],
    selected: boolean
  ) => {
    for (const notification of notifications) {
      if (selected) {
        if (!selectedNotifications.includes(notification)) {
          setSelectedNotifications((previosNotifications) => [
            ...previosNotifications,
            notification,
          ]);
        }
      } else {
        setSelectedNotifications((previosNotifications) =>
          previosNotifications.filter((item) => item.id !== notification.id)
        );
      }
    }
  };

  const handleDeleteNotification = async (id) => {
    await deleteNotifications(
      { ids: [id] },
      {
        onSuccess: (msg) => {
          toast.success(msg);
          setIsDeleteModalOpen(false);
          setSelectedNotifications([]);
        },
      }
    );
    await refetchWaitlist();
  };

  const handleDeleteNotifications = async () => {
    let notificationsToDelete;

    if (selectedNotifications.length > 0) {
      notificationsToDelete = selectedNotifications.map((item) => item.id);
    } else {
      notificationsToDelete = waitlist?.map((item) => item.id);
    }
    await deleteNotifications(
      { ids: notificationsToDelete },
      {
        onSuccess: (msg) => {
          toast.success(msg);
          setIsDeleteModalOpen(false);
          setSelectedNotifications([]);
        },
      }
    );
    await refetchWaitlist();
  };

  const {
    data: waitlist,
    refetch: refetchWaitlist,
    isLoading,
    isError,
    error,
  } = api.userWaitlist.getWaitlist.useQuery(
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
        const formattedDate = date.utc().format("ddd MMM DD, YYYY");

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
        acc[formattedDate].sort((a, b) => a.startTime - b.startTime);
        return acc;
      }, {}),
    [waitlist]
  );

  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <div className="relative flex items-center justify-between">
        <h1 className="text-[20px] capitalize text-secondary-black md:text-[32px] flex items-center gap-6">
          Your Alerts
          <FilledButton
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50"
            disabled={selectedNotifications.length === 0}
          >
            <DeleteIcon color="#fff" width="15px" />
            Delete Selected Alerts
          </FilledButton>
        </h1>
      </div>

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
                  // refetchWaitlist={refetchWaitlist}
                  handleSelectNotification={handleNotificationClick}
                  handleSelectNotifications={handleSelectNotifications}
                  selectedNotifications={selectedNotifications}
                  handleDeleteNotification={handleDeleteNotification}
                />
              ))
            : null}
        </div>
      )}
      {isDeleteModalOpen && (
        <>
          <div
            className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <div className="h-screen bg-[#00000099]" />
          </div>
          <div className="date-selector w-[95%] flex flex-col max-w-[500px] p-6 gap-1 mt-14 rounded-xl bg-white fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[60%] z-50">
            <Close
              className="absolute right-4 top-4 cursor-pointer"
              height={24}
              width={24}
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <h1 className="text-[20px] md:text-2xl">
              Delete selected notifications
            </h1>
            <p className="text-[14px] mb-4 md:text-md">
              You have selected the following dates and times to delete below.
              Are you sure you want to delete?
            </p>

            <div className="flex flex-col gap-2 self-center max-h-[250px] overflow-y-auto">
              {selectedNotifications.map((item) => (
                <div
                  className="flex items-center gap-2 justify-between bg-secondary-white p-2 rounded-md"
                  key={item.id}
                >
                  <div className="text-[14px] md:text-md">
                    {dayjs(item.date).format("ddd MMM DD, YYYY")}
                  </div>
                  <div className="text-[14px] md:text-md">
                    {item.startTimeFormated} - {item.endTimeFormated}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <OutlineButton
                className="w-full mt-2 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px]"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                No
              </OutlineButton>
              <FilledButton
                className="w-full mt-2 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px]"
                onClick={handleDeleteNotifications}
              >
                Yes
              </FilledButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Waitlists;
