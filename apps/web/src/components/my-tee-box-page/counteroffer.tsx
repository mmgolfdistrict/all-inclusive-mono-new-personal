import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useSidebar } from "~/hooks/useSidebar";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Item } from "../course-page/filters";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isCounterofferOpen: boolean;
  setIsCounterofferOpen: Dispatch<SetStateAction<boolean>>;
  setIsCounterofferSuccessOpen: Dispatch<SetStateAction<boolean>>;
};

export const Counteroffer = ({
  isCounterofferOpen,
  setIsCounterofferOpen,
  setIsCounterofferSuccessOpen,
}: SideBarProps) => {
  const [listingPrice, setListingPrice] = useState<number>(300);
  const [players, setPlayers] = useState<PlayerType>("1");

  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isCounterofferOpen,
    setIsOpen: setIsCounterofferOpen,
  });

  useEffect(() => {
    if (isCounterofferOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(300); //reset price
      setPlayers("1");
    }
  }, [isCounterofferOpen]);

  const handleFocus = () => {
    if (!listingPrice) setListingPrice(0);
  };

  const handleBlur = () => {
    if (!listingPrice) setListingPrice(0);
  };

  const handleListingPrice = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("$", "").replaceAll(",", "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");
    setListingPrice(Number(strippedLeadingZeros));
  };

  const totalPayout = useMemo(() => {
    if (!listingPrice) return 0;
    return listingPrice * parseInt(players) - 45;
  }, [listingPrice, players]);

  const sendCounteroffer = () => {
    setIsCounterofferSuccessOpen(true);

    setIsCounterofferOpen(false);
  };

  return (
    <>
      {isCounterofferOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCounterofferOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Counteroffer</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCounterofferOpen}
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
                  Enter your counteroffer below
                </div>
                <div className="flex flex-col px-4 pb-4 text-center text-[18px] font-[300] text-secondary-black md:text-[20px]">
                  {"4 left on this tee time"}
                </div>
                <TeeTimeItem />
              </div>
              <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
                <label
                  htmlFor="listingPrice"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Listing price per golfer
                </label>
                <div className="relative">
                  <span className="absolute left-1 top-1 text-[24px] md:text-[32px]">
                    $
                  </span>
                  <input
                    id="listingPrice"
                    value={listingPrice?.toString()?.replace(/^0+/, "")}
                    type="number"
                    onFocus={handleFocus}
                    onChange={handleListingPrice}
                    onBlur={handleBlur}
                    className="mx-auto max-w-[300px] rounded-lg bg-secondary-white px-4 py-1 text-center text-[24px] font-semibold outline-none md:text-[32px] pl-6"
                    data-testid="listing-price-id"
                  />
                </div>
              </div>

              <div className={`flex  flex-col gap-1 text-center`}>
                <label
                  htmlFor="spots"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Number of spots
                </label>
                <ToggleGroup.Root
                  id="spots"
                  type="single"
                  value={players}
                  onValueChange={(player: PlayerType) => {
                    if (player) setPlayers(player);
                  }}
                  orientation="horizontal"
                  className="mx-auto flex"
                  data-testid="player-button-id"
                >
                  {PlayerOptions.map((value, index) => (
                    <Item
                      key={index}
                      value={value}
                      className={`${
                        index === 0
                          ? "rounded-l-full border-b border-l border-t border-stroke"
                          : index === PlayerOptions.length - 1
                          ? "rounded-r-full border border-stroke"
                          : "border-b border-l border-t border-stroke"
                      } px-[1.75rem]`}
                      dataTestId="player-item-id"
                      dataQa={value}
                    />
                  ))}
                </ToggleGroup.Root>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Tee Time Price
                </div>
                <div className="text-secondary-black">{listingPrice}</div>
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
                <div className="text-secondary-black">{totalPayout}</div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className="w-full"
                  onClick={sendCounteroffer}
                  data-testid="send-counter-offer-button-id"
                >
                  Send counteroffer
                </FilledButton>

                <OutlineButton
                  onClick={() => setIsCounterofferOpen(false)}
                  data-testid="cancel-button-id"
                >
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
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Avatar />
        </div>
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-primary-gray">
            {"Offered by"}{" "}
            <span className="font-semibold text-secondary-black">
              {"jthompson"}
            </span>
          </div>

          <div className="text-primary-gray">
            <span className="font-semibold text-secondary-black">
              {"$215.99"}
            </span>{" "}
            per golf for{" "}
            <span className="font-semibold text-secondary-black">{"3"}</span>{" "}
            spots
          </div>
          <div className="whitespace-nowrap text-primary-gray">
            Original price {"$205.99 (+$10)"}
          </div>
        </div>
      </div>
    </div>
  );
};
