import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { formatMoney, formatTime } from "~/utils/formatters";
import type { InviteFriend } from "~/utils/types";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { type TxnHistoryType } from "./transaction-history";

type SideBarProps = {
  isTxnDetailsOpen: boolean;
  setIsTxnDetailsOpen: Dispatch<SetStateAction<boolean>>;
  selectedTxn: TxnHistoryType | null;
};

export const TxnDetails = ({
  isTxnDetailsOpen,
  setIsTxnDetailsOpen,
  selectedTxn,
}: SideBarProps) => {
  const { toggleSidebar } = useSidebar({
    isOpen: isTxnDetailsOpen,
    setIsOpen: setIsTxnDetailsOpen,
  });
  const { course } = useCourseContext();

  const teeTimePrice = useMemo(() => {
    if (!selectedTxn) return 0;

    return (
      (selectedTxn?.pricePerGolfer[0] ?? selectedTxn?.firstHandPrice) *
      selectedTxn?.golfers?.length
    );
  }, [selectedTxn]);

  return (
    <>
      {isTxnDetailsOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isTxnDetailsOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Details</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isTxnDetailsOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6 px-0 sm:px-4">
              <TeeTimeItem
                golfers={selectedTxn?.golfers ?? []}
                courseName={selectedTxn?.courseName ?? ""}
                courseImage={selectedTxn?.courseLogo ?? ""}
                date={selectedTxn?.date ?? ""}
                timezoneCorrection={course?.timezoneCorrection}
                playerCount={selectedTxn?.playerCount}
              />

              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">Status</div>
                <div className="text-lg md:text-2xl capitalize">
                  {selectedTxn?.status?.toLowerCase()}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Your Listing Price
                </div>
                <div className="text-secondary-black">
                  {formatMoney(teeTimePrice)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking times."
                  />
                </div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  You Receive after Sale
                </div>
                <div className="text-secondary-black">
                  {formatMoney(Math.abs(teeTimePrice - 45))}
                </div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  onClick={() => setIsTxnDetailsOpen(false)}
                  className="w-full"
                  data-testid="close-txn-details-button-id"
                >
                  Close
                </FilledButton>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const TeeTimeItem = ({
  courseName,
  courseImage,
  golfers,
  date,
  timezoneCorrection,
  playerCount = 1,
}: {
  courseName: string;
  courseImage: string;
  golfers: InviteFriend[];
  date: string;
  timezoneCorrection: number | undefined;
  playerCount?: number;
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
            {formatTime(date, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        <div className="flex flex-col">
          <div>{`${playerCount} ${
            playerCount === 1 ? "golfer" : "golfers"
          }`}</div>
          <div className="text-primary-gray">
            {playerCount > 2
              ? `You, Guest & ${playerCount - 2} ${
                  playerCount - 2 === 1 ? "golfers" : "golfers"
                }`
              : golfers.map((i, idx) => {
                  if (playerCount === 1) return "Guest";
                  if (idx === playerCount - 1) return `& You`;
                  if (idx === playerCount - 2) return `Guest `;
                  return `Guest, `;
                })}
          </div>
        </div>
      </div>
    </div>
  );
};
