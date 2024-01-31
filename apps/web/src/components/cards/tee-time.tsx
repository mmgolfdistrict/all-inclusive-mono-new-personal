"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, getTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Heart } from "../icons/heart";
import { Hidden } from "../icons/hidden";
import { OutlineClub } from "../icons/outline-club";
import { ChoosePlayers } from "../input/choose-players";
import { MakeAnOffer } from "../watchlist-page/make-an-offer";

const PlayersOptions = ["1", "2", "3", "4"];

export const TeeTime = ({
  time,
  canChoosePlayer,
  players,
  price,
  isOwned,
  soldById,
  soldByImage,
  soldByName,
  availableSlots,
  teeTimeId,
  isLiked,
  status,
  minimumOfferPrice,
  bookingIds,
  listingId,
  firstHandPurchasePrice,
  className,
  children,
}: {
  time: string;
  canChoosePlayer: boolean;
  players: string;
  price: number;
  isOwned: boolean;
  soldById: string;
  soldByImage: string;
  soldByName: string;
  availableSlots: number;
  teeTimeId: string;
  isLiked: boolean;
  status: "UNLISTED" | "FIRST_HAND" | "SECOND_HAND";
  minimumOfferPrice: number | undefined;
  bookingIds: string[];
  listingId: string | undefined;
  firstHandPurchasePrice: number | undefined;
  className?: string;
  children?: ReactNode;
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string>("1");
  const { course } = useCourseContext();
  const courseId = course?.id;
  const timezoneCorrection = course?.timezoneCorrection;
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isMakeAnOfferOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMakeAnOfferOpen]);

  const { user } = useUserContext();
  const router = useRouter();

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();
  const [optimisticLike, setOptimisticLike] = useState(isLiked);

  const addToWatchlist = async () => {
    if (!user) {
      void router.push(`/${course?.id}/login`);
      return;
    }
    try {
      await toggleWatchlist.mutateAsync({
        teeTimeId: teeTimeId,
      });
      setOptimisticLike(!optimisticLike);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error adding to watchlist");
      console.log(error);
    }
  };
  const buyTeeTime = () => {
    if (!user) {
      void router.push(`/${course?.id}/login`);

      return;
    }
    if (status === "FIRST_HAND") {
      void router.push(
        `/${course?.id}/checkout?teeTimeId=${teeTimeId}&playerCount=${selectedPlayers}`
      );
    }
    if (status === "SECOND_HAND") {
      void router.push(
        `/${course?.id}/checkout?listingId=${listingId}&playerCount=${selectedPlayers}`
      );
    }
  };

  const makeAnOffer = () => {
    setIsMakeAnOfferOpen(true);
  };

  const href = useMemo(() => {
    if (status === "FIRST_HAND") {
      return `/${courseId}/${teeTimeId}`;
    }
    if (status === "SECOND_HAND") {
      return `/${courseId}/${teeTimeId}/listing/${listingId}`;
    }
    return `/${courseId}/${teeTimeId}/owner/${soldById}`;
  }, [status, listingId, teeTimeId, courseId, soldById]);

  const isSuggested = status === "UNLISTED";

  useEffect(() => {
    if (status !== "FIRST_HAND") {
      setSelectedPlayers(availableSlots.toString());
    }
  }, [status, availableSlots]);

  return (
    <>
      {children}
      <div
        className={`md:rounded-xl rounded-lg bg-secondary-white w-fit ${
          className ?? ""
        }`}
      >
        <div className="border-b border-stroke">
          <div className="flex justify-between py-1 px-3 md:p-3">
            <div className="font-semibold text-[12px] md:text-[16px]">
              {getTime(time, timezoneCorrection)}
            </div>
            {status === "UNLISTED" ? (
              <Hidden className="w-[12px] md:w-[20px]" />
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[10px] md:text-[14px]">
          <div className="flex items-center gap-1">
            <Avatar
              src={soldByImage}
              className="!min-h-[30px] !min-w-[30px] !max-h-[30px] !max-w-[30px] !h-[30px] !w-[30px] md:min-h-[40px] md:min-w-[40px] md:max-h-[40px] md:max-w-[40px] md:h-[40px] md:w-[40px]"
            />

            <div className="whitespace-nowrap md:pr-1">
              {isOwned ? "Owned" : "Sold"} by
            </div>
            {isOwned ? (
              <Link
                href={`/${courseId}/profile/${soldById}`}
                className="text-primary"
              >
                {soldByName}
              </Link>
            ) : (
              <div>{soldByName}</div>
            )}
          </div>
          <div className="flex md:min-h-[31px] items-center gap-2">
            <div className="scale-75 md:scale-100">
              <OutlineClub />
            </div>
            {canChoosePlayer ? (
              <ChoosePlayers
                players={selectedPlayers}
                setPlayers={setSelectedPlayers}
                playersOptions={PlayersOptions}
                availableSlots={availableSlots}
                isDisabled={status === "SECOND_HAND"}
                className="md:px-[1rem] md:py-[.25rem] md:!text-[14px] !text-[10px] px-[.75rem] py-[.1rem]"
              />
            ) : (
              players && (
                <div>
                  {players} golfer{parseInt(players) > 1 ? "s" : ""}
                </div>
              )
            )}
          </div>
          <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
            {isSuggested ? (
              <div className="absolute -top-[.18rem] md:-top-3.5 text-[9px] md:text-[12px] text-primary-gray">
                Suggested
              </div>
            ) : null}
            <div className="flex items-center">
              <div className="text-[15px] md:text-[20px] font-semibold text-secondary-black">
                {isSuggested && firstHandPurchasePrice
                  ? formatMoney((firstHandPurchasePrice * 13) / 10)
                  : formatMoney(price)}
              </div>
              <div className="text-[12px] md:text-[16px] text-primary-gray">
                {" "}
                /golfer
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <OutlineButton
              className="md:px-[.5rem] px-[0.375rem] py-[0.375rem] md:py-2"
              onClick={addToWatchlist}
            >
              <Heart
                className={`w-[13px] md:w-[18px]`}
                fill={optimisticLike ? "#40942A" : undefined}
              />
            </OutlineButton>
            <Link href={href}>
              <OutlineButton className="!py-[.28rem] md:py-1.5">
                Details
              </OutlineButton>
            </Link>
            {soldById === user?.id ? (
              <Link href={`/${course?.id}/my-tee-box`}>
                <FilledButton className="whitespace-nowrap">
                  Manage
                </FilledButton>
              </Link>
            ) : (
              <>
                {isSuggested ? (
                  <FilledButton
                    className="whitespace-nowrap !min-w-[82px] md:min-w-[110px]"
                    onClick={makeAnOffer}
                  >
                    Make an Offer
                  </FilledButton>
                ) : (
                  <FilledButton
                    className="whitespace-nowrap !min-w-[82px] md:min-w-[110px] !py-[.28rem] md:py-1.5"
                    onClick={buyTeeTime}
                  >
                    Buy
                  </FilledButton>
                )}
              </>
            )}
          </div>
        </div>
        {isMakeAnOfferOpen && (
          <MakeAnOffer
            isMakeAnOfferOpen={isMakeAnOfferOpen}
            setIsMakeAnOfferOpen={setIsMakeAnOfferOpen}
            availableSlots={availableSlots}
            courseName={course?.name ?? ""}
            courseImage={course?.logo ?? ""}
            date={time}
            minimumOfferPrice={minimumOfferPrice ?? 0}
            bookingIds={bookingIds ?? []}
          />
        )}
      </div>
    </>
  );
};
