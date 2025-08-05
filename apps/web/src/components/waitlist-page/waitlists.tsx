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
  const { user, isLoading: isUserLoading } = useMe();
  const { course } = useParams();
  const [selectedNotifications, setSelectedNotifications] = useState<
    WaitlistItem[]
  >([]);
  const [selectedIndividualNotification, setSelectedIndividualNotification] = useState<WaitlistItem | undefined>(undefined);
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

  const handleDeleteNotifications = async () => {
    let notificationsToDelete;

    if (selectedIndividualNotification) {
      notificationsToDelete = [selectedIndividualNotification.id];
    } else {
      if (selectedNotifications.length > 0) {
        notificationsToDelete = selectedNotifications.map((item) => item.id);
      } else {
        notificationsToDelete = waitlist?.map((item) => item.id);
      }
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

  const handleCloseModel = () => {
    setIsDeleteModalOpen(false);
    setSelectedIndividualNotification(undefined);
  };

  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <div className="relative flex items-center justify-between md:mb-2">
        <h1 className="text-[1.25rem] capitalize text-secondary-black md:text-[2rem] flex items-center gap-6">
          Your Alerts
          <FilledButton
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50"
            disabled={selectedNotifications.length === 0}
          >
            <DeleteIcon color="#fff" width="0.9375rem" />
            Delete Selected Alerts
          </FilledButton>
        </h1>
      </div>

      {!isUserLoading && !user ? (
        <div className="flex justify-center items-center h-[12.5rem]">
          <div className="text-center">Login to View</div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-[12.5rem] w-full md:min-w-[23.125rem]">
          <Spinner className="w-[3.125rem] h-[3.125rem]" />
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-[12.5rem]">
          <div className="text-center">
            Error: {error?.message ?? "An error occurred"}
          </div>
        </div>
      ) : waitlist.length === 0 ? (
        <div className="flex justify-center items-center h-[12.5rem]">
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
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                setSelectedIndividualNotification={setSelectedIndividualNotification}
              />
            ))
            : null}
        </div>
      )}
      {isDeleteModalOpen && (
        <>
          <div
            className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
            onClick={handleCloseModel}
          >
            <div className="h-screen bg-[#00000099]" />
          </div>
          <div className="date-selector w-[95%] flex flex-col max-w-[31.25rem] p-6 gap-1 mt-[3.5rem] rounded-xl bg-white fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-50">
            <Close
              className="absolute right-4 top-4 cursor-pointer"
              height={24}
              width={24}
              onClick={handleCloseModel}
            />
            <h1 className="text-[1.25rem] md:text-2xl">
              Delete selected notifications
            </h1>
            <p className="text-[0.875rem] mb-4 md:text-md">
              You have selected the following dates and times to delete below.
              Are you sure you want to delete?
            </p>

            <div className="flex flex-col gap-2 self-center max-h-[15.625rem] overflow-y-auto">
              {selectedIndividualNotification ?
                (<div
                  className="flex items-center gap-2 justify-between bg-secondary-white p-2 rounded-md"
                  key={selectedIndividualNotification.id}
                >
                  <div className="text-[0.875rem] md:text-md">
                    {dayjs(selectedIndividualNotification.date).format(
                      "ddd MMM DD, YYYY"
                    )}
                  </div>
                  <div className="text-[0.875rem] md:text-md">
                    {selectedIndividualNotification.startTimeFormated} - {selectedIndividualNotification.endTimeFormated}
                  </div>
                </div>
                ) : (
                  selectedNotifications.map((item) => (
                    <div
                      className="flex items-center gap-2 justify-between bg-secondary-white p-2 rounded-md"
                      key={item.id}
                    >
                      <div className="text-[0.875rem] md:text-md">
                        {dayjs(item.date).format("ddd MMM DD, YYYY")}
                      </div>
                      <div className="text-[0.875rem] md:text-md">
                        {item.startTimeFormated} - {item.endTimeFormated}
                      </div>
                    </div>
                  )))}
            </div>
            <div className="flex gap-2">
              <OutlineButton
                className="w-full mt-2 py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem]"
                onClick={handleCloseModel}
              >
                No
              </OutlineButton>
              <FilledButton
                className="w-full mt-2 py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem]"
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
