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
import { DownChevron } from "../icons/down-chevron";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { type OwnedTeeTime } from "./owned";
import { SingleSlider } from "../input/single-slider";
import Flyout from "../modal/flyout";
import { Modal } from "../modal/modal";
import { useMediaQuery } from "usehooks-ts";
import type { SaleTypeOption } from "../input/sale-type-select";
import { SaleTypeSelector } from "../input/sale-type-select";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];


export const SPLIT_TYPE_OPTIONS: SaleTypeOption[] = [
  {
    value: "split",
    caption: "Allow Sale in Splits (Recommended)",
    description: "Buyers can purchase any number of the rounds you list. (There is a risk that partial rounds can go unsold)",
    tooltip: "Increases the pool of potential buyers as they can choose the exact number of rounds they want.",
  },
  {
    value: "whole",
    caption: "Only Sell in Whole",
    description: "Buyers must purchase all the listed rounds together from the seller. (This may limit potential buyers)",
    tooltip: "Ensures the entire set of rounds is sold at once, useful for group bookings. Eliminates risk seller left with partial bought.",
  },
];

const DEFAULT_SELL_TYPE = "whole"

type SideBarProps = {
  isListTeeTimeOpen: boolean;
  setIsListTeeTimeOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch: () => Promise<unknown>;
  needsRedirect?: boolean;
};

type ListTeeTimeDetailsProps = SideBarProps

export const ListTeeTime = ({
  isListTeeTimeOpen,
  setIsListTeeTimeOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
}: SideBarProps) => {

  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <Modal
      title="Sell"
      isOpen={isListTeeTimeOpen}
      onClose={() => setIsListTeeTimeOpen(false)}
    >
      <ListTeeTimeDetail
        isListTeeTimeOpen={isListTeeTimeOpen}
        setIsListTeeTimeOpen={setIsListTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
        needsRedirect={needsRedirect}
      />
    </Modal>
  ) : (
    <Flyout
      title="Sell"
      isOpen={isListTeeTimeOpen}
      setIsOpen={() => setIsListTeeTimeOpen(false)}
    >
      <ListTeeTimeDetail
        isListTeeTimeOpen={isListTeeTimeOpen}
        setIsListTeeTimeOpen={setIsListTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
        needsRedirect={needsRedirect}
      />
    </Flyout>
  );
};

const ListTeeTimeDetail = ({
  isListTeeTimeOpen,
  setIsListTeeTimeOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
}: ListTeeTimeDetailsProps) => {
  const availableSlots = selectedTeeTime?.golfers.length || 0;

  const [listingPrice, setListingPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sellerServiceFee, setSellerServiceFee] = useState<number>(0);
  const [players, setPlayers] = useState<string>(
    selectedTeeTime?.isGroupBooking ?
      "2" :
      selectedTeeTime?.selectedSlotsCount || availableSlots.toString()
  );
  const [saleType, setSaleType] = useState<string>(DEFAULT_SELL_TYPE);
  useSidebar({
    isOpen: isListTeeTimeOpen,
    setIsOpen: setIsListTeeTimeOpen,
  });
  const sell = api.teeBox.createListingForBookings.useMutation();
  const sellGroup = api.teeBox.createListingForGroupBookings.useMutation();
  const canResell = api.teeBox.checkIfUserIsOptMemberShip.useMutation();
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
    setPlayers(
      selectedTeeTime?.isGroupBooking ? "2" :
        selectedTeeTime?.selectedSlotsCount || slots.toString()
    );
  }, [selectedTeeTime?.selectedSlotsCount, selectedTeeTime?.golfers]);

  useEffect(() => {
    if (isListTeeTimeOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(0); //reset price
      // setPlayers(selectedTeeTime?.selectedSlotsCount||"1");
    }
    setSaleType(DEFAULT_SELL_TYPE);
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

  const handleSingleSliderChange = (value: number[]) => {
    if (value[0]) {
      setPlayers(value[0].toString());
    } else {
      toast.error("Error selecting number of players");
    }
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

  const getSaleTypeParams = (saleType: string) => {
    switch (saleType) {
      case "split":
        return {
          allowSplit: true,
        }
      case "whole":
        return {
          allowSplit: false,
        }
      default:
        return {
          allowSplit: false,
        }
    }
  }

  const listTeeTime = async () => {
    setIsLoading(true);
    void logAudit();

    try {
      const canResellResult = await canResell.mutateAsync({
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
      });
      if (canResellResult === 1) {
        toast.error("not allowed to sell because you opt membership");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error((error as Error)?.message ?? "Database error");
    }

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
      if (selectedTeeTime?.isGroupBooking) {
        await sellGroup.mutateAsync({
          groupId: selectedTeeTime?.groupId,
          listPrice: listingPrice,
          endTime: new Date(selectedTeeTime?.date),
          slots: parseInt(players),
        })
      } else {
        const saleTypeParams = getSaleTypeParams(saleType)
        await sell.mutateAsync({
          bookingIds: selectedTeeTime?.bookingIds.slice(0, parseInt(players)),
          listPrice: listingPrice,
          endTime: new Date(selectedTeeTime?.date),
          slots: parseInt(players),
          ...saleTypeParams
        });
      }
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

  return (<>
    {isLoading && <LoadingContainer isLoading={isLoading}>
      <div></div>
    </LoadingContainer>}
    <div className="relative flex h-full flex-col justify-between overflow-y-auto">
      <div className="flex flex-col gap-6 px-0 sm:px-4 mb-6">
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
          {!selectedTeeTime?.isGroupBooking ?
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
                  className={`${index === 0
                    ? "rounded-l-full border border-stroke"
                    : index === PlayerOptions.length - 1
                      ? "rounded-r-full border-b border-t border-r border-stroke"
                      : "border-b border-r border-t border-stroke"
                    } px-[1.75rem] ${availableSlots < index + 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                    }`}
                  label={value}
                />
              ))}
            </ToggleGroup.Root>
            :
            <SingleSlider
              min={1}
              max={selectedTeeTime?.golfers.length || 0}
              step={1}
              onValueChange={(value) => handleSingleSliderChange(value)}
              aria-label="Select number of players"
              data-testid="slider-number-of-players"
              value={[Number(players)]}
              shouldDisplayValue={true}
            />}
        </div>
        <div className="bg-secondary-white">
          If you purchased weather protection, you will receive a full
          refund. Any remaining owned rounds for this time will be subject
          to raincheck policy.
        </div>
        {!selectedTeeTime?.isGroupBooking
          ? <SaleTypeSelector
            className="flex flex-col w-full"
            value={saleType}
            onValueChange={setSaleType}
            saleTypeOptions={SPLIT_TYPE_OPTIONS}
            defaultValue={saleType}
          />
          : null
        }
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <div className="flex justify-between">
          <div className="font-[300] text-primary-gray">
            Your Listing Price{" "}
            <Tooltip
              trigger={<Info className="h-[14px] w-[14px]" />}
              content={
                <div className="max-w-[220px] text-sm break-words">
                  Buyer sees a slightly higher amount. These buyer/seller fees help keep the lights on at Golf District and to continuously provide better service.
                </div>
              }
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
              content={
                <div className="max-w-[200px] text-sm break-words">
                  This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking tee times
                </div>
              }
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
  </>);
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
          <div className="whitespace-normal overflow-y-auto text-secondary-black">
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