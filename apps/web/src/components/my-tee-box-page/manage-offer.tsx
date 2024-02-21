import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
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
import { type OfferSentType } from "./offers-sent";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isManageOfferOpen: boolean;
  setIsManageOfferOpen: Dispatch<SetStateAction<boolean>>;
  selectedOffer: OfferSentType | undefined;
};

export const ManageOffer = ({
  isManageOfferOpen,
  setIsManageOfferOpen,
  selectedOffer,
}: SideBarProps) => {
  const [listingPrice, setListingPrice] = useState<number>(300);
  const [players, setPlayers] = useState<PlayerType>("1");
  const { course } = useCourseContext();

  useEffect(() => {
    if (selectedOffer?.offer?.golfers) {
      setPlayers(selectedOffer?.offer?.golfers?.toString() as PlayerType);
    }
    if (selectedOffer?.offer?.offerAmount) {
      setListingPrice(selectedOffer?.offer?.offerAmount);
    }
  }, [selectedOffer]);

  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isManageOfferOpen,
    setIsOpen: setIsManageOfferOpen,
  });
  useEffect(() => {
    if (isManageOfferOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(300); //reset price
      setPlayers("1");
    }
  }, [isManageOfferOpen]);

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

  const updateOffer = () => {
    toast.success("Offer updated successfully");
    setIsManageOfferOpen(false);
  };

  return (
    <>
      {isManageOfferOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isManageOfferOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Manage Offer</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isManageOfferOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6  px-0 sm:px-4">
              <TeeTimeItem
                courseImage={selectedOffer?.offer.details.courseImage ?? ""}
                courseName={selectedOffer?.offer.details.courseName ?? ""}
                ownedByImage={selectedOffer?.offer.ownedBy.image ?? ""}
                ownedByName={
                  selectedOffer?.offer.ownedBy.name ??
                  selectedOffer?.offer.ownedBy.handle ??
                  ""
                }
                ownedById={selectedOffer?.offer.ownedBy.userId ?? ""}
                golferCount={selectedOffer?.offer.golfers ?? 0}
                courseId={selectedOffer?.offer?.courseId ?? ""}
                date={selectedOffer?.offer.details.teeTimeDate ?? ""}
                timezoneCorrection={course?.timezoneCorrection}
              />
              <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
                <label
                  htmlFor="listingPrice"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Offer price per golfer
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
                  htmlFor="players"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Spots desired
                </label>
                <ToggleGroup.Root
                  id="players"
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
                      dataTestId="player-item-id"
                      dataQa={value}
                      className={`${
                        index === 0
                          ? "rounded-l-full border-b border-l border-t border-stroke"
                          : index === PlayerOptions.length - 1
                          ? "rounded-r-full border border-stroke"
                          : "border-b border-l border-t border-stroke"
                      } px-[1.75rem]`}
                      dataTestId={""}
                      dataTest={""}
                      dataQa={""}
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
                <div className="text-secondary-black">
                  {formatMoney(listingPrice)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Service Fee</div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Total Payout1
                </div>
                <div className="text-secondary-black">
                  {formatMoney(totalPayout)}
                </div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton className="w-full" onClick={updateOffer} data-testid="update-offer-button-id">
                  Update Offer
                </FilledButton>

                <OutlineButton onClick={() => setIsManageOfferOpen(false)} data-testid="cancel-button-id">
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
  courseImage,
  courseName,
  ownedByImage,
  ownedByName,
  ownedById,
  golferCount,
  courseId,
  date,
  timezoneCorrection,
}: {
  courseImage: string;
  courseName: string;
  ownedByImage: string;
  ownedByName: string;
  ownedById: string;
  golferCount: number;
  courseId: string;
  timezoneCorrection: number | undefined;
  date: string;
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
      <Link
        href={`/${courseId}/profile/${ownedById}`}
        target="_blank"
        rel={"noopenner noreferrer"}
        className="flex items-center gap-4"
        data-testid="owned-by-name-button-id"
        data-test={ownedById}
        data-qa={ownedByName}
      >
        <Avatar src={ownedByImage} />
        <div className="text-primary-gray">
          Owned by <span className="font-semibold">{ownedByName}</span>
        </div>
      </Link>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
