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
  const availableSlots = selectedTeeTime?.golfers.length || 0;

  const [listingPrice, setListingPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sellerServiceFee, setSellerServiceFee] = useState<number>(0);
  const [players, setPlayers] = useState<string>(
    selectedTeeTime?.selectedSlotsCount || availableSlots.toString()
  );
  const { toggleSidebar } = useSidebar({
    isOpen: isListTeeTimeOpen,
    setIsOpen: setIsListTeeTimeOpen,
  });
  const sell = api.teeBox.createListingForBookings.useMutation();
  const router = useRouter();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const { user } = useUserContext();
  const auditLog = api.webhooks.auditLog.useMutation();
  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: selectedTeeTime?.teeTimeId ?? "",
      bookingId: selectedTeeTime?.bookingIds?.[0] ?? "",
      listingId: selectedTeeTime?.listingId ?? "",
      courseId,
      eventId: "TEE_TIME_LISTED",
      json: `TEE_TIME_LISTED`,
    });
  };
  const listingSellerFeePercentage = (course?.sellerFee ?? 1) / 100;
  const listingBuyerFeePercentage = (course?.buyerFee ?? 1) / 100;

  const maxListingPrice = useMemo(() => {
    if (!selectedTeeTime?.purchasedFor) return 0;
    const max =
      selectedTeeTime?.purchasedFor *
      (1 +
        (course?.maxListPricePerGolferPercentage
          ? course?.maxListPricePerGolferPercentage / 100
          : 0));

    return Math.round(parseInt(max.toFixed(2)));
  }, [selectedTeeTime]);

  useEffect(() => {
    const slots = selectedTeeTime?.golfers.length || 0;
    setPlayers(selectedTeeTime?.selectedSlotsCount || slots.toString());
  }, [selectedTeeTime?.selectedSlotsCount, selectedTeeTime?.golfers]);

  useEffect(() => {
    if (isListTeeTimeOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(0); //reset price
      // setPlayers(selectedTeeTime?.selectedSlotsCount||"1");
    }
  }, [isListTeeTimeOpen]);

  const handleFocus = () => {
    if (!listingPrice) setListingPrice(0);
  };

  const handleBlur = () => {
    if (!listingPrice) setListingPrice(0);
  };

  const handleListingPrice = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[$,]/g, "");

    // if( value.indexOf("-1") > -1) return;

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");
    setListingPrice(Number(strippedLeadingZeros));
  };

  const totalPayout = useMemo(() => {
    if (!listingPrice) {
      setSellerServiceFee(0);
      return 0;
    }
    if (listingPrice <= 0) {
      setSellerServiceFee(0);
      return 0;
    }

    const sellerListingPricePerGolfer = parseFloat(listingPrice.toString());

    const buyerListingPricePerGolfer =
      sellerListingPricePerGolfer * (1 + listingBuyerFeePercentage);
    const sellerFeePerGolfer =
      sellerListingPricePerGolfer * listingSellerFeePercentage;
    const buyerFeePerGolfer =
      sellerListingPricePerGolfer * listingBuyerFeePercentage;
    let totalPayoutForAllGolfers =
      (buyerListingPricePerGolfer - buyerFeePerGolfer - sellerFeePerGolfer) *
      parseInt(players);

    // totalPayoutForAllGolfers =
    //   ( totalPayoutForAllGolfers <= 0 ? 0 : totalPayoutForAllGolfers );

    totalPayoutForAllGolfers =
      (totalPayoutForAllGolfers <= 0 ? 0 : totalPayoutForAllGolfers) +
      (selectedTeeTime?.weatherGuaranteeAmount ?? 0) / 100;

    // setSellerServiceFee(
    //   sellerFeePerGolfer * parseInt(players) +
    //     (selectedTeeTime?.weatherGuaranteeAmount ?? 0) / 100
    // );

    setSellerServiceFee(sellerFeePerGolfer * parseInt(players));

    return Math.abs(totalPayoutForAllGolfers);
  }, [listingPrice, players]);

  const listTeeTime = async () => {
    setIsLoading(true);
    void logAudit();
    //You should never enter this condition.
    if (totalPayout < 0) {
      toast.error("Listing price must be greater than $45.");
      setIsLoading(false);
      return;
    }
    if (!selectedTeeTime) {
      toast.error("Invalid date on tee time.");
      setIsLoading(false);
      return;
    }

    if (listingPrice > maxListingPrice) {
      toast.error(
        `Listing price cannot be greater than ${formatMoney(maxListingPrice)}.`
      );
      setIsLoading(false);
      return;
    }
    if (listingPrice === 0) {
      toast.error(`Enter listing price.`);
      setIsLoading(false);
      return;
    }
    if (listingPrice === 1) {
      toast.error(`Listing price must be greater than $1.`);
      setIsLoading(false);
      return;
    }
    try {
      await sell.mutateAsync({
        bookingIds: selectedTeeTime?.bookingIds.slice(0, parseInt(players)),
        listPrice: listingPrice,
        endTime: new Date(selectedTeeTime?.date),
        slots: parseInt(players),
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
      setIsLoading(false);
      await refetch();
      setIsListTeeTimeOpen(false);
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred selling tee time."
      );
    } finally {
      setIsLoading(false);
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
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isListTeeTimeOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Sell</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isListTeeTimeOpen}
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
                {/* <div className="flex text-[14px] md:text-[16px]">
                  <span className="text-primary-gray">
                    Maximum listing price per golfer: &nbsp;
                  </span>
                  <span className="text-secondary-black">
                    ${maxListingPrice}
                  </span>
                </div> */}
                <div className="relative">
                  <span className="absolute left-1 top-1 text-[24px] md:text-[32px]">
                    $
                  </span>
                  <input
                    id="listingPrice"
                    value={listingPrice
                      ?.toString()
                      ?.replace(/^0+/, "")
                      .replace(".", "")
                      .replace("-", "")}
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
                  data-testid="player-button-id"
                >
                  {PlayerOptions.map((value, index) => (
                    <Item
                      key={index}
                      dataTestId="player-item-id"
                      dataQa={value}
                      value={value}
                      label={value}
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
                    />
                  ))}
                </ToggleGroup.Root>
              </div>
              <div className="bg-secondary-white">
                If you purchased weather protection, you will receive a full
                refund. Any remaining owned rounds for this time will be subject
                to raincheck policy.
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Your Listing Price{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Buyer sees a slightly higher amount. These buyer/seller fees help keep the lights on at Golf District and to continuously provide better service."
                  />
                </div>
                <div className="text-secondary-black">
                  {formatMoney(listingPrice * Number(players))}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking tee times"
                  />
                </div>
                <div className="text-secondary-black">
                  ({formatMoney(sellerServiceFee)})
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Weather Guarantee Refund{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Weather guarantee amount to be refunded"
                  />
                </div>
                <div className="text-secondary-black">
                  {formatMoney(
                    (selectedTeeTime?.weatherGuaranteeAmount ?? 0) / 100
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  You Receive after Sale
                </div>
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
                  data-testid="sell-tee-time-button-id"
                >
                  Sell
                </FilledButton>

                <OutlineButton
                  onClick={() => setIsListTeeTimeOpen(false)}
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
