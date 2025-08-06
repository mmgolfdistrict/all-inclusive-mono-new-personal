import React from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { DeleteIcon } from "../icons/delete";
import { Checkbox } from "../input/checkbox";
import type { WaitlistItem } from "./waitlists";

function Waitlist({
  waitlist,
  formattedDate,
  handleSelectNotification,
  handleSelectNotifications,
  selectedNotifications,
  setIsDeleteModalOpen,
  setSelectedIndividualNotification
}: {
  waitlist: WaitlistItem[] | undefined;
  formattedDate: string;
  handleSelectNotification: (notification: WaitlistItem) => void;
  handleSelectNotifications: (
    notifications: WaitlistItem[],
    selected: boolean
  ) => void;
  selectedNotifications: WaitlistItem[];
  setIsDeleteModalOpen: (value: boolean) => void;
  setSelectedIndividualNotification: (notification: WaitlistItem | undefined) => void;
}) {
  const handleIsChecked = () => {
    return (
      waitlist?.every((item) => selectedNotifications.includes(item)) ?? false
    );
  };

  const handleSelectAllCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleSelectNotifications(waitlist ?? [], e.target.checked);
  };

  const isWaitlistSelected = (item: WaitlistItem) => {
    return selectedNotifications.includes(item);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
        {waitlist && (
          <Checkbox
            isChecked={handleIsChecked()}
            onChange={handleSelectAllCheckboxChange}
          />
        )}
        <h2 className="text-[0.8125rem] md:text-lg capitalize text-secondary-black unmask-time">
          {formattedDate}
        </h2>
        <FilledButton
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1 py-[.28rem] md:py-1.5 text-[0.625rem] md:text-[0.875rem] disabled:opacity-50"
          disabled={!handleIsChecked()}
        >
          <DeleteIcon color="#fff" width="0.9375rem" />
          Delete
        </FilledButton>
      </div>

      {/* Waitlist Items */}
      <div className="flex flex-row h-full gap-4 overflow-x-auto my-2">
        {waitlist?.map((item) => (
          <div
            key={item.id}
            className={`bg-white p-3 rounded-xl max-w-[17.5rem] md:max-w-none md:w-[18.75rem] flex gap-6 text-[0.75rem] md:text-[1rem] text-secondary-black cursor-pointer ${isWaitlistSelected(item) ? "border border-primary" : "border border-transparent"}`}
            onClick={() => handleSelectNotification(item)}
          >
            {/* First Column */}
            <div className="flex flex-col justify-between unmask-time">
              <span className="truncate">
                {item.startTimeFormated} - {item.endTimeFormated}
              </span>
              <div className="flex flex-row gap-2">
                <span className="text-primary-gray">Player count:</span>
                <span className="unmask-players">{item.playerCount}</span>
              </div>
            </div>

            {/* Second Column */}
            <div className="flex items-center">
              <OutlineButton
                className="flex items-center gap-1 !px-2 !py-1 text-[0.625rem] md:text-[0.875rem] disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                  setSelectedIndividualNotification(item)
                }}
              >
                <DeleteIcon color="#40942b" width="0.9375rem" />
                Delete
              </OutlineButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Waitlist;
