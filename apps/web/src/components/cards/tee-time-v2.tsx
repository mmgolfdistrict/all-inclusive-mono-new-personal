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

const PlayersOptions = ["1", "2", "3", "4"];

export const TeeTimeV2 = ({
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
    allowSplit
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
    allowSplit: boolean;
}) => {
    const [, copy] = useCopyToClipboard();
    const { entity } = useAppContext();
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const { course, getAllowedPlayersForTeeTime } = useCourseContext();
    const courseId = course?.id;
    const allowedPlayers = useMemo(() => getAllowedPlayersForTeeTime(
        items.time,
        items.date,
        availableSlots
    ), [
        items.time,
        items.date,
        availableSlots,
        course
    ]);

    const [selectedPlayers, setSelectedPlayers] = useState<string>("");

    const numberOfPlayers = allowedPlayers?.numberOfPlayers;
    useEffect(() => {
        if (numberOfPlayers?.length !== 0 && numberOfPlayers?.[0] && (status === "UNLISTED" || status === "FIRST_HAND")) {
            setSelectedPlayers(String(numberOfPlayers[0]));
        } else if (allowedPlayers?.selectStatus === "ALL_PLAYERS" && (status === "UNLISTED" || status === "FIRST_HAND")) {
            setSelectedPlayers(String(availableSlots));
        } else {
            setSelectedPlayers(
                status === "UNLISTED" || status === "FIRST_HAND" ? "1" : listedSlots?.toString() ?? players
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
    const getCache = api.cache.getCache.useMutation();
    const { refetch: refetchStillListed } = api.teeBox.checkIfTeeTimeStillListedByListingId.useQuery({
        listingId: listingId ?? "",
    })
    const groupBookingParams = useMemo(() => {
        return `date=${items.date?.split("T")[0]}&time=${items.time}`
    }, [items]);

    const shouldShowGroupBookingButton = useMemo(() => {
        if (course?.groupStartTime && course?.groupEndTime && items.time) {
            return (items.time >= course?.groupStartTime && items.time <= course?.groupEndTime) ? true : false
        } else {
            return true
        }
    }, [items]);

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
                    path: `/${course?.id}/checkout?listingId=${listingId}&playerCount=${selectedPlayers}`,
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
            const stillListed = await refetchStillListed();
            if (!stillListed.data) {
                toast.info("The tee time is no longer available, please refresh your screen.");
                if (handleLoading) {
                    handleLoading(false);
                }
                return;
            }
            const value = await getCache.mutateAsync({
                key: `listing_id_${listingId}`,
            }) as string | null;
            if (value && allowSplit) {
                const { userId } = JSON.parse(value);
                if (userId !== user.id) {
                    toast.info("The tee time is currently unavailable. Please check back in 20 mins.");
                    if (handleLoading) {
                        handleLoading(false);
                    }
                    return;
                }
            }
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
        router.push(`/${courseId}/my-tee-box?section=my-listed-tee-times&listId=${listingId}`);
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
                className={`md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[14.375rem] md:min-w-[16.5625rem] w-full ${className ?? ""}`}
            >
                <div className="border-b border-stroke">
                    <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
                        <div className="font-semibold text-lg md:text-xl unmask-time">
                            {showFullDate
                                ? formatTime(time, true, timezoneCorrection)
                                : getTime(time, timezoneCorrection)}
                        </div>
                        <div className="flex gap-2">
                            {status === "UNLISTED" ? (
                                <Hidden className="w-[0.75rem] md:w-[1.25rem]" />
                            ) : null}
                            <Tooltip
                                trigger={
                                    status === "SECOND_HAND" ? (
                                        <Spinner className="w-[2.5rem] h-[2.5rem]" />
                                    ) : (
                                        <Avatar
                                            src={soldByImage}
                                            className="!min-h-[2.5rem] !min-w-[5rem] max-h-[2.5rem] max-w-[5rem] h-[2.5rem] w-[5rem] md:min-h-[2.5rem] md:min-w-[5rem] md:max-h-[2.5rem] md:max-w-[5rem] md:h-[2.5rem] md:w-[5rem] lg:w-[5rem] lg:h-[2.5rem]"
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
                <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[0.625rem] md:text-[0.875rem]">

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
                            {isSuggested ? (
                                <div className="absolute -top-[.18rem] md:-top-3.5 text-[0.5625rem] md:text-[0.75rem] text-primary-gray">
                                    Suggested
                                </div>
                            ) : null}
                            <div className="flex items-center">
                                <div className="text-base md:text-base font-semibold text-secondary-black">
                                    {formatMoney(price)}
                                </div>
                                <div className="text-[0.75rem] md:text-[0.875rem] text-primary-gray">
                                    {" "}
                                    /golfer
                                </div>
                            </div>
                        </div>
                        <div className="flex md:min-h-[1.9375rem] items-center gap-2">
                            <div className="hidden xs:block scale-75 md:scale-100">
                                <OutlineClub />
                            </div>

                            {canChoosePlayer ? (
                                <ChoosePlayers
                                    id="choose-players"
                                    players={selectedPlayers}
                                    setPlayers={setSelectedPlayers}
                                    playersOptions={PlayersOptions}
                                    availableSlots={
                                        status === "SECOND_HAND" ? listedSlots || 0 : availableSlots
                                    }
                                    isDisabled={
                                        (status === "SECOND_HAND" && !allowSplit) ||
                                        allowedPlayers?.selectStatus === "ALL_PLAYERS"
                                    }
                                    className="md:px-[1rem] md:py-[.25rem] md:!text-[0.875rem] !text-[0.625rem] py-[.1rem]"
                                    teeTimeId={teeTimeId}
                                    numberOfPlayers={numberOfPlayers ? (
                                        !(status === "SECOND_HAND") ? numberOfPlayers : PlayersOptions.filter(player => player <= (listedSlots?.toString() ?? "0"))
                                    ) : []}
                                    status={status}
                                    supportsGroupBooking={shouldShowGroupBookingButton ? course?.supportsGroupBooking : false}
                                    allowSplit={allowSplit}
                                    groupBookingParams={groupBookingParams}
                                />
                            ) : (
                                players && (
                                    <div>
                                        {players} golfer{parseInt(players) > 1 ? "s" : ""}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-6">

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
                                        className={`w-[0.8125rem] md:w-[1.125rem]`}
                                        fill={optimisticLike ? entity?.color1 : undefined}
                                        stroke={entity?.color1}
                                    />
                                </OutlineButton>
                            ) : null}

                            {/* <Link
                                href={href}
                                data-testid="details-button-id"
                                data-test={teeTimeId}
                                data-qa={"Details"}
                                data-cy={time}
                            >
                                <OutlineButton className="!py-[.28rem] md:py-1.5">
                                    Details
                                </OutlineButton>
                            </Link> */}
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
                                        className="whitespace-nowrap !px-3 !min-w-[5.125rem] md:min-w-[6.875rem]"
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
                                        className="whitespace-nowrap !min-w-[5.125rem] md:min-w-[6.875rem] !py-[.28rem] md:py-1.5 w-full"
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
                            totalMerchandiseAmount: 0
                        }}
                        refetch={refetch}
                    />
                )}
            </div>
        </>
    );
};
