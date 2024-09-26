import React from "react";
import { Checkbox } from "../input/checkbox";
import type { WaitlistItem } from "./waitlists";

function Waitlist({
  waitlist,
  formattedDate,
  // refetchWaitlist,
  handleSelectNotification,
  handleSelectNotifications,
  selectedNotifications,
}: {
  waitlist: WaitlistItem[] | undefined;
  formattedDate: string;
  // refetchWaitlist: () => void;
    handleSelectNotification: (notification: WaitlistItem) => void;
    handleSelectNotifications: (
      notifications: WaitlistItem[],
      selected: boolean
    ) => void;
    selectedNotifications: WaitlistItem[];
}) {
  // const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
  //   []
  // );

  // const { mutateAsync: deleteNotifications } =
  //   api.userWaitlist.deleteWaitlistNotification.useMutation();

  // const handleNotificationClick = (notificationId: string) => {
  //   if (selectedNotifications.includes(notificationId)) {
  //     setSelectedNotifications(
  //       selectedNotifications.filter((item) => item !== notificationId)
  //     );
  //   } else {
  //     setSelectedNotifications([...selectedNotifications, notificationId]);
  //   }
  // };

  // const handleDeleteNotifications = async () => {
  //   let notificationsToDelete;

  //   if (selectedNotifications.length > 0) {
  //     notificationsToDelete = selectedNotifications;
  //   } else {
  //     notificationsToDelete = waitlist?.map((item) => item.id);
  //   }
  //   await deleteNotifications(
  //     { ids: notificationsToDelete },
  //     {
  //       onSuccess: (msg) => {
  //         toast.success(msg);
  //         setSelectedNotifications([]);
  //       },
  //     }
  //   );
  //   refetchWaitlist();
  // };

  const handleIsChecked = () => {
    return waitlist?.map((item) => item).every((item) => selectedNotifications.includes(item)) ?? false;
  };

  const handleSelectAllCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSelectNotifications(waitlist ?? [], e.target.checked);
  }

  return (
    <div>
      <div className="flex flex-row items-center gap-2 md:px-4">
        {waitlist && <Checkbox isChecked={handleIsChecked()} onChange={handleSelectAllCheckboxChange} />}
        <h2 className="text-[13px] md:text-lg capitalize text-secondary-black">
          {formattedDate}
        </h2>
        {/* <FilledButton
          onClick={handleDeleteNotifications}
          className="py-[.28rem] md:py-1.5 text-[10px] md:text-[14px]"
        >
          {selectedNotifications.length > 0 ? "Delete Selected" : "Delete Day"}
        </FilledButton> */}
      </div>
      <div className="flex flex-row h-[100%] gap-4 overflow-x-auto my-2">
        {waitlist?.map((item) => (
          <div
            key={item.id}
            className="bg-secondary-white p-3 rounded-xl max-w-[200px] md:max-w-none md:w-[260px] flex flex-col gap-1 text-[12px] md:text-[16px] text-secondary-black cursor-pointer"
            onClick={() => handleSelectNotification(item)}
          >
            <div className="flex flex-row justify-between items-end ">
              <span className="max-w-[80%] truncate">{item.courseName}</span>
              <Checkbox isChecked={selectedNotifications.includes(item)} />
            </div>
            <div className="flex flex-row justify-between">
              <span className="text-primary-gray">Date:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex flex-row justify-between">
              <span className="text-primary-gray">Time:</span>
              <span>
                {item.startTimeFormated} - {item.endTimeFormated}
              </span>
            </div>
            <div className="flex flex-row justify-between">
              <span className="text-primary-gray">Player count:</span>
              <span>{item.playerCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Waitlist;
