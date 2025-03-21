import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Item } from "../course-page/filters";
import { Close } from "../icons/close";
import { DownChevron } from "../icons/down-chevron";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Input } from "../input/input";
import { SingleSlider } from "../input/single-slider";
import { Tooltip } from "../tooltip";
import { type OwnedTeeTime } from "./owned";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isCollectPaymentOpen: boolean;
  setIsCollectPaymentOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch?: () => Promise<unknown>;
  needsRedirect?: boolean;
};

export const CollectPayment = ({
  isCollectPaymentOpen,
  setIsCollectPaymentOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
}: SideBarProps) => {
  const availableSlots = selectedTeeTime?.golfers.length || 0;
  const [emails, setEmails] = useState(
    Array.from({ length: Number(availableSlots - 1) }, () => "")
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [sellerServiceFee, setSellerServiceFee] = useState<number>(0);
  const [players, setPlayers] = useState<string>(
    selectedTeeTime?.isGroupBooking
      ? "2"
      : selectedTeeTime?.selectedSlotsCount || availableSlots.toString()
  );

  const { toggleSidebar } = useSidebar({
    isOpen: isCollectPaymentOpen,
    setIsOpen: setIsCollectPaymentOpen,
  });
  const { course } = useCourseContext();

  const handleEmailChange = (index: number, value: string) => {
    const updatedEmails = [...emails];
    updatedEmails[index] = value;
    setEmails(updatedEmails);
  };

  const handleEmailSendOnHyperSwitchPaymentLink = (index: number) => {
    console.log("hyperSwitchEmailSend", emails[index],amount);
    setAmount(null);
  };

  return (
    <>
      {isCollectPaymentOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCollectPaymentOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Collect Payment</div>
            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCollectPaymentOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex flex-col gap-6 px-0 sm:px-4">
            <TeeTimeItem
              courseImage={selectedTeeTime?.courseLogo ?? ""}
              courseName={selectedTeeTime?.courseName ?? ""}
              courseDate={selectedTeeTime?.date ?? ""}
              golferCount={selectedTeeTime?.golfers.length ?? 0}
              timezoneCorrection={course?.timezoneCorrection}
            />
          </div>
          <div className="flex flex-col gap-6 px-0 py-3 sm:px-4">
            <div className=" flex flex-col w-full gap-4">
              <p>Enter the amount</p>
              <input
                className="outline outline-2 outline-gray-300 focus:outline-blue-500 px-3 py-1 rounded-md w-full"
                type="text"
                placeholder="Enter the Amount"
                onChange={(e) => setAmount(Number(e.target.value))}
                value={amount ?? ""}
              />
            </div>
            <div>Send Payment Link</div>
            <div className="flex flex-col w-full  gap-3">
              {Array.from({ length: Number(availableSlots - 1) }).map(
                (_, index) => (
                  <div key={index} className="flex w-full gap-x-3">
                    <input
                      className="outline outline-2 outline-gray-300 focus:outline-blue-500 px-3 py-1 rounded-md w-full"
                      type="text"
                      placeholder="Enter the email"
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      value={emails[index]}
                    />
                    <FilledButton
                      onClick={() =>
                        handleEmailSendOnHyperSwitchPaymentLink(index)
                      }
                      className="text-sm"
                    >
                      Send
                    </FilledButton>
                  </div>
                )
              )}
            </div>
            <div className="flex flex-col w-full gap-3">
               

            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
const TeeTimeItem = ({
  courseImage,
  courseName,
  courseDate,
  golferCount,
  timezoneCorrection,
}: {
  courseImage: string;
  courseName: string;
  courseDate: string;
  golferCount: number;
  timezoneCorrection: number | undefined;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={courseImage} />
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-secondary-black">
            {courseName}
          </div>
          <div className="text-primary-gray">
            {formatTime(courseDate, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
