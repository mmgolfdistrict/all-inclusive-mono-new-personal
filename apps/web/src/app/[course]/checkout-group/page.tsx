"use client";

import type {
    SearchObject
} from "@golf-district/shared";
import {
    formatDate,
    formatQueryDate,
    removeTimeZoneOffset,
} from "@golf-district/shared";
import { HyperSwitch } from "~/components/checkout-page/hyper-switch";
import { OrderSummary } from "~/components/checkout-page/order-summary";
import { Spinner } from "~/components/loading/spinner";
import { CheckoutBreadcumbs } from "~/components/nav/checkout-breadcrumbs";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, getPromoCodePrice, getTime } from "~/utils/formatters";
import type {
    AdvancedBookingFees,
    AuctionProduct,
    CartFeeMetaData,
    CartProduct,
    CharityProduct,
    ConvenienceFeeProduct,
    FirstHandGroupProduct,
    FirstHandProduct,
    MarkupProduct,
    MerchandiseProduct,
    MerchandiseTaxPercentMetaData,
    MerchandiseWithTaxOverride,
    Offer,
    SecondHandProduct,
    SensibleProduct,
    TaxProduct,
} from "~/utils/types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
const currentDate = formatQueryDate(new Date());
const DEFAULT_TEE_TIME_EXPIRATION_TIME = 30;

export default function CheckoutGroupBooking({
    params,
    searchParams,
}: {
    params: { course: string };
    searchParams: Record<string, string | undefined>;
}) {
    const courseId = params.course;
    const teeTimeIds = (searchParams?.teeTimeIds ?? "") as string | undefined;
    const teeTimeIdsArray = teeTimeIds?.split(",");
    const playerCount = searchParams?.playerCount;

    const { course } = useCourseContext();
    const timezoneCorrection = course?.timezoneCorrection;

    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [hasErrorOccured, setHasErrorOccured] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {
        shouldAddSensible,
        sensibleData,
        amountOfPlayers,
        promoCode,
        selectedCharity,
        selectedCharityAmount,
        setAmountOfPlayers,
        validatePlayers,
        merchandiseData
    } = useCheckoutContext();

    const { data: maxReservation } =
        api.checkout.checkMaxReservationsAndMaxRounds.useQuery({
            roundsToBook: amountOfPlayers,
            courseId: courseId,
        });
    const { data: privacyPolicyAndTCByCourseUrl } =
        api.course.getPrivacyPolicyAndTCByCourse.useQuery({
            courseId: courseId ?? "",
        });

    const {
        data: teeTimeData,
        isLoading: isLoadingTeeTime,
        isError: isErrorTeeTime,
    } = api.searchRouter.getTeeTimesByIds.useQuery(
        { teeTimeIds: teeTimeIdsArray ?? [], playerCount: amountOfPlayers },
        { enabled: teeTimeIdsArray !== undefined && amountOfPlayers > 0 }
    );

    const firstTeeTime = useMemo(() => {
        if (teeTimeData?.length) {
            return teeTimeData[0]
        }
    }, [teeTimeData])

    const teeTimesSelectedForBooking = useMemo(() => {
        const playerCount = amountOfPlayers;
        if (teeTimeData?.length) {
            const teeTimes = [] as typeof teeTimeData;

            for (const teeTime of teeTimeData) {
                if (playerCount >= 0) {
                    teeTimes.push(teeTime);
                }
            }
            return teeTimes;
        }
    }, [teeTimeData]);

    const allocatePlayersAcrossTeeTimes = (group: SearchObject[], totalPlayers: number): { label: string; count: number }[] => {
        const teeTimesSorted = group.sort((a, b) => a.time - b.time);

        let remaining = totalPlayers;
        const allocations: { label: string; count: number }[] = [];

        for (const t of teeTimesSorted) {
            if (remaining <= 0) break;
            const capacity = Math.max(0, t.availableSlots);
            const count = Math.min(remaining, capacity);
            if (count > 0) {
                allocations.push({ label: getTime(t.date, timezoneCorrection), count });
                remaining -= count;
            }
        }

        return allocations;
    };

    const getPlayersPerSlotLabelFull = (group: SearchObject[], totalPlayers: number): string => {
        const allocations = allocatePlayersAcrossTeeTimes(group, totalPlayers);
        const parts = allocations.map((a) => `${a.label} (${a.count})`.replace(/ /g, "\u00A0"));
        return parts.join(" • ");
    };

    let isError = isErrorTeeTime, error;

    if (!isLoadingTeeTime && !teeTimeData && !error) {
        isError = true;
        error = new Error("Expected Tee time spots may not be available anymore");
    }

    const saleType = teeTimeIds ? "first_hand" : "second_hand";

    const teeTimeDate = formatQueryDate(new Date(firstTeeTime?.date ?? ""));

    const isSensibleInvalid = teeTimeDate === currentDate;

    const validatePromoCode = api.checkout.validatePromoCode.useMutation();
    const debouncedPromoCode = useDebounce(promoCode, 500);
    const deboundCharityAmount = useDebounce(selectedCharityAmount, 500);

    const [promoCodePrice, setPromoCodePrice] = useState<number | undefined>(
        undefined
    );

    const checkPromoCode = async () => {
        const currentPrice = Number(firstTeeTime?.pricePerGolferForGroup) * amountOfPlayers;
        try {
            const promoData = await validatePromoCode.mutateAsync({
                promoCode: debouncedPromoCode,
                courseId: courseId,
            });
            const ratedPrice = getPromoCodePrice(
                currentPrice,
                promoData.discount,
                promoData.type
            );
            setPromoCodePrice(ratedPrice);
        } catch (error) {
            console.log("error", error);
        }
    };

    useEffect(() => {
        if (debouncedPromoCode) {
            void checkPromoCode();
        }
    }, [debouncedPromoCode]);

    const startHourNumber = dayjs(removeTimeZoneOffset(firstTeeTime?.date)).hour();
    const endHourNumber = dayjs(removeTimeZoneOffset(firstTeeTime?.date))
        .add(6, "hours")
        .hour();

    const cartData: CartProduct[] = useMemo(() => {
        if (!teeTimesSelectedForBooking || teeTimesSelectedForBooking === null || !firstTeeTime) return [];

        const metadata:
            | FirstHandProduct
            | SecondHandProduct
            | SensibleProduct
            | AuctionProduct
            | CharityProduct
            | Offer
            | MarkupProduct
            | ConvenienceFeeProduct
            | TaxProduct
            | CartFeeMetaData
            | FirstHandGroupProduct
            | MerchandiseProduct
            | MerchandiseTaxPercentMetaData
            | MerchandiseWithTaxOverride
            | AdvancedBookingFees
            = {
            type: "first_hand_group",
            tee_time_ids: teeTimesSelectedForBooking.map((teeTime) => teeTime.teeTimeId),
            number_of_bookings: amountOfPlayers - validatePlayers.length,
            min_players_per_booking: 4,
        };
        const localCart: CartProduct[] = [
            {
                name: "Golf District Tee Time",
                id: "",
                price:
                    (() => {
                        const calculatedPrice =
                            debouncedPromoCode && promoCodePrice !== undefined
                                ? promoCodePrice * 100
                                : (Number(firstTeeTime?.pricePerGolferForGroup) * 100) * (amountOfPlayers - validatePlayers.length);

                        return calculatedPrice === 0 ? 1 : calculatedPrice; // If price is 0, return 1
                    })(), //int
                image: "", //
                currency: "USD", //USD
                display_price:
                    debouncedPromoCode && promoCodePrice !== undefined
                        ? formatMoney(promoCodePrice)
                        : formatMoney(Number(firstTeeTime?.pricePerGolferForGroup) * amountOfPlayers),
                product_data: {
                    metadata: { ...metadata },
                },
            },
        ];

        if (firstTeeTime?.cartFee) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: firstTeeTime.cartFeesForGroup, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    ((firstTeeTime.greenFeeTaxPerPlayer ?? 0) +
                        (firstTeeTime.cartFeeTaxPerPlayer ?? 0)) *
                    amountOfPlayers
                ),
                product_data: {
                    metadata: {
                        type: "cart_fee",
                        amount: firstTeeTime.cartFee,
                    },
                },
            });
        } else {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    ((firstTeeTime.greenFeeTaxPerPlayer ?? 0) +
                        (firstTeeTime.cartFeeTaxPerPlayer ?? 0)) *
                    amountOfPlayers
                ),
                product_data: {
                    metadata: {
                        type: "cart_fee",
                        amount: 0,
                    },
                },
            });
        }
        if (teeTimesSelectedForBooking) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price:
                    ((firstTeeTime.greenFeeTaxPerPlayer ?? 0) +
                        (firstTeeTime.cartFeeTaxPerPlayer ?? 0)) *
                    amountOfPlayers, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    ((firstTeeTime.greenFeeTaxPerPlayer ?? 0) +
                        (firstTeeTime.cartFeeTaxPerPlayer ?? 0)) *
                    amountOfPlayers
                ),
                product_data: {
                    metadata: {
                        type: "taxes",
                    },
                },
            });
        }

        if (course?.convenienceFeesFixedPerPlayer) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: course?.convenienceFeesFixedPerPlayer * amountOfPlayers || 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    (course?.convenienceFeesFixedPerPlayer
                        ? course?.convenienceFeesFixedPerPlayer / 100
                        : 0) * amountOfPlayers
                ),
                product_data: {
                    metadata: {
                        type: "convenience_fee",
                    },
                },
            });
        }

        if (course?.markupFeesFixedPerPlayer) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: firstTeeTime?.markupFees ?? 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    firstTeeTime?.markupFees
                        ? firstTeeTime?.markupFees / 100
                        : 0
                ),
                product_data: {
                    metadata: {
                        type: "markup",
                    },
                },
            });
        }
        if (shouldAddSensible && !isSensibleInvalid) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: (sensibleData?.price ?? 0) * 100, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(sensibleData?.price ?? 0),
                product_data: {
                    metadata: {
                        type: "sensible",
                        sensible_quote_id: sensibleData?.id,
                    },
                },
            });
        }
        if (
            (selectedCharity || course?.roundUpCharityId) &&
            deboundCharityAmount &&
            deboundCharityAmount > 0
        ) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: deboundCharityAmount * 100, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(deboundCharityAmount),
                product_data: {
                    metadata: {
                        type: "charity",
                        charity_id:
                            selectedCharity?.charityId ?? course?.roundUpCharityId ?? "",
                        donation_amount: deboundCharityAmount * 100,
                    },
                },
            });
        }

        if (saleType === "first_hand") {
            localCart.push({
                name: "green fee tax percent",
                id: teeTimeIds ?? "",
                price: firstTeeTime.greenFeeTaxPercent || 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(firstTeeTime.greenFeeTaxPercent || 0),
                product_data: {
                    metadata: {
                        type: "greenFeeTaxPercent",
                    },
                },
            });
            localCart.push({
                name: "cart fee tax percent",
                id: teeTimeIds ?? "",
                price: firstTeeTime.cartFeeTaxPercent || 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(firstTeeTime.cartFeeTaxPercent || 0),
                product_data: {
                    metadata: {
                        type: "cartFeeTaxPercent",
                        amount: firstTeeTime.cartFeeTaxPercent || 0,
                    },
                },
            });
            localCart.push({
                name: "weather guarantee tax percent",
                id: teeTimeIds ?? "",
                price: firstTeeTime.weatherGuaranteeTaxPercent || 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(
                    firstTeeTime.weatherGuaranteeTaxPercent || 0
                ),
                product_data: {
                    metadata: {
                        type: "weatherGuaranteeTaxPercent",
                    },
                },
            });
            localCart.push({
                name: "markup tax percent",
                id: teeTimeIds ?? "",
                price: firstTeeTime.markupTaxPercent || 0, //int
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(firstTeeTime.markupTaxPercent || 0),
                product_data: {
                    metadata: {
                        type: "markupTaxPercent",
                    },
                },
            });
            localCart.push({
                name: "merchandise fee tax percent",
                id: teeTimeIds ?? "",
                price: firstTeeTime?.merchandiseTaxPercent || 0,
                image: "", //
                currency: "USD", //USD
                display_price: formatMoney(firstTeeTime?.merchandiseTaxPercent || 0),
                product_data: {
                    metadata: {
                        type: "merchandiseTaxPercent",
                    },
                },
            });
        }

        if (course?.supportsSellingMerchandise) {
            const merchandiseWithoutTaxes: typeof merchandiseData = [];
            const merchandiseWithTaxes: typeof merchandiseData = [];

            const totalPrice = merchandiseData.reduce((totalPrice, item) => {
                if (!item.merchandiseTaxPercent) {
                    merchandiseWithoutTaxes.push(item);
                    return totalPrice + (item.price * item.qty);
                } else {
                    return totalPrice;
                }
            }, 0)
            const totalPriceForTaxOverrides = merchandiseData.reduce((totalPrice, item) => {
                if (item.merchandiseTaxPercent) {
                    merchandiseWithTaxes.push(item);
                    const merchandisePrice = item.price * item.qty;
                    return totalPrice + merchandisePrice;
                } else {
                    return totalPrice;
                }
            }, 0);
            const totalPriceTaxForTaxOverrides = merchandiseData.reduce((totalPrice, item) => {
                if (item.merchandiseTaxPercent) {
                    const merchandisePrice = item.price * item.qty;
                    const taxAmount = Number(merchandisePrice * ((item.merchandiseTaxPercent / 100) / 100));
                    return totalPrice + taxAmount;
                } else {
                    return totalPrice;
                }
            }, 0);

            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: totalPrice,
                image: "",
                currency: "USD", //USD
                display_price: formatMoney(totalPrice / 100),
                product_data: {
                    metadata: {
                        type: "merchandise",
                        merchandiseItems: merchandiseWithoutTaxes.map((item) => ({
                            id: item.id,
                            qty: item.qty,
                            pricePerItem: item.price,
                            taxAmountPerItem: Number(item.price * (((firstTeeTime?.merchandiseTaxPercent ?? 0) / 100) / 100)),
                        }))
                    },
                },
            });

            if (merchandiseWithTaxes.length) {
                localCart.push({
                    name: "Golf District Tee Time",
                    id: teeTimeIds ?? "",
                    price: totalPriceForTaxOverrides + totalPriceTaxForTaxOverrides,
                    image: "",
                    currency: "USD", //USD
                    display_price: formatMoney((totalPriceForTaxOverrides + totalPriceTaxForTaxOverrides) / 100),
                    product_data: {
                        metadata: {
                            type: "merchandiseWithTaxOverride",
                            priceWithoutTax: totalPriceForTaxOverrides,
                            taxAmount: totalPriceTaxForTaxOverrides,
                            merchandiseItems: merchandiseWithTaxes.map((item) => ({
                                id: item.id,
                                qty: item.qty,
                                merchandiseTaxPercent: item.merchandiseTaxPercent!,
                                pricePerItem: item.price,
                                taxAmountPerItem: Number(item.price * (((item.merchandiseTaxPercent ?? 0) / 100) / 100)),
                            }))
                        },
                    },
                });
            }
        }

        if (firstTeeTime?.advancedBookingFeesPerPlayer) {
            localCart.push({
                name: "Golf District Tee Time",
                id: teeTimeIds ?? "",
                price: firstTeeTime.advancedBookingFeesPerPlayer,
                image: "",
                currency: "USD", //USD
                display_price: formatMoney(firstTeeTime.advancedBookingFeesPerPlayer),
                product_data: {
                    metadata: {
                        type: "advanced_booking_fees_per_player",
                    },
                },
            });
        }

        return localCart;
    }, [
        sensibleData,
        saleType,
        amountOfPlayers,
        shouldAddSensible,
        isSensibleInvalid,
        firstTeeTime,
        teeTimesSelectedForBooking,
        debouncedPromoCode,
        promoCodePrice,
        selectedCharity,
        deboundCharityAmount,
        course?.markupFeesFixedPerPlayer,
        course?.convenienceFeesFixedPerPlayer,
        // playerCount,
        validatePlayers,
        merchandiseData
    ]);

    const { data: systemNotifications } =
        api.systemNotification.getSystemNotification.useQuery({});

    const { data: courseGlobalNotification } =
        api.systemNotification.getCourseGlobalNotification.useQuery({
            courseId: courseId ?? "",
        });

    const notificationsCount =
        (systemNotifications ? systemNotifications.length : 0) +
        (courseGlobalNotification ? courseGlobalNotification.length : 0);

    const height =
        notificationsCount > 0 ? `${200 + notificationsCount * 80}px` : "200px";

    const marginTop = notificationsCount > 0 ? `${notificationsCount * 10}px` : "0";

    useEffect(() => {
        if (playerCount) {
            setAmountOfPlayers(Number(playerCount))
        }
    }, [teeTimeData])

    const isTeeTimeExpired = useMemo(() => {
        if (firstTeeTime) {
            const currentTime = dayjs.utc(dayjs().format("YYYY-MM-DD HH:mm:ss"), "YYYY-MM-DD HH:mm:ss");
            const teeTimeDate = dayjs.utc(firstTeeTime.date, "YYYY-MM-DD HH:mm:ss");
            return teeTimeDate.diff(currentTime, "minutes") < DEFAULT_TEE_TIME_EXPIRATION_TIME;
        }
    }, [firstTeeTime])

    useEffect(() => {
        if (isTeeTimeExpired && !hasErrorOccured && !errorMessage) {
            setErrorMessage("This tee time has expired and is no longer for sale. Play has already started.");
            setHasErrorOccured(true);
        }
    }, [isTeeTimeExpired]);

    if (isError && error) {
        return (
            <div
                className={`flex justify-center flex-col items-center`}
                style={{ height }}
            >
                <div className="text-center">Error: {error?.message}</div>
                <Link href={`/${course?.id}`} className="underline">
                    Return to home
                </Link>
            </div>
        );
    }

    if (hasErrorOccured) {
        return (
            <div
                className={`flex justify-center flex-col items-center`}
                style={{ height }}
            >
                <div className="text-center">Error: {errorMessage}</div>
                <Link href={`/${course?.id}`} className="underline">
                    Return to home
                </Link>
            </div>
        );
    }

    return (
        <>
            <div
                className={`relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8`}
                style={{ marginTop }}
            >
                <CheckoutBreadcumbs status={"checkout"} />
                {maxReservation && maxReservation?.success === false && (
                    <div className="bg-alert-red text-white p-1 pl-2  w-full rounded">
                        {maxReservation?.message}
                    </div>
                )}
                <div className="flex w-full flex-col gap-4 md:flex-row">
                    <div className="md:w-3/5">
                        <OrderSummary
                            teeTime={firstTeeTime}
                            isLoading={isLoadingTeeTime || isSessionLoading}
                            sensibleDataToMountComp={{
                                partner_id: process.env.NEXT_PUBLIC_SENSIBLE_PARTNER_ID ?? "",
                                product_id: process.env.NEXT_PUBLIC_SENSIBLE_PRODUCT_ID ?? "",
                                coverageStartDate: formatDate(new Date(firstTeeTime?.date ?? "")),
                                coverageEndDate: formatDate(new Date(firstTeeTime?.date ?? "")),
                                coverageStartHourNumber: startHourNumber,
                                coverageEndHourNumber: endHourNumber === 0 ? 23 : endHourNumber, // SAFE VALUE SHOULDN'T BE 0 OR 24
                                currency: "USD",
                                langLocale: "en-US",
                                exposureName: course?.name ?? "",
                                exposureLatitude: course?.latitude ?? 0,
                                exposureLongitude: course?.longitude ?? 0,
                                exposureTotalCoverageAmount:
                                    Number(firstTeeTime?.pricePerGolferForGroup) * amountOfPlayers || 0,
                            }}
                            isSensibleInvalid={isSensibleInvalid}
                            privacyPolicyAndTCByCourseUrl={privacyPolicyAndTCByCourseUrl}
                            isGroupBooking={true}
                            getPlayersPerSlotLabelFull={getPlayersPerSlotLabelFull}
                            selectedTeeTimes={teeTimesSelectedForBooking}
                        />
                    </div>
                    <div className="md:w-2/5">
                        {isLoadingTeeTime || !firstTeeTime || firstTeeTime === null ? (
                            <div className="flex justify-center items-center h-[12.5rem] w-full md:min-w-[23.125rem]">
                                <Spinner className="w-[3.125rem] h-[3.125rem]" />
                            </div>
                        ) : !isLoadingTeeTime && isError && error ? (
                            <div className="text-center h-[12.5rem] flex items-center justify-center rounded-xl bg-white p-6">
                                {error?.message ?? "An error occurred fetching checkout data"}
                            </div>
                        ) : (
                            <HyperSwitch
                                teeTimeId={
                                    teeTimeIds !== undefined ? teeTimeIds : ""
                                }
                                setIsLoading={setIsSessionLoading}
                                listingId={""}
                                isBuyNowAuction={false}
                                cartData={cartData}
                                teeTimeDate={firstTeeTime?.date}
                                playerCount={playerCount}
                                teeTimeData={firstTeeTime}
                            // maxReservation={maxReservation}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
