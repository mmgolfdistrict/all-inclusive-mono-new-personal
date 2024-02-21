import { useSidebar } from "~/hooks/useSidebar";
import { type Dispatch, type SetStateAction } from "react";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";

type SideBarProps = {
  isBuyNowOpen: boolean;
  setIsBuyNowOpen: Dispatch<SetStateAction<boolean>>;
  reserve: number;
  openBuyNowCheckout: () => void;
};

export const BuyNow = ({
  isBuyNowOpen,
  setIsBuyNowOpen,
  reserve,
  openBuyNowCheckout,
}: SideBarProps) => {
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isBuyNowOpen,
    setIsOpen: setIsBuyNowOpen,
  });

  const buyNow = () => {
    setIsBuyNowOpen(false);
    openBuyNowCheckout();
  };

  return (
    <>
      {isBuyNowOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isBuyNowOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Place bid</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isBuyNowOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6 px-0 sm:px-4">
              <div>
                <div className="px-4 pb-4 text-center text-2xl font-[300] md:text-3xl">
                  Please confirm your purchase
                </div>
                <TeeTimeItem />
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">
                  Reserve price
                </div>
                <div className="text-xl font-[300] md:text-3xl">{`$${reserve.toLocaleString(
                  "en-US"
                )}`}</div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Bid</div>
                <div className="text-secondary-black">{`$${reserve.toLocaleString(
                  "en-US"
                )}`}</div>
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
                <div className="font-[300] text-primary-gray">Taxes</div>
                <div className="text-secondary-black">${"45.00"}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total</div>
                <div className="text-secondary-black">{`$${(
                  reserve + 90
                ).toLocaleString("en-US")}`}</div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton className="w-full" onClick={buyNow} data-testid="buy-now-button-id">
                  Buy Now
                </FilledButton>
                <OutlineButton onClick={() => setIsBuyNowOpen(false)} data-testid="cancel-button-id">
                  Cancel
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
