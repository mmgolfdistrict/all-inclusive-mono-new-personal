import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
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
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { CancelListing } from "./cancel-listing";
import { type MyListedTeeTimeType } from "./my-listed-tee-times";

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

  const { toggleSidebar } = useSidebar({
    isOpen: isManageTeeTimeListingOpen,
    setIsOpen: setIsManageTeeTimeListingOpen,
  });
  const [isCancelListingOpen, setIsCancelListingOpen] =
    useState<boolean>(false);
  const router = useRouter();
  const { course } = useCourseContext();
  const listingSellerFeePercentage = (course?.sellerFee ?? 1) / 100;
  const listingBuyerFeePercentage = (course?.buyerFee ?? 1) / 100;

  const { data: bookingIds } = api.teeBox.getOwnedBookingsForTeeTime.useQuery(
    {
      teeTimeId: selectedTeeTime?.teeTimeId ?? "",
    },
    { enabled: !!selectedTeeTime?.teeTimeId }
  );

  const availableSlots = 4 - (selectedTeeTime?.listedSlotsCount || 0);

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
  const auditLog = api.webhooks.auditLog.useMutation();
  const { user } = useUserContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: "",
      bookingId: "",
      listingId: selectedTeeTime?.listingId ?? "",
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
      await cancel.mutateAsync({
        listingId: selectedTeeTime?.listingId,
      });
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
    const value = e.target.value.replace("$", "").replaceAll(",", "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");
    setListingPrice(Number(strippedLeadingZeros));
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

    console.log(
      `selectedTeeTime?.firstHandPrice = ${selectedTeeTime?.firstHandPrice}`
    );

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

    // console.log(`
    //   listingSellerFeePercentage = ${listingSellerFeePercentage},
    //   listingBuyerFeePercentage  = ${listingBuyerFeePercentage},
    //   buyerListingPricePerGolfer = ${buyerListingPricePerGolfer},
    //   sellerFeePerGolfer         = ${sellerFeePerGolfer},
    //   buyerFeePerGolfer          = ${buyerFeePerGolfer},
    //   totalPayoutForAllGolfers   = ${totalPayoutForAllGolfers}`);

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

  return (
    <>
      {isManageTeeTimeListingOpen && (
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
          isManageTeeTimeListingOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Manage Tee Time Listing</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isManageTeeTimeListingOpen}
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
                  <span className="absolute left-1 top-1 text-[24px] md:text-[32px]">
                    $
                  </span>
                  <input
                    id="listingPrice"
                    value={listingPrice?.toFixed(2)}
                    type="number"
                    onFocus={handleFocus}
                    onChange={handleListingPrice}
                    onBlur={handleBlur}
                    className="mx-auto max-w-[300px] rounded-lg bg-secondary-white px-4 py-1 text-center text-[24px] font-semibold outline-none md:text-[32px] pl-6"
                    data-testid="lsiting-price-id"
                    disabled
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
                    if (availableSlots < parseInt(player)) return;

                    if (player) setPlayers(player);
                  }}
                  orientation="horizontal"
                  className="mx-auto flex"
                  data-testid="player-button-id"
                  disabled
                >
                  {PlayerOptions.map((value, index) => (
                    <Item
                      key={index}
                      value={value}
                      className={`opacity-50 ${
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
                    content="The service fee is divided between Golf District and the course. This ensures ongoing enhancements to our service, ultimate offering golfers the best access to booking times."
                  />
                </div>
                <div className="text-secondary-black">
                  {formatMoney(sellerServiceFee)}
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
                {/* <FilledButton
                  className="w-full"
                  onClick={save}
                  data-testid="save-button-id"
                >
                  Save
                </FilledButton> */}
                <FilledButton
                  className="w-full"
                  onClick={cancelListing}
                  data-testid="cancel-listing-button-id"
                >
                  Cancel Listing
                </FilledButton>

                <OutlineButton
                  onClick={() => setIsManageTeeTimeListingOpen(false)}
                  data-testid="cancel-button-id"
                >
                  Cancel
                </OutlineButton>
              </div>
            </div>
          </div>
        </div>
      </aside>
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
        refetch={refetch}
        needRedirect={needRedirect}
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
