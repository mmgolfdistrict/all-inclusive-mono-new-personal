import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import dayjs from "dayjs";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Item } from "../course-page/filters";
import { Close } from "../icons/close";
import { Players } from "../icons/players";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isMakeAnOfferOpen: boolean;
  setIsMakeAnOfferOpen: Dispatch<SetStateAction<boolean>>;
  availableSlots: number;
  courseName: string;
  courseImage: string;
  date: string;
  minimumOfferPrice: number;
  bookingIds: string[];
};

export const MakeAnOffer = ({
  isMakeAnOfferOpen,
  setIsMakeAnOfferOpen,
  availableSlots,
  courseName,
  courseImage,
  date,
  minimumOfferPrice,
  bookingIds,
}: SideBarProps) => {
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [players, setPlayers] = useState<PlayerType>("1");

  const makeOffer = api.teeBox.createOfferOnBookings.useMutation();
  const { course } = useCourseContext();

  const { toggleSidebar } = useSidebar({
    isOpen: isMakeAnOfferOpen,
    setIsOpen: setIsMakeAnOfferOpen,
  });

  useEffect(() => {
    if (isMakeAnOfferOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setOfferPrice(300); //reset price
    }
  }, [isMakeAnOfferOpen]);

  const handleFocus = () => {
    if (!offerPrice) setOfferPrice(0);
  };

  const handleBlur = () => {
    if (!offerPrice) setOfferPrice(0);
  };

  const handleOfferPrice = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[$,]/g, "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");

    setOfferPrice(Number(strippedLeadingZeros));
  };

  const totalOffer = useMemo(() => {
    if (!offerPrice) return 0;
    return offerPrice * parseInt(players) + 45;
  }, [offerPrice, players]);

  const sendOffer = async () => {
    if (offerPrice < minimumOfferPrice) {
      toast.error(`Minimum offer price is ${formatMoney(minimumOfferPrice)}`);
      return;
    }

    try {
      const res = await makeOffer.mutateAsync({
        bookingIds: bookingIds.slice(0, parseInt(players)),
        price: offerPrice,
        expiresAt: new Date(dayjs().hour(72).toDate()),
      });
      toast.success(
        res.message
          ? `${res.message} You must cancel your offers in "My Offers" or you are otherwise responsible for all accepted offers.`
          : "Offer sent successfully"
      );
      setIsMakeAnOfferOpen(false);
    } catch (error) {
      const message = (error as Error)?.message;
      if (message === "UNAUTHORIZED") {
        toast.error("You must be logged in to send an offer.");
        return;
      }
      toast.error((error as Error)?.message ?? "Error sending offer");
    }
  };

  return (
    <>
      {isMakeAnOfferOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[31.25rem] md:h-[100dvh] ${isMakeAnOfferOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Make an Offer</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isMakeAnOfferOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[1.5625rem] w-[1.5625rem]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between">
            <div className="flex max-h-[60dvh] flex-col gap-6 overflow-y-auto px-0 sm:px-4 md:max-h-[70dvh]">
              <TeeTimeItem
                date={date}
                golferCount={availableSlots}
                courseImage={courseImage}
                courseName={courseName}
                timezoneCorrection={course?.timezoneCorrection}
              />

              <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
                <label
                  htmlFor="listingPrice"
                  className="text-base text-primary-gray md:text-lg"
                >
                  Offer price per golfer
                </label>
                <div className="relative">
                  <span className="absolute left-1 top-1 text-[1.5rem] md:text-[2rem]">
                    $
                  </span>
                  <input
                    id="listingPrice"
                    value={offerPrice?.toString()?.replace(/^0+/, "")}
                    type="number"
                    onFocus={handleFocus}
                    onChange={handleOfferPrice}
                    onBlur={handleBlur}
                    className="mx-auto max-w-[18.75rem] rounded-lg bg-secondary-white px-4 py-1 text-center text-[1.5rem] font-semibold outline-none md:text-[2rem] pl-6"
                    data-testid="listing-price-id"
                  />
                </div>
              </div>
              <div className={`flex  flex-col gap-1 text-center`}>
                <label
                  htmlFor="players"
                  className="text-base text-primary-gray md:text-lg"
                >
                  Number of spots desired
                </label>
                <ToggleGroup.Root
                  id="players"
                  type="single"
                  value={players}
                  onValueChange={(player: PlayerType) => {
                    if (availableSlots < parseInt(player)) return;

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
                      className={`${index === 0
                        ? "rounded-l-full border border-stroke"
                        : index === PlayerOptions.length - 1
                          ? "rounded-r-full border-b border-t border-r border-stroke"
                          : "border-b border-r border-t border-stroke"
                        } px-[1.75rem] ${availableSlots < index + 1
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      dataTestId="player-item-id"
                      dataQa={value}
                      label={value}
                    />
                  ))}
                </ToggleGroup.Root>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Subtotal</div>
                <div className="text-secondary-black">
                  {formatMoney(offerPrice)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Taxes</div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total</div>
                <div className="text-secondary-black">
                  {formatMoney(totalOffer)}
                </div>
              </div>
              <div className="text-center text-[0.875rem] font-[300] text-primary-gray">
                Once the offer is accepted then all sales are final. You may
                cancel your offer before it is accepted.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className="w-full"
                  onClick={sendOffer}
                  data-testid="send-offer-button-id"
                >
                  Send Offer
                </FilledButton>

                <OutlineButton
                  onClick={() => setIsMakeAnOfferOpen(false)}
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

const TeeTimeItem = ({
  date,
  golferCount,
  courseImage,
  courseName,
  timezoneCorrection,
}: {
  date: string;
  golferCount: number;
  courseImage: string;
  courseName: string;
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
            {formatTime(date, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[0.875rem]">
        <div className="w-[2.5rem] ">
          <Players className="ml-auto w-[1.875rem]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
