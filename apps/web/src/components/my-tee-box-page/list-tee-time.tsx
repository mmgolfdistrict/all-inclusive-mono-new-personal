import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useCourseContext } from "~/contexts/CourseContext";
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
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Item } from "../course-page/filters";
import { Close } from "../icons/close";
import { DownChevron } from "../icons/down-chevron";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { type OwnedTeeTime } from "./owned";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isListTeeTimeOpen: boolean;
  setIsListTeeTimeOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch: () => Promise<unknown>;
  needsRedirect?: boolean;
};

export const ListTeeTime = ({
  isListTeeTimeOpen,
  setIsListTeeTimeOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
}: SideBarProps) => {
  const [listingPrice, setListingPrice] = useState<number>(0);
  const [players, setPlayers] = useState<PlayerType>("1");
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isListTeeTimeOpen,
    setIsOpen: setIsListTeeTimeOpen,
  });
  const sell = api.teeBox.createListingForBookings.useMutation();
  const router = useRouter();
  const { course } = useCourseContext();

  const maxListingPrice = useMemo(() => {
    if (!selectedTeeTime?.firstHandPrice) return 0;
    return selectedTeeTime?.firstHandPrice * 50;
  }, [selectedTeeTime]);

  const availableSlots = selectedTeeTime?.bookingIds.length ?? 1;

  useEffect(() => {
    if (isListTeeTimeOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(0); //reset price
      setPlayers("1");
    }
  }, [isListTeeTimeOpen]);

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

  const listTeeTime = async () => {
    if (totalPayout < 0) {
      toast.info("Listing price must be greater than $45.");
      return;
    }
    if (!selectedTeeTime) {
      toast.info("Invalid date on tee time.");
      return;
    }
    if (listingPrice > maxListingPrice) {
      toast.info(
        `Listing price cannot be greater than 50x the first hand price. (${formatMoney(
          maxListingPrice
        )}).`
      );
      return;
    }
    if (listingPrice <= 0) {
      toast.info(`Listing price must be greater than $0.00.`);
      return;
    }
    try {
      await sell.mutateAsync({
        bookingIds: selectedTeeTime?.bookingIds.slice(0, parseInt(players)),
        listPrice: listingPrice,
        endTime: new Date(selectedTeeTime?.date),
      });
      toast.success(
        <div className="flex flex-col ">
          <div>Your tee time has been listed.</div>
          <Link
            href={`?section=my-listed-tee-times`}
            className="flex w-fit items-center gap-1 text-primary"
          >
            <div>View listed tee times</div>
            <DownChevron fill={"#40942A"} className="w-[14px] -rotate-90" />
          </Link>
        </div>
      );
      if (needsRedirect) {
        return router.push(
          `/${selectedTeeTime?.courseId}/my-tee-box?section=my-listed-tee-times`
        );
      }
      await refetch();
      setIsListTeeTimeOpen(false);
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred selling tee time."
      );
    }
  };

  return (
    <>
      {isListTeeTimeOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isListTeeTimeOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Sell</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isListTeeTimeOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6 px-0 sm:px-4">
              <TeeTimeItem
                courseImage={selectedTeeTime?.courseLogo ?? ""}
                courseName={selectedTeeTime?.courseName ?? ""}
                courseDate={selectedTeeTime?.date ?? ""}
                golferCount={selectedTeeTime?.golfers.length ?? 0}
                timezoneCorrection={course?.timezoneCorrection}
              />
              <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
                <label
                  htmlFor="listingPrice"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Enter listing price per golfer
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
                  />
                </div>
              </div>

              <div className={`flex  flex-col gap-1 text-center`}>
                <label
                  htmlFor="spots"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Select number of spots to list
                </label>
                <ToggleGroup.Root
                  id="spots"
                  type="single"
                  value={players}
                  onValueChange={(player: PlayerType) => {
                    if (availableSlots < parseInt(player)) return;

                    if (player) setPlayers(player);
                  }}
                  orientation="horizontal"
                  className="mx-auto flex"
                >
                  {PlayerOptions.map((value, index) => (
                    <Item
                      key={index}
                      value={value}
                      className={`${
                        index === 0
                          ? "rounded-l-full border border-stroke"
                          : index === PlayerOptions.length - 1
                          ? "rounded-r-full border-b border-t border-r border-stroke"
                          : "border-b border-r border-t border-stroke"
                      } px-[1.75rem] ${
                        availableSlots < index + 1
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
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
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Service fee description."
                  />
                </div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total Payout</div>
                <div className="text-secondary-black">
                  {formatMoney(totalPayout)}
                </div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className="w-full"
                  onClick={() => void listTeeTime()}
                >
                  Sell
                </FilledButton>

                <OutlineButton onClick={() => setIsListTeeTimeOpen(false)}>
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
