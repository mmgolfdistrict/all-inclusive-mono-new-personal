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
  handleDeleteNotification,
  handleDeleteByDate, // Updated handler for deleting all items for the date
}: {
  waitlist: WaitlistItem[] | undefined;
  formattedDate: string;
  handleSelectNotification: (notification: WaitlistItem) => void;
  handleSelectNotifications: (
    notifications: WaitlistItem[],
    selected: boolean
  ) => void;
  selectedNotifications: WaitlistItem[];
  handleDeleteNotification: (id: string) => void;
  handleDeleteByDate: (ids: string[]) => void; // New handler for deleting all items for the date
}) {
  const areAllSelectedForDate = () => {
    return (
      waitlist?.every((item) => selectedNotifications.includes(item)) ?? false
    );
  };

  const handleSelectAllCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleSelectNotifications(waitlist ?? [], e.target.checked);
  };

  const handleDeleteAllClick = () => {
    const idsToDelete = waitlist?.map((item) => item.id) ?? [];
    handleDeleteByDate(idsToDelete);
  };

  return (
    <div>
      {/* Header Row */}
      <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
        {waitlist && (
          <Checkbox
            isChecked={areAllSelectedForDate()}
            onChange={handleSelectAllCheckboxChange}
          />
        )}
        <h2 className="text-[13px] md:text-lg capitalize text-secondary-black">
          {formattedDate}
        </h2>
        <FilledButton
          onClick={handleDeleteAllClick}
          className="flex items-center gap-1 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50"
          disabled={!areAllSelectedForDate()} // Enable button only if all items for the date are selected
        >
          <DeleteIcon color="#fff" width="15px" />
          Delete
        </FilledButton>
      </div>

      {/* Waitlist Items */}
      <div className="flex flex-row h-[100%] gap-4 overflow-x-auto my-2">
        {waitlist?.map((item) => (
          <div
            key={item.id}
            className="bg-white p-3 rounded-xl max-w-[280px] md:max-w-none md:w-[300px] flex gap-6 text-[12px] md:text-[16px] text-secondary-black cursor-pointer"
            onClick={() => handleSelectNotification(item)}
          >
            {/* First Column: Time and Player Count */}
            <div className="flex flex-col justify-between">
              <span className="truncate">
                {item.startTimeFormated} - {item.endTimeFormated}
              </span>
              <div className="flex flex-row gap-2">
                <span className="text-primary-gray">Player count:</span>
                <span>{item.playerCount}</span>
              </div>
            </div>

            {/* Second Column: Individual Delete Button */}
            <div className="flex items-center">
              <OutlineButton
                className="flex items-center gap-1 !px-2 !py-1 text-[10px] md:text-[14px] disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering onClick for the container
                  handleDeleteNotification(item.id); // Delete individual notification
                }}
              >
                <DeleteIcon color="#40942b" width="15px" />
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
