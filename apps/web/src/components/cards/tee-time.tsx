"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import type { BookingGroup, CombinedObject } from "@golf-district/shared";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime, getTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Heart } from "../icons/heart";
import { Hidden } from "../icons/hidden";
import { OutlineClub } from "../icons/outline-club";
import { ChoosePlayers } from "../input/choose-players";
import { ManageTeeTimeListing } from "../my-tee-box-page/manage-tee-time-listing";
import { Tooltip } from "../tooltip";
import { MakeAnOffer } from "../watchlist-page/make-an-offer";

const PlayersOptions = ["1", "2", "3", "4"];
const DEFAULT_SILHOUETTE_IMAGE = "/defaults/default-profile.webp";

export const TeeTime = ({
  time,
  items,
  index,
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
  status = "FIRST_HAND",
  minimumOfferPrice,
  bookingIds,
  listingId,
  firstHandPurchasePrice,
  className,
  showFullDate,
  children,
  listedSlots,
  handleLoading,
  refetch,
}: {
  time: string;
  items: CombinedObject | BookingGroup;
  index: number;
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
  showFullDate?: boolean;
  children?: ReactNode;
  listedSlots?: number | null;
  handleLoading?: (val: boolean) => void;
  refetch?: () => Promise<unknown>;
}) => {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string>(
    status === "UNLISTED" ? "1" : status === "FIRST_HAND" ? "1" : players
  );
  const { course } = useCourseContext();
  const courseId = course?.id;
  const timezoneCorrection = course?.timezoneCorrection;
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);
  const { data: session } = useSession();
  const [isManageOpen, setIsManageOpen] = useState<boolean>(false);
  const { user } = useUserContext();
  const auditLog = api.webhooks.auditLog.useMutation();
  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: teeTimeId ?? "",
      bookingId: "",
      listingId: listingId ?? "",
      courseId,
      eventId: "TEE_TIME_IN_CART",
      json: `TEE_TIME_IN_CART `,
    });
  };

  const tooltipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [showTooltip, setShowTooltip] = useState<boolean[]>([]);

  useEffect(() => {
    const isTextTruncated = (ref: HTMLSpanElement | null) => {
      if (ref) {
        return ref.scrollWidth > ref.clientWidth;
      }
      return false;
    };

    setShowTooltip(tooltipRefs.current.map(isTextTruncated));
  }, [items]);

  useEffect(() => {
    if (isMakeAnOfferOpen || isManageOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMakeAnOfferOpen, isManageOpen]);
  const router = useRouter();
  const { setPrevPath } = useAppContext();

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();
  const [optimisticLike, setOptimisticLike] = useState(isLiked);
  // const { refetch: refetchCheckTeeTime } =
  //   api.teeBox.checkIfTeeTimeStillListed.useQuery(
  //     {
  //       bookingId: bookingIds[0] || "",
  //     },
  //     {
  //       enabled: false,
  //     }
  //   );

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
  const buyTeeTime = async () => {
    // const isTeeTimeAvailable = await refetchCheckTeeTime();
    // console.log("isTeeTimeAvailable");
    // console.log(isTeeTimeAvailable);

    // if (!isTeeTimeAvailable.data && status === "SECOND_HAND") {
    //   toast.error("Oops! Tee time is not available anymore");
    //   return;
    // }
    await logAudit();

    if (handleLoading) {
      handleLoading(true);
    }

    if (!user || !session) {
      if (status === "FIRST_HAND") {
        setPrevPath({
          path: `/${course?.id}/checkout?teeTimeId=${teeTimeId}&playerCount=${selectedPlayers}`,
          createdAt: new Date().toISOString(),
        });
      }
      if (status === "SECOND_HAND") {
        setPrevPath({
          path: `/${course?.id}/checkout?listingId=${listingId}&playerCount=${listedSlots}`,
          createdAt: new Date().toISOString(),
        });
      }
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
        `/${course?.id}/checkout?listingId=${listingId}&playerCount=${listedSlots}`
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

  const share = async () => {
    const currentUrl = window.location.host;
    if (navigator?.share) {
      await navigator.share({ url: `${currentUrl}${href}` });
    } else {
      await copyToClipboard(`${currentUrl}${href}`);
    }
  };

  const copyToClipboard = async (url: string) => {
    await copy(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  useEffect(() => {
    // if (status === "SECOND_HAND") {
    //   setSelectedPlayers(isOwned ? players : availableSlots.toString());
    // }
  }, [status, availableSlots]);

  const openManage = () => {
    if (status === "UNLISTED") {
      router.push(`/${courseId}/my-tee-box`);
      return;
    }
    router.push(`/${courseId}/my-tee-box`);
    // setIsManageOpen(true);
  };

  return (
    <>
      {children}
      <div
        data-testid="tee-time-id"
        data-test={
          status === "SECOND_HAND" ? "secondary_listed" : "primary_listed"
        }
        className={`md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[230px] md:min-w-[265px] ${
          className ?? ""
        }`}
      >
        <div className="border-b border-stroke">
          <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
            <div className="font-semibold text-[12px] md:text-[16px]">
              {showFullDate
                ? formatTime(time, true, timezoneCorrection)
                : getTime(time, timezoneCorrection)}
            </div>
            <div className="flex gap-2">
              {status === "UNLISTED" ? (
                <Hidden className="w-[12px] md:w-[20px]" />
              ) : null}
              <Tooltip
                trigger={
                  <Avatar
                    src={
                      status === "SECOND_HAND"
                        ? DEFAULT_SILHOUETTE_IMAGE
                        : soldByImage
                    }
                    className="!min-h-[24px] !min-w-[24px] max-h-[24px] max-w-[24px] h-[24px] w-[24px] md:min-h-[30px] md:min-w-[30px] md:max-h-[30px] md:max-w-[30px] md:h-[30px] md:w-[30px]"
                  />
                }
                content={
                  "Sold by " +
                  (status === "SECOND_HAND"
                    ? "another Golf District golfer."
                    : soldByName)
                }
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[10px] md:text-[14px]">
          {/* <div className="flex items-center gap-1">
            <Avatar
              src={soldByImage}
              className="!min-h-[30px] !min-w-[30px] !max-h-[30px] !max-w-[30px] !h-[30px] !w-[30px] md:min-h-[40px] md:min-w-[40px] md:max-h-[40px] md:max-w-[40px] md:h-[40px] md:w-[40px]"
            />
            <div className="flex flex-col">
              <div className="whitespace-nowrap md:pr-1">
                {status === "UNLISTED" ? "Owned" : "Sold"} by
              </div>
              {isOwned || status === "SECOND_HAND" ? (
                <Tooltip
                  isDisabled={showTooltip[index] ? false : true}
                  trigger={
                    // <div className="text-left text-primary whitespace-nowrap overflow-hidden w-[230px] md:w-[200px] text-ellipsis">
                    //   <Link
                    //     href={`/${courseId}/profile/${soldById}`}
                    //     data-testid="sold-by-name-id"
                    //   >
                    <div
                      ref={(el) => (tooltipRefs.current[index] = el)}
                      className="text-left whitespace-nowrap overflow-hidden w-[230px] md:w-[200px] text-ellipsis"
                    >
                      {soldByName}
                    </div>
                    //   </Link>
                    // </div>
                  }
                  content={soldByName}
                />
              ) : (
                <Tooltip
                  isDisabled={showTooltip[index] ? false : true}
                  trigger={
                    <div
                      ref={(el) => (tooltipRefs.current[index] = el)}
                      className="text-left whitespace-nowrap overflow-hidden w-[230px] md:w-[200px] text-ellipsis"
                    >
                      {soldByName}
                    </div>
                  }
                  content={soldByName}
                />
              )}
            </div>
          </div> */}
          <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
            {isSuggested ? (
              <div className="absolute -top-[.18rem] md:-top-3.5 text-[9px] md:text-[12px] text-primary-gray">
                Suggested
              </div>
            ) : null}
            <div className="flex items-center">
              <div className="text-[15px] md:text-[20px] font-semibold text-secondary-black">
                {formatMoney(price)}
              </div>
              <div className="text-[12px] md:text-[14px] text-primary-gray">
                {" "}
                /golfer
              </div>
            </div>
          </div>
          <div className="flex md:min-h-[31px] items-center gap-2">
            <div className="scale-75 md:scale-100">
              <OutlineClub />
            </div>

            {canChoosePlayer ? (
              <ChoosePlayers
                players={
                  status === "SECOND_HAND" ? `${listedSlots}` : selectedPlayers
                }
                setPlayers={setSelectedPlayers}
                playersOptions={PlayersOptions}
                availableSlots={
                  status === "SECOND_HAND" ? listedSlots || 0 : availableSlots
                }
                isDisabled={status === "SECOND_HAND"}
                className="md:px-[1rem] md:py-[.25rem] md:!text-[14px] !text-[10px] px-[.75rem] py-[.1rem]"
                teeTimeId={teeTimeId}
              />
            ) : (
              players && (
                <div>
                  {players} golfer{parseInt(players) > 1 ? "s" : ""}
                </div>
              )
            )}
          </div>

          {soldById === user?.id && session ? (
            <FilledButton
              onClick={openManage}
              className="whitespace-nowrap"
              data-testid="sell-button-id"
              data-test={teeTimeId}
              data-qa="Buy"
              data-cy={time}
            >
              {status === "UNLISTED" ? "Sell" : "Manage"}
            </FilledButton>
          ) : (
            <>
              {isSuggested ? (
                <FilledButton
                  className="whitespace-nowrap !px-3 !min-w-[82px] md:min-w-[110px]"
                  onClick={makeAnOffer}
                  data-testid="make-an-offer-id"
                  data-test={teeTimeId}
                  data-qa="Make an Offer"
                  data-cy={time}
                >
                  Make an Offer
                </FilledButton>
              ) : (
                <FilledButton
                  className="whitespace-nowrap !min-w-[82px] md:min-w-[110px] !py-[.28rem] md:py-1.5"
                  onClick={buyTeeTime}
                  data-testid="buy-tee-time-id"
                  data-test={teeTimeId}
                  data-qa="Buy"
                  data-cy={time}
                >
                  Buy
                </FilledButton>
              )}
            </>
          )}
          <div className="flex items-center gap-1">
            {course?.supportsWatchlist ? (
              <OutlineButton
                className="md:px-[.5rem] px-[0.375rem] py-[0.375rem] md:py-2"
                onClick={addToWatchlist}
                data-testid="watch-list-id"
                data-test={teeTimeId}
                data-qa={optimisticLike}
              >
                <Heart
                  className={`w-[13px] md:w-[18px]`}
                  fill={optimisticLike ? "#40942A" : undefined}
                />
              </OutlineButton>
            ) : null}

            <Link
              href={href}
              data-testid="details-button-id"
              data-test={teeTimeId}
              data-qa={"Details"}
              data-cy={time}
            >
              <OutlineButton className="!py-[.28rem] md:py-1.5">
                Details
              </OutlineButton>
            </Link>
            <OutlineButton
              onClick={() => void share()}
              className="w-full whitespace-nowrap"
              data-testid="share-button-id"
            >
              <div className="flex items-center justify-center gap-2">
                {isCopied ? <>Copied</> : <>Share</>}
              </div>
            </OutlineButton>
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
            minimumOfferPrice={
              minimumOfferPrice ?? firstHandPurchasePrice ?? price
            }
            bookingIds={bookingIds ?? []}
          />
        )}
        {isManageOpen && (
          <ManageTeeTimeListing
            isManageTeeTimeListingOpen={isManageOpen}
            setIsManageTeeTimeListingOpen={setIsManageOpen}
            selectedTeeTime={{
              listingId: listingId ?? "",
              courseName: course?.name ?? "",
              courseLogo: course?.logo ?? "",
              courseId: courseId ?? "",
              date: time,
              firstHandPrice: firstHandPurchasePrice ?? 0,
              miniumOfferPrice: minimumOfferPrice ?? 0,
              listPrice: price,
              status: status,
              listedSpots: Array.from({ length: availableSlots }).fill(
                "golfer"
              ) as string[],
              teeTimeId: teeTimeId,
              listedSlotsCount: listedSlots ?? 1,
            }}
            refetch={refetch}
          />
        )}
      </div>
    </>
  );
};
