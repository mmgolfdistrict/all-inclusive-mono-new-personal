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
import { CancelListing } from "./cancel-listing";
import { type MyListedTeeTimeType } from "./my-listed-tee-times";
import Flyout from "../modal/flyout";
import { Modal } from "../modal/modal";
import { useMediaQuery } from "usehooks-ts";
import { SaleTypeSelector } from "../input/sale-type-select";
import { SPLIT_TYPE_OPTIONS } from "./list-tee-time";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isManageTeeTimeListingOpen: boolean;
  setIsManageTeeTimeListingOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: MyListedTeeTimeType | undefined;
  refetch?: () => Promise<unknown>;
  needRedirect?: boolean;
};

export const ManageTeeTimeListing = ({
  isManageTeeTimeListingOpen,
  setIsManageTeeTimeListingOpen,
  selectedTeeTime,
  refetch,
  needRedirect,
}: SideBarProps) => {
  const [listingPrice, setListingPrice] = useState<number>(300);
  const [sellerServiceFee, setSellerServiceFee] = useState<number>(0);
  const [minimumListingPrice, setMinimumListingPrice] = useState<number>(200);
  const [players, setPlayers] = useState<PlayerType>("1");

  const [initialPrice, setInitialPrice] = useState<number | null>(null); // Initial price when sidebar opens
  const [initialPlayers, setInitialPlayers] = useState<PlayerType | null>(null); // Initial players when sidebar opens
  const [saleType, setSaleType] = useState<string>("whole");
  const [initialSaleType, setInitialSaleType] = useState<string>("whole"); // Initial saleType when sidebar opens
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (selectedTeeTime) {
      const initialTeeTimePrice = selectedTeeTime.listPrice ?? 300;
      const initialTeeTimePlayers =
        selectedTeeTime.listedSlotsCount?.toString() as PlayerType;

      // Set initial values ONLY when tee time is selected or sidebar is opened
      setInitialPrice(initialTeeTimePrice);
      setInitialPlayers(initialTeeTimePlayers);

      // Sync current editable fields with selectedTeeTime values
      setListingPrice(initialTeeTimePrice);
      setPlayers(initialTeeTimePlayers);

      setSaleType(selectedTeeTime.allowSplit ? "split" : "whole");
      setInitialSaleType(selectedTeeTime.allowSplit ? "split" : "whole");
    }
  }, [selectedTeeTime, isManageTeeTimeListingOpen]);

  // Check if the price and players have changed from the initial values
  const isUnchanged =
    initialPrice !== null &&
    initialPlayers !== null &&
    listingPrice === initialPrice &&
    players === initialPlayers &&
    saleType === initialSaleType;

  const { toggleSidebar } = useSidebar({
    isOpen: isManageTeeTimeListingOpen,
    setIsOpen: setIsManageTeeTimeListingOpen,
  });
  const [isCancelListingOpen, setIsCancelListingOpen] =
    useState<boolean>(false);
  const updateListingForBooking = api.teeBox.updateListingForBookings.useMutation();
  const sellGroup = api.teeBox.createListingForGroupBookings.useMutation();
  const canResell = api.teeBox.checkIfUserIsOptMemberShip.useMutation();
  const router = useRouter();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const listingSellerFeePercentage = (course?.sellerFee ?? 1) / 100;
  const listingBuyerFeePercentage = (course?.buyerFee ?? 1) / 100;

  const { data: bookingIds } = api.teeBox.getOwnedBookingsForTeeTime.useQuery(
    {
      teeTimeId: selectedTeeTime?.teeTimeId ?? "",
    },
    { enabled: !!selectedTeeTime?.teeTimeId }
  );

  useEffect(() => {
    if (selectedTeeTime) {
      if (selectedTeeTime?.listPrice !== null) {
        setListingPrice(selectedTeeTime?.listPrice);
      }
      setPlayers(selectedTeeTime?.listedSlotsCount?.toString() as PlayerType);
    }
  }, [selectedTeeTime, isManageTeeTimeListingOpen]);

  const manageListing = api.teeBox.updateListing.useMutation();
  const cancel = api.teeBox.cancelListing.useMutation();
  const cancelGroupListing = api.teeBox.cancelGroupListing.useMutation();
  const auditLog = api.webhooks.auditLog.useMutation();
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: "",
      bookingId: "",
      listingId: selectedTeeTime?.listingId ?? "",
      courseId,
      eventId: "TEE_TIME_CANCELLED",
      json: `TEE_TIME_CANCELLED`,
    });
  };
  const cancelListing = async () => {
    if (!selectedTeeTime?.listingId) {
      toast.error("Listed already cancelled");
      return;
    }
    setIsLoading(true);
    try {
      if (selectedTeeTime?.groupId) {
        await cancelGroupListing.mutateAsync({
          groupId: selectedTeeTime?.groupId ?? "",
        });
      } else {
        await cancel.mutateAsync({
          listingId: selectedTeeTime?.listingId,
        });
      }
      await refetch?.();
      toast.success("Listing cancelled successfully");
      setIsManageTeeTimeListingOpen(false);
      void logAudit();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error cancelling listing");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isManageTeeTimeListingOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setListingPrice(300); //reset price
    }
  }, [isManageTeeTimeListingOpen]);

  const handleFocus = () => {
    if (!listingPrice) setListingPrice(0);
    if (!minimumListingPrice) setMinimumListingPrice(0);
  };

  const handleBlur = () => {
    if (!listingPrice) setListingPrice(0);
    if (!minimumListingPrice) setMinimumListingPrice(0);
  };

  const handleListingPrice = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[$,]/g, "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");
    setListingPrice(
      strippedLeadingZeros === "" ? NaN : Number(strippedLeadingZeros)
    );
  };

  // const totalPayout = useMemo(() => {
  //   if (!listingPrice) return 0;
  //   return listingPrice * parseInt(players) - 45;
  // }, [listingPrice, players]);

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

    totalPayoutForAllGolfers =
      totalPayoutForAllGolfers <= 0 ? 0 : totalPayoutForAllGolfers;

    setSellerServiceFee(sellerFeePerGolfer * parseInt(players));

    return Math.abs(totalPayoutForAllGolfers);
  }, [listingPrice, players]);

  const maxListingPrice = useMemo(() => {
    if (!selectedTeeTime?.firstHandPrice) return 0;
    return selectedTeeTime?.firstHandPrice * 50;
  }, [selectedTeeTime]);

  const _save = async () => {
    if (!selectedTeeTime?.listingId) {
      toast.error("Listing not found");
      return;
    }
    if (!selectedTeeTime?.listedSpots) {
      toast.error("Listed spots not found");
      return;
    }
    if (listingPrice > maxListingPrice) {
      toast.error(
        `Listing price cannot be greater than 50x the first hand price. (${formatMoney(
          maxListingPrice
        )}).`
      );
      return;
    }
    if (totalPayout <= 0) {
      toast.error("Listing price must be greater than $45.");
      return;
    }
    if (!bookingIds) {
      toast.error("Booking ids not found");
      return;
    }
    try {
      await manageListing.mutateAsync({
        bookingIds: bookingIds?.slice(0, parseInt(players)),
        listPrice: listingPrice,
        listingId: selectedTeeTime?.listingId,
        endTime: new Date(selectedTeeTime?.date),
      });
      toast.success("Tee time listing updated successfully");
      if (needRedirect) {
        return router.push(
          `/${selectedTeeTime?.courseId}/my-tee-box?section=my-listed-tee-times`
        );
      }
      setIsManageTeeTimeListingOpen(false);
      await refetch?.();
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred updating listing."
      );
    }
  };

  const UpdateListing = async () => {
    setIsLoading(true);
    void logAudit();

    try {
      const canResellResult = await canResell.mutateAsync({
        bookingId: selectedTeeTime?.listedSpots?.[0] ?? "",
      });
      if (canResellResult === 1) {
        toast.error("not allowed to sell because you opt membership");
        setIsLoading(false);
        return;
      }
    } catch (error) {
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
          groupId: selectedTeeTime?.groupId ?? "",
          listPrice: listingPrice,
          endTime: new Date(selectedTeeTime?.date),
          slots: parseInt(players),
        });
      } else {
        await updateListingForBooking.mutateAsync({
          bookingIds:
            selectedTeeTime?.listedSpots?.slice(0, parseInt(players)) ?? [],
          listId: selectedTeeTime?.listingId ?? "",
          updatedPrice: listingPrice,
          updatedSlots: parseInt(players),
          endTime: new Date(selectedTeeTime?.date),
          allowSplit: saleType === "split" ? true : false
        });
      }
      setIsManageTeeTimeListingOpen(false);
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
      setIsManageTeeTimeListingOpen(false);
      if (needRedirect) {
        return router.push(
          `/${selectedTeeTime?.courseId}/my-tee-box?section=my-listed-tee-times`
        );
      }
      setIsLoading(false);
      await refetch?.();
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred selling tee time."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ManageTeeTimeListingDetail = ({
    setIsManageTeeTimeListingOpen,
    selectedTeeTime,
  }: {
    setIsManageTeeTimeListingOpen: Dispatch<SetStateAction<boolean>>;
    selectedTeeTime: MyListedTeeTimeType | undefined;
  }) => {
    return (<>
      {isLoading && <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>}
      {isLoading && <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>}
      <div className="flex h-full flex-col justify-between overflow-y-auto">
        <div className="flex flex-col gap-6 px-0 sm:px-4">
          <TeeTimeItem
            courseImage={selectedTeeTime?.courseLogo ?? ""}
            courseName={selectedTeeTime?.courseName ?? ""}
            courseDate={selectedTeeTime?.date ?? ""}
            golferCount={selectedTeeTime?.listedSlotsCount ?? 1}
            timezoneCorrection={course?.timezoneCorrection}
          />
          <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
            <label
              htmlFor="listingPrice"
              className="text-[16px] text-primary-gray md:text-[18px]"
            >
              Listing price per golfer
            </label>
            <div className="relative">
              <span
                className={`absolute left-1 top-1 text-[24px] md:text-[32px] ${selectedTeeTime?.listingId ===
                  selectedTeeTime?.listingIdFromRedis
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  } `}
              >
                $
              </span>
              <input
                id="listingPrice"
                value={listingPrice}
                type="number"
                onFocus={handleFocus}
                onChange={handleListingPrice}
                onBlur={handleBlur}
                className={`mx-auto max-w-[300px] rounded-lg bg-secondary-white px-4 py-1 text-center text-[24px] font-semibold outline-none md:text-[32px] pl-6 ${selectedTeeTime?.listingId ===
                  selectedTeeTime?.listingIdFromRedis
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  }`}
                data-testid="lsiting-price-id"
                disabled={
                  selectedTeeTime?.listingId ===
                  selectedTeeTime?.listingIdFromRedis
                }
              />
            </div>
          </div>

          <div className={`flex  flex-col gap-1 text-center`}>
            <label
              htmlFor="spot"
              className="text-[16px] text-primary-gray md:text-[18px]"
            >
              Number of spots listed
            </label>
            <ToggleGroup.Root
              id="spots"
              type="single"
              value={players}
              onValueChange={(player: PlayerType) => {
                if ((selectedTeeTime?.playerCount || 0) < parseInt(player))
                  return;

                if (player) setPlayers(player);
              }}
              orientation="horizontal"
              className="mx-auto flex"
              data-testid="player-button-id"
              disabled={
                selectedTeeTime?.listingId ===
                selectedTeeTime?.listingIdFromRedis
              }
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
                    } px-[1.75rem] ${(selectedTeeTime?.playerCount || 0) < index + 1 ||
                      selectedTeeTime?.listingId ===
                      selectedTeeTime?.listingIdFromRedis
                      ? "opacity-50 cursor-not-allowed"
                      : "" // Keep only if restricting based on `availableSlots`
                    } `}
                  dataTestId="player-item-id"
                  dataQa={value}
                  label={value}
                />
              ))}
            </ToggleGroup.Root>
          </div>

          {!selectedTeeTime?.isGroupBooking
            ? <SaleTypeSelector
              className="flex flex-col w-full mb-4"
              value={saleType}
              onValueChange={setSaleType}
              saleTypeOptions={SPLIT_TYPE_OPTIONS}
              defaultValue={saleType}
              disabled={
                selectedTeeTime?.listingId ===
                selectedTeeTime?.listingIdFromRedis
              }
            />
            : null
          }
        </div>
        {selectedTeeTime?.listingId ===
          selectedTeeTime?.listingIdFromRedis && (
            <div className="text-center text-[20px] text-red">
              Users are trying to buy this tee time and hence, editing is not
              allowed.
            </div>
          )}
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex justify-between">
            <div className="font-[300] text-primary-gray">
              Your Listing Price
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
              {`(${formatMoney(sellerServiceFee)})`}
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
              className="w-full disabled:bg-gray-400  disabled:border-gray-400 disabled:cursor-not-allowed"
              onClick={UpdateListing}
              data-testid="save-button-id"
              disabled={
                selectedTeeTime?.listingId ===
                selectedTeeTime?.listingIdFromRedis || isUnchanged
              }
            >
              Update Listing
            </FilledButton>

            <FilledButton
              className="w-full disabled:bg-gray-400  disabled:border-gray-400 disabled:cursor-not-allowed"
              onClick={cancelListing}
              data-testid="cancel-listing-button-id"
              disabled={
                selectedTeeTime?.listingId ===
                selectedTeeTime?.listingIdFromRedis
              }
            >
              Cancel Listing
            </FilledButton>

            <OutlineButton
              className="w-full border disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={() => setIsManageTeeTimeListingOpen(false)}
              data-testid="cancel-button-id"
            >
              Cancel
            </OutlineButton>
          </div>
        </div>
      </div>
    </>);
  };

  return (
    <>
      {isMobile ?
        <Modal
          isOpen={isManageTeeTimeListingOpen}
          title="Manage Tee Time Listing"
          onClose={toggleSidebar}
        >
          <ManageTeeTimeListingDetail
            setIsManageTeeTimeListingOpen={setIsManageTeeTimeListingOpen}
            selectedTeeTime={selectedTeeTime}
          />
        </Modal> :
        <Flyout
          isOpen={isManageTeeTimeListingOpen}
          title="Manage Tee Time Listing"
          setIsOpen={toggleSidebar}
        >
          <ManageTeeTimeListingDetail
            setIsManageTeeTimeListingOpen={setIsManageTeeTimeListingOpen}
            selectedTeeTime={selectedTeeTime}
          />
        </Flyout>}
      <CancelListing
        isCancelListingOpen={isCancelListingOpen}
        setIsCancelListingOpen={setIsCancelListingOpen}
        courseName={selectedTeeTime?.courseName}
        courseLogo={selectedTeeTime?.courseLogo}
        date={selectedTeeTime?.date}
        golferCount={selectedTeeTime?.listedSlotsCount}
        pricePerGolfer={
          selectedTeeTime?.listPrice ? selectedTeeTime?.listPrice / 100 : 0
        }
        listingId={selectedTeeTime?.listingId ?? undefined}
        isGroupBooking={selectedTeeTime?.groupId ? true : false}
        groupBookingId={selectedTeeTime?.groupId ?? undefined}
        refetch={refetch}
        needRedirect={needRedirect}
        allowSplit={selectedTeeTime?.allowSplit}
      />
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
