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
  handleDeleteNotification, // Added prop for individual delete handler
}: {
  waitlist: WaitlistItem[] | undefined;
  formattedDate: string;
  handleSelectNotification: (notification: WaitlistItem) => void;
  handleSelectNotifications: (
    notifications: WaitlistItem[],
    selected: boolean
  ) => void;
  selectedNotifications: WaitlistItem[];
  handleDeleteNotification: (id: string) => void; // Handler for deleting individual notifications
}) {
  const handleIsChecked = () => {
    return (
      waitlist
        ?.map((item) => item)
        .every((item) => selectedNotifications.includes(item)) ?? false
    );
  };

  const handleSelectAllCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleSelectNotifications(waitlist ?? [], e.target.checked);
  };

  return (
    <div>
      <div className="flex flex-row items-center gap-2 md:px-4">
        {waitlist && (
          <Checkbox
            isChecked={handleIsChecked()}
            onChange={handleSelectAllCheckboxChange}
          />
        )}
        <h2 className="text-[13px] md:text-lg capitalize text-secondary-black">
          {formattedDate}
        </h2>
        <FilledButton
          // onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1 py-[.28rem] md:py-1.5 text-[10px] md:text-[14px] disabled:opacity-50"
          disabled={selectedNotifications.length === 0}
        >
          <DeleteIcon color="#fff" width="15px" />
          Delete
        </FilledButton>
      </div>
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

            {/* Second Column: Delete Button */}
            <div className="flex items-center">
              <OutlineButton
                className="flex items-center gap-1 !px-2 !py-1 text-[10px] md:text-[14px] disabled:opacity-50"
                // className="!px-2 !py-1 text-sm rounded-md flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering onClick for the container
                  handleDeleteNotification(item.id); // Trigger delete handler
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
