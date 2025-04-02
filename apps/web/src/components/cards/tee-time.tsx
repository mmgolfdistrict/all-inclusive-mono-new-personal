"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import type { BookingGroup, CombinedObject } from "@golf-district/shared";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime, getTime } from "~/utils/formatters";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import { microsoftClarityEvent } from "~/utils/microsoftClarityUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Heart } from "../icons/heart";
import { Hidden } from "../icons/hidden";
import { OutlineClub } from "../icons/outline-club";
import { ChoosePlayers } from "../input/choose-players";
import { Spinner } from "../loading/spinner";
import { ManageTeeTimeListing } from "../my-tee-box-page/manage-tee-time-listing";
import { Tooltip } from "../tooltip";
import { MakeAnOffer } from "../watchlist-page/make-an-offer";
import { Share } from "../icons/share";

const PlayersOptions = ["1", "2", "3", "4"];

export const TeeTime = ({
  time,
  items,
  canChoosePlayer,
  players,
  price,
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
  groupId,
  desktopV2
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
  groupId?: string;
  desktopV2?: boolean
}) => {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { course } = useCourseContext();
  const courseId = course?.id;
  const { data: allowedPlayers } =
    api.course.getNumberOfPlayersByCourse.useQuery({
      courseId: courseId ?? "",
      time: items.time ?? "",
      date: items.date ?? "",
      availableSlots: availableSlots,
    });

  const [selectedPlayers, setSelectedPlayers] = useState<string>("");

  const numberOfPlayers = allowedPlayers?.numberOfPlayers;
  useEffect(() => {
    if (numberOfPlayers?.length !== 0 && numberOfPlayers?.[0]) {
      setSelectedPlayers(String(numberOfPlayers[0]));
    } else if (allowedPlayers?.selectStatus === "ALL_PLAYERS") {
      setSelectedPlayers(String(availableSlots));
    } else {
      setSelectedPlayers(
        status === "UNLISTED" || status === "FIRST_HAND" ? "1" : players
      );
    }
  }, [
    allowedPlayers,
    courseId,
    items.time,
    items.date,
    status,
    availableSlots,
    players,
  ]);

  const timezoneCorrection = course?.timezoneCorrection;
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);
  const { data: session } = useSession();
  const [isManageOpen, setIsManageOpen] = useState<boolean>(false);
  const { user } = useUserContext();
  const router = useRouter();
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

  useEffect(() => {
    (ref: HTMLSpanElement | null) => {
      if (ref) {
        return ref.scrollWidth > ref.clientWidth;
      }
      return false;
    };
  }, [items]);

  useEffect(() => {
    if (isMakeAnOfferOpen || isManageOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMakeAnOfferOpen, isManageOpen]);
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
    }
  };
  const fullUrl = window.location.href;
  const url = new URL(fullUrl);
  const pathname = url.pathname;

  const buyTeeTime = async () => {
    // const isTeeTimeAvailable = await refetchCheckTeeTime();
    // if (!isTeeTimeAvailable.data && status === "SECOND_HAND") {
    //   toast.error("Oops! Tee time is not available anymore");
    //   return;
    // }
    await logAudit();
    microsoftClarityEvent({
      action: `CLICKED ON BUY`,
      category: "BUY TEE TIME",
      label: "user clicked on buy to purchase tee time",
      value: pathname,
    });
    googleAnalyticsEvent({
      action: `CLICKED ON BUY`,
      category: "TEE TIME ",
      label: "user clicked on buy to purchase tee time",
      value: "",
    });

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
      await navigator.share({ url: `${href}` });
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
        className={`md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[230px] ${desktopV2 ? 'md:min-w-[220px]' : "md:min-w-[265px]"} ${className ?? ""
          }`}
      >
        <div className="border-b border-stroke">
          <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
            <div className="font-semibold text-[16px] md:text-[20px] unmask-time">
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
                  status === "SECOND_HAND" ? (
                    <Spinner className="w-[40px] h-[40px]" />
                  ) : (
                    <Avatar
                      src={soldByImage}
                      className="!min-h-[40px] !min-w-[80px] max-h-[40px] max-w-[80px] h-[40px] w-[80px] md:min-h-[40px] md:min-w-[80px] md:max-h-[40px] md:max-w-[80px] md:h-[40px] md:w-[80px] lg:w-[80px] lg:h-[40px]"
                      isRounded={false}
                    />
                  )
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
        <div className={`flex flex-col gap-1 ${desktopV2 ? 'md:gap-2' :'md:gap-4' }  p-2 md:p-3 text-[10px] md:text-[14px]`}>
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
              <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black">
                {formatMoney(price)}
              </div>
              <div className="text-[12px] md:text-[14px] text-primary-gray">
                {" "}
                /golfer
              </div>
            </div>
          </div>
          <div className={`flex md:min-h-[31px] items-center ${desktopV2 ? 'gap-1' : 'gap-2'}`}>
            <div className="scale-75 md:scale-100">
              <OutlineClub />
            </div>

            {canChoosePlayer ? (
              <ChoosePlayers
                id="choose-players"
                players={
                  status === "SECOND_HAND" ? `${listedSlots}` : selectedPlayers
                }
                setPlayers={setSelectedPlayers}
                playersOptions={PlayersOptions}
                availableSlots={
                  status === "SECOND_HAND" ? listedSlots || 0 : availableSlots
                }
                isDisabled={
                  status === "SECOND_HAND" ||
                  allowedPlayers?.selectStatus === "ALL_PLAYERS"
                }
                className={`${desktopV2 ? 'md:px-[.88rem]' : 'md:px-[1rem]'} md:py-[.25rem] md:!text-[14px] !text-[10px] px-[.75rem] py-[.1rem]`}
                teeTimeId={teeTimeId}
                numberOfPlayers={numberOfPlayers ? numberOfPlayers : []}
                status={status}
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
                  id="buy-button"
                >
                  Buy
                </FilledButton>
              )}
            </>
          )}
          <div className={`flex items-center ${desktopV2 ? 'gap-2' : 'gap-1'}`}>
            {course?.supportsWatchlist ? (
              <div id="add-to-watchlist">
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
              </div>
            ) : null}
            {desktopV2 && <div id="share-tee-time-button">
              <OutlineButton
                onClick={() => void share()}
                className="md:px-[.5rem] px-[0.375rem] py-[0.375rem] md:py-2"
                data-testid="share-button-id"
              >
                <Share />
              </OutlineButton>
            </div>}

            <Link
              href={href}
              data-testid="details-button-id"
              data-test={teeTimeId}
              data-qa={"Details"}
              data-cy={time}
              id="tee-time-details-button"
            >
              <OutlineButton className="!py-[.28rem] md:py-1.5">
                Details
              </OutlineButton>
            </Link>
            {!desktopV2 && <div id="share-tee-time-button">
              <OutlineButton
                onClick={() => void share()}
                className="w-full whitespace-nowrap"
                data-testid="share-button-id"
              >
                <div className="flex items-center justify-center gap-2">
                  {isCopied ? <>Copied</> : <>Share</>}
                </div>
              </OutlineButton>
            </div>}
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
              groupId: groupId ?? "",
            }}
            refetch={refetch}
          />
        )}
      </div>
    </>
  );
};
