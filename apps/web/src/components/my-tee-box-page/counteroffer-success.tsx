import { useExpiration } from "~/hooks/useExpiration";
import { useSidebar } from "~/hooks/useSidebar";
import { type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import { type OfferType } from "./offers-received";

type SideBarProps = {
  isCounterofferSuccessOpen: boolean;
  setIsCounterofferSuccessOpen: Dispatch<SetStateAction<boolean>>;
  selectedOffer: OfferType | undefined;
};

export const CounterofferSuccess = ({
  isCounterofferSuccessOpen,
  setIsCounterofferSuccessOpen,
  selectedOffer,
}: SideBarProps) => {
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isCounterofferSuccessOpen,
    setIsOpen: setIsCounterofferSuccessOpen,
  });

  const { timeTillEnd, count } = useExpiration({
    expirationDate: selectedOffer?.offer.expiresAt,
    intervalMs: 60000,
  });

  const cancelCounteroffer = () => {
    toast.success("Counteroffer cancelled successfully");
    setIsCounterofferSuccessOpen(false);
  };

  return (
    <>
      {isCounterofferSuccessOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCounterofferSuccessOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">View Offer</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCounterofferSuccessOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6  px-0 sm:px-4">
              <div>
                <div className="px-4 pb-4 text-center text-2xl font-[300] text-secondary-black md:text-3xl">
                  You&apos;ve sent a counteroffer
                </div>
                <div className="flex flex-col px-4 pb-4 text-center text-[18px] font-[300] text-secondary-black md:text-[20px]">
                  <div>Offer expires in</div>
                  {count <= 0 ? (
                    <div className="text-primary-gray">Expired</div>
                  ) : (
                    <div className="flex justify-center gap-1">
                      <div>{timeTillEnd.days} days</div>
                      <div>{timeTillEnd.hours} hrs</div>
                      <div>{timeTillEnd.minutes} mins</div>
                    </div>
                  )}
                </div>
                <TeeTimeItem />
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">
                  Your counteroffer price per golfer
                </div>
                <div className="text-lg md:text-2xl">{"$215.99"}</div>
                <div className="font-[300] text-primary-gray text-[14px]">
                  Original price {"$205.99 (+$10)"}
                </div>
                <div className="h-[1px] w-full bg-stroke" />
                <div className="font-[300] text-primary-gray">
                  Number of spots offered
                </div>
                <div className="text-lg md:text-2xl">{"3"}</div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Tee Time Price
                </div>
                <div className="text-secondary-black">{"$215.99"}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Service fee description."
                  />
                </div>
                <div className="text-secondary-black">${"45.00"}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total Payout</div>
                <div className="text-secondary-black">{"$692.97"}</div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className="w-full"
                  onClick={cancelCounteroffer}
                  data-testid="cancel-counter-offer-id"
                >
                  Cancel counteroffer
                </FilledButton>
                <OutlineButton
                  onClick={() => setIsCounterofferSuccessOpen(false)}
                  data-testid="close-button-id"
                >
                  Close
                </OutlineButton>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const TeeTimeItem = () => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={placeholderIcon.src} />
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-secondary-black">
            {"Encinitas Ranch"}
          </div>
          <div className="text-primary-gray">{"Sun Aug 20, 2023 10:00 AM"}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Avatar />
        <div className="text-primary-gray">
          Offered by <span className="font-semibold">mmackinney</span>
        </div>
      </div>
    </div>
  );
};
