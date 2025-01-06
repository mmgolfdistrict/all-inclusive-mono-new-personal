"use client";

import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import type { InviteFriend } from "~/utils/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Check } from "../icons/check";
import { Heart } from "../icons/heart";
import { Players } from "../icons/players";
import { Share } from "../icons/share";
import { ChoosePlayers } from "../input/choose-players";
import { ListTeeTime } from "../my-tee-box-page/list-tee-time";
import { ManageOwnedTeeTime } from "../my-tee-box-page/manage-owned-tee-time";
import { MakeAnOffer } from "../watchlist-page/make-an-offer";

const PlayersOptions = ["1", "2", "3", "4"];

export const UnlistedDetails = ({
  ownerId,
  teeTimeId,
  ...props
}: {
  ownerId: string;
  teeTimeId: string;
  props?: ComponentProps<"div">;
}) => {
  const { course } = useCourseContext();
  const [players, setPlayers] = useState<string>("1");
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);
  const [isListTeeTimeOpen, setIsListTeeTimeOpen] = useState<boolean>(false);
  const [isManageTeeTimeOpen, setIsManageTeeTimeOpen] =
    useState<boolean>(false);

  const { data, isLoading, error, isError, refetch } =
    api.searchRouter.getUnlistedTeeTimes.useQuery({
      ownerId: ownerId,
      teeTimeId: teeTimeId,
    });
  console.log("unlistedTeetTIME",data);
  const { data: bookingData } = api.user.getBookingsOwnedForTeeTime.useQuery(
    { teeTimeId },
    {
      enabled: !!teeTimeId,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: bookingIds, refetch: refetchBookingIds } =
    api.teeBox.getOwnedBookingsForTeeTime.useQuery(
      {
        teeTimeId: teeTimeId ?? "",
        ownerId: ownerId,
      },
      { enabled: teeTimeId !== undefined && ownerId !== undefined }
    );

  const refetchData = async () => {
    await refetch();
    await refetchBookingIds();
  };

  const { user } = useUserContext();
  const router = useRouter();

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();

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
    }
  };

  const makeAnOffer = () => {
    setIsMakeAnOfferOpen(true);
  };

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
            <div>Owned By</div>
            <Link
              href={`/${course?.id}/profile/${data?.soldById}`}
              className="text-primary"
              data-testid="sold-by-name-id"
              data-test={data?.soldById}
              data-qa={course?.id}
            >
              {data?.soldByName}
            </Link>
          </div>
          {/* <div className="flex items-center gap-4">
            {data?.includesCart ? <GolfCart className="w-[25px]" /> : null}
            <div>
              {data?.includesCart ? "Includes" : "Doesn't include"} cart
            </div>
          </div> */}
          <div className="flex items-center gap-4">
            <Players className="w-[25px]" />
            <ChoosePlayers
              players={players}
              setPlayers={setPlayers}
              playersOptions={PlayersOptions}
              availableSlots={bookingData?.bookings?.length || 0}
              teeTimeId={teeTimeId}
              numberOfPlayers={PlayersOptions}
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
              {user?.id !== ownerId ? (
                <>
                  <div className="flex flex-col lg:flex-row items-center gap-2 w-full">
                    <OutlineButton
                      onClick={() => void share()}
                      className="w-full whitespace-nowrap"
                      data-testid="share-button-id"
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
                      data-testid="watchlist-button-id"
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
                      data-testid="place-offer-button-id"
                    >
                      Place Offer
                    </FilledButton>
                  </div>
                </>
              ) : (
                <>
                  <OutlineButton
                    onClick={() => void share()}
                    className="w-full whitespace-nowrap"
                    data-testid="share-button-id"
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
                    className="w-full whitespace-nowrap md:px-8"
                    onClick={() => setIsManageTeeTimeOpen(true)}
                    data-testid="manage-button-id"
                  >
                    Manage
                  </OutlineButton>
                  <FilledButton
                    className="w-full whitespace-nowrap md:!min-w-[130px]"
                    onClick={() => setIsListTeeTimeOpen(true)}
                    data-testid="sell-button-id"
                  >
                    Sell
                  </FilledButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <ListTeeTime
        selectedTeeTime={{
          courseName: course?.name ?? "",
          courseLogo: course?.logo ?? "",
          courseId: course?.id ?? "",
          date: data?.date ?? "",
          firstHandPrice: data?.firstHandPrice ?? 0,
          golfers: (bookingData?.bookings as InviteFriend[]) ?? [],
          purchasedFor: data?.purchasedFor ?? 0,
          bookingIds: bookingIds ?? [],
          status: "UNLISTED",
          offers: "",
          listingId: null,
          listedSpots: null,
          teeTimeId: data?.teeTimeId ?? "",
          listPrice: null,
          minimumOfferPrice: data?.minimumOfferPrice ?? 0,
          bookingStatus: ""
        }}
        refetch={refetchData}
        isListTeeTimeOpen={isListTeeTimeOpen}
        setIsListTeeTimeOpen={setIsListTeeTimeOpen}
        needsRedirect={true}
      />
      <ManageOwnedTeeTime
        isManageOwnedTeeTimeOpen={isManageTeeTimeOpen}
        setIsManageOwnedTeeTimeOpen={setIsManageTeeTimeOpen}
        refetch={refetchData}
        selectedTeeTime={{
          courseName: course?.name ?? "",
          courseLogo: course?.logo ?? "",
          courseId: course?.id ?? "",
          date: data?.date ?? "",
          firstHandPrice: data?.firstHandPrice ?? 0,
          golfers: (bookingData?.bookings as InviteFriend[]) ?? [],
          purchasedFor: data?.purchasedFor ?? 0,
          bookingIds: bookingIds ?? [],
          status: "UNLISTED",
          offers: "",
          listingId: null,
          listedSpots: null,
          teeTimeId: data?.teeTimeId ?? "",
          listPrice: null,
          minimumOfferPrice: data?.minimumOfferPrice ?? 0,
          bookingStatus: ""
        }}
      />
      <MakeAnOffer
        isMakeAnOfferOpen={isMakeAnOfferOpen}
        setIsMakeAnOfferOpen={setIsMakeAnOfferOpen}
        availableSlots={bookingData?.bookings?.length || 0}
        courseImage={course?.logo ?? ""}
        courseName={course?.name ?? ""}
        date={data?.date ?? ""}
        minimumOfferPrice={
          data?.minimumOfferPrice ??
          data?.firstHandPrice ??
          data?.purchasedFor ??
          0
        }
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
