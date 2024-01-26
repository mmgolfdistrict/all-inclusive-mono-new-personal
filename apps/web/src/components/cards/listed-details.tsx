"use client";

import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Check } from "../icons/check";
import { GolfCart } from "../icons/golf-cart";
import { Heart } from "../icons/heart";
import { Players } from "../icons/players";
import { Share } from "../icons/share";
import { ChoosePlayers } from "../input/choose-players";
import { ManageTeeTimeListing } from "../my-tee-box-page/manage-tee-time-listing";
import { MakeAnOffer } from "../watchlist-page/make-an-offer";

const PlayersOptions = ["1", "2", "3", "4"];

export const ListedDetails = ({
  listingId,
  teeTimeId,
  ...props
}: {
  listingId: string;
  teeTimeId: string;
  props?: ComponentProps<"div">;
}) => {
  const [players, setPlayers] = useState<string>("1");
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);
  const [isManageListingOpen, setIsManageListingOpen] =
    useState<boolean>(false);

  const { data, isLoading, error, isError, refetch } =
    api.searchRouter.getListingById.useQuery({ listingId: listingId });

  const { user } = useUserContext();
  const { course } = useCourseContext();
  const router = useRouter();

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();

  const { data: bookingIds, refetch: refetchBookingsIds } =
    api.teeBox.getOwnedBookingsForTeeTime.useQuery(
      {
        teeTimeId: teeTimeId ?? "",
        ownerId: data?.soldById,
      },
      { enabled: teeTimeId !== undefined && data?.soldById !== undefined }
    );

  const refecthData = async () => {
    await refetch();
    await refetchBookingsIds();
  };

  const share = async () => {
    const currentUrl = window.location.href;
    if (navigator?.share) {
      await navigator.share({ url: currentUrl });
    } else {
      await copyToClipboard(currentUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    await copy(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  const buyTeeTime = () => {
    if (!user) {
      void router.push(`/${course?.id}/login`);
    } else {
      void router.push(
        `/${course?.id}/checkout?listingId=${listingId}&playerCount=${data?.availableSlots}`
      );
    }
  };

  const addToWatchlist = async () => {
    if (!user) {
      void router.push(`/${course?.id}/login`);
      return;
    }
    try {
      await toggleWatchlist.mutateAsync({
        teeTimeId: teeTimeId,
      });
      await refetch();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error adding to watchlist");
      console.log(error);
    }
  };

  const makeAnOffer = () => {
    setIsMakeAnOfferOpen(true);
  };

  useEffect(() => {
    setPlayers(data?.availableSlots?.toString() ?? "1");
  }, [data?.availableSlots]);

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <div
      className="flex w-full flex-col gap-4 bg-white  md:rounded-xl"
      {...props}
    >
      <div className="stroke flex flex-wrap justify-between gap-4 border-b px-4 py-3 md:gap-2 md:px-6 md:py-4">
        <div className="text-lg font-semibold">
          {isError || data === null ? (
            <div className="h-4" />
          ) : (
            formatTime(data?.date ?? "", true, course?.timezoneCorrection)
          )}
        </div>
        <div className="flex items-center gap-1">
          {isError || data === null ? (
            <div className="h-4" />
          ) : (
            <>
              <div>{WeatherIcons[data?.weather?.iconCode ?? ""]}</div>
              {data?.weather.temperature && data?.weather.name ? (
                <div>{data?.weather.temperature}°F</div>
              ) : null}
              <div className="hidden text-sm text-primary-gray md:block">
                {data?.weather.shortForecast}
              </div>
            </>
          )}
        </div>
      </div>
      {isError ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            Error: {error?.message ?? "An error occurred"}
          </div>
        </div>
      ) : data === null ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">Tee time not found</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4  px-4 pb-2 text-[14px] md:px-6 md:pb-3">
          <div className="flex items-center gap-1">
            <Avatar src={data?.soldByImage} />
            <div>Sold by</div>
            <Link
              href={`/${course?.id}/profile${data?.soldById}`}
              className="text-primary"
            >
              {data?.soldByName}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {data?.includesCart ? <GolfCart className="w-[25px]" /> : null}
            <div>
              {data?.includesCart ? "Includes" : "Doesn't include"} cart
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Players className="w-[25px]" />
            <ChoosePlayers
              players={players}
              setPlayers={setPlayers}
              playersOptions={PlayersOptions}
              availableSlots={data?.availableSlots ?? 0}
              isDisabled={true}
            />
          </div>
          <div className="flex flex-col flex-wrap justify-between gap-2 md:flex-row">
            {data?.pricePerGolfer ? (
              <div className="flex items-center">
                <div className="text-[20px] font-semibold text-secondary-black">
                  {formatMoney(data?.pricePerGolfer)}
                </div>
                <div className="text-[16px] text-primary-gray"> /golfer</div>
              </div>
            ) : (
              <div />
            )}
            <div className="flex flex-col md:flex-row items-center gap-2">
              {user?.id !== data.soldById ? (
                <>
                  <div className="flex flex-col lg:flex-row items-center gap-2 w-full">
                    <OutlineButton
                      onClick={() => void share()}
                      className="w-full whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isCopied ? (
                          <>
                            <Check className="w-[18px] min-w-[18px]" /> Copied
                          </>
                        ) : (
                          <>
                            <Share /> Share
                          </>
                        )}
                      </div>
                    </OutlineButton>
                    <OutlineButton
                      className="w-full whitespace-nowrap"
                      onClick={addToWatchlist}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Heart
                          className="w-[20px] min-w-[20px]"
                          fill={data?.userWatchListed ? "#40942A" : undefined}
                        />{" "}
                        Watchlist
                      </div>
                    </OutlineButton>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center gap-2 w-full">
                    <FilledButton
                      className="w-full whitespace-nowrap md:px-14 flex items-center justify-center !text-center"
                      onClick={makeAnOffer}
                    >
                      Place Offer
                    </FilledButton>
                    <FilledButton
                      className="w-full whitespace-nowrap md:px-14"
                      onClick={buyTeeTime}
                    >
                      Buy
                    </FilledButton>
                  </div>
                </>
              ) : (
                <>
                  <OutlineButton
                    onClick={() => void share()}
                    className="w-full whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isCopied ? (
                        <>
                          <Check className="w-[18px] min-w-[18px]" /> Copied
                        </>
                      ) : (
                        <>
                          <Share /> Share
                        </>
                      )}
                    </div>
                  </OutlineButton>
                  <FilledButton
                    className="w-full whitespace-nowrap md:px-8"
                    onClick={() => setIsManageListingOpen(true)}
                  >
                    Manage
                  </FilledButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <ManageTeeTimeListing
        isManageTeeTimeListingOpen={isManageListingOpen}
        setIsManageTeeTimeListingOpen={setIsManageListingOpen}
        refetch={refecthData}
        selectedTeeTime={{
          listingId: listingId,
          courseName: course?.name ?? "",
          courseLogo: course?.logo ?? "",
          courseId: course?.id ?? "",
          date: data?.date ?? "",
          firstHandPrice: 0,
          miniumOfferPrice: data?.minimumOfferPrice ?? 0,
          listPrice: data?.pricePerGolfer ?? 0,
          status: "LISTED",
          listedSpots: Array(data?.availableSlots ?? 0),
          teeTimeId: teeTimeId,
        }}
        needRedirect={true}
      />
      <MakeAnOffer
        isMakeAnOfferOpen={isMakeAnOfferOpen}
        setIsMakeAnOfferOpen={setIsMakeAnOfferOpen}
        availableSlots={data?.availableSlots ?? 0}
        courseImage={course?.logo ?? ""}
        courseName={course?.name ?? ""}
        date={data?.date ?? ""}
        minimumOfferPrice={data?.minimumOfferPrice ?? 0}
        bookingIds={bookingIds ?? []}
      />
    </div>
  );
};

const Skeleton = () => (
  <div className="flex w-full flex-col gap-4 bg-white  md:rounded-xl">
    <div className="stroke flex flex-wrap justify-between gap-4 border-b px-4 py-3 md:gap-2 md:px-6 md:py-4">
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
    </div>
    <div className="flex flex-col gap-4  px-4 pb-2 text-[14px] md:px-6 md:pb-3">
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 bg-gray-200 rounded-full  animate-pulse" />
        <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
      <div className="h-6 w-[30%] bg-gray-200 rounded-md  animate-pulse" />

      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded-full  animate-pulse" />

        <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
      <div className="flex flex-col justify-between md:items-center gap-2 md:flex-row ">
        <div className="h-6 w-36  bg-gray-200 rounded-md  animate-pulse" />

        <div className="flex flex-col md:flex-row items-center md:w-fit w-full gap-2">
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);
