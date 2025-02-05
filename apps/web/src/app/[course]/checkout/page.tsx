"use client";

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
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, getPromoCodePrice } from "~/utils/formatters";
import type {
  AuctionProduct,
  CartFeeMetaData,
  CartProduct,
  CharityProduct,
  ConvenienceFeeProduct,
  FirstHandGroupProduct,
  FirstHandProduct,
  MarkupProduct,
  Offer,
  SecondHandProduct,
  SensibleProduct,
  TaxProduct,
} from "~/utils/types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";

const currentDate = formatQueryDate(new Date());

export default function Checkout({
  params,
  searchParams,
}: {
  params: { course: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const courseId = params.course;
  const teeTimeId = searchParams?.teeTimeId as string | undefined;
  const listingId = searchParams?.listingId as string | undefined;
  const playerCount = searchParams?.playerCount as string | undefined;
  const { course } = useCourseContext();
  const { user } = useUserContext();

  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isErrorBookingCancelled, setIsErrorBookingCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const {
    shouldAddSensible,
    sensibleData,
    amountOfPlayers,
    promoCode,
    selectedCharity,
    selectedCharityAmount,
    setAmountOfPlayers,
    validatePlayers,
    setValidatePlayers: _setValidatePlayers,
  } = useCheckoutContext();

  // useEffect(() => {
  //   if (playerCount) {
  //     setAmountOfPlayers(Number(playerCount));
  //   }
  // }, []);

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
    data: _providerBookingStatusResult,
    refetch: refetchProviderBookingStatus,
  } = api.teeBox.providerBookingStatus.useQuery(
    { listingId: listingId ?? "" },
    { enabled: false }
  );

  const {
    data: teeTimeData,
    isLoading: isLoadingTeeTime,
    error: errorTeeTime,
    isError: isErrorTeeTime,
  } = api.searchRouter.getTeeTimeById.useQuery(
    { teeTimeId: teeTimeId! },
    { enabled: teeTimeId !== undefined }
  );
  const {
    data: listingData,
    isLoading: isLoadingListing,
    error: errorListing,
    isError: isErrorListing,
  } = api.searchRouter.getListingById.useQuery(
    { listingId: listingId! },
    { enabled: listingId !== undefined }
  );

  let isError, error;

  const data = teeTimeId ? teeTimeData : listingData;
  const isLoading = teeTimeId ? isLoadingTeeTime : isLoadingListing;
  isError = teeTimeId ? isErrorTeeTime : isErrorListing;
  error = teeTimeId ? errorTeeTime : errorListing;

  if (data && listingData?.ownerId === user?.id) {
    isError = true;
    error = new Error("You cannot buy your own tee time");
  }

  if (!isLoading && listingId && !data && !error) {
    isError = true;
    error = new Error("Expected Tee time spots may not be available anymore");
  }

  const saleType = teeTimeId ? "first_hand" : "second_hand";

  const teeTimeDate = formatQueryDate(new Date(data?.date ?? ""));

  const isSensibleInvalid = teeTimeDate === currentDate;

  const validatePromoCode = api.checkout.validatePromoCode.useMutation();
  const debouncedPromoCode = useDebounce(promoCode, 500);
  const deboundCharityAmount = useDebounce(selectedCharityAmount, 500);

  const [promoCodePrice, setPromoCodePrice] = useState<number | undefined>(
    undefined
  );

  const getProviderBookingStatus = async () => {
    const result = await refetchProviderBookingStatus();
    console.log("result=====>", result?.data?.providerBookingStatus);
    if (result?.data?.providerBookingStatus) {
      setErrorMessage(
        "Currently, you cannot book this tee time due to an issue."
      );
      setIsErrorBookingCancelled(true);
    }
  };

  useEffect(() => {
    void getProviderBookingStatus();
  }, [listingId]);

  const checkPromoCode = async () => {
    const currentPrice = Number(data?.pricePerGolfer) * amountOfPlayers;
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

  const startHourNumber = dayjs(removeTimeZoneOffset(data?.date)).hour();
  const endHourNumber = dayjs(removeTimeZoneOffset(data?.date))
    .add(6, "hours")
    .hour();

  const cartData: CartProduct[] = useMemo(() => {
    if (!data || data === null) return [];

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
      | FirstHandGroupProduct =
      saleType === "first_hand"
        ? {
            type: "first_hand",
            tee_time_id: teeTimeId,
            number_of_bookings: amountOfPlayers - validatePlayers.length,
          }
        : {
            type: "second_hand",
            second_hand_id: listingId,
          };
    const localCart: CartProduct[] = [
      {
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price: (() => {
          const calculatedPrice =
            debouncedPromoCode && promoCodePrice !== undefined
              ? promoCodePrice * 100
              : Number(data?.pricePerGolfer * 100) *
                (amountOfPlayers - validatePlayers.length);

          return calculatedPrice === 0 ? 1 : calculatedPrice; // If price is 0, return 1
        })(), //int
        image: "", //
        currency: "USD", //USD
        display_price:
          debouncedPromoCode && promoCodePrice !== undefined
            ? formatMoney(promoCodePrice)
            : formatMoney(Number(data?.pricePerGolfer) * amountOfPlayers),
        product_data: {
          metadata: { ...metadata },
        },
      },
    ];

    if (teeTimeData?.cartFee) {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData.cartFee, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          ((data?.greenFeeTaxPerPlayer ?? 0) +
            (data?.cartFeeTaxPerPlayer ?? 0)) *
            amountOfPlayers
        ),
        product_data: {
          metadata: {
            type: "cart_fee",
            amount: teeTimeData.cartFee,
          },
        },
      });
    } else {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price: 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          ((data?.greenFeeTaxPerPlayer ?? 0) +
            (data?.cartFeeTaxPerPlayer ?? 0)) *
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
    if (data) {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price:
          ((data?.greenFeeTaxPerPlayer ?? 0) +
            (data?.cartFeeTaxPerPlayer ?? 0)) *
          amountOfPlayers, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          ((data?.greenFeeTaxPerPlayer ?? 0) +
            (data?.cartFeeTaxPerPlayer ?? 0)) *
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
        id: teeTimeId ?? data?.teeTimeId,
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
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData?.markupFees ?? 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          course?.markupFeesFixedPerPlayer
            ? course?.markupFeesFixedPerPlayer / 100
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
        id: teeTimeId ?? data?.teeTimeId,
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
        id: teeTimeId ?? data?.teeTimeId,
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
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData?.greenFeeTaxPercent || 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(teeTimeData?.greenFeeTaxPercent || 0),
        product_data: {
          metadata: {
            type: "greenFeeTaxPercent",
          },
        },
      });
      localCart.push({
        name: "cart fee tax percent",
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData?.cartFeeTaxPercent || 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(teeTimeData?.cartFeeTaxPercent || 0),
        product_data: {
          metadata: {
            type: "cartFeeTaxPercent",
            amount: teeTimeData?.cartFeeTaxPercent || 0,
          },
        },
      });
      localCart.push({
        name: "weather guarantee tax percent",
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData?.weatherGuaranteeTaxPercent || 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          teeTimeData?.weatherGuaranteeTaxPercent || 0
        ),
        product_data: {
          metadata: {
            type: "weatherGuaranteeTaxPercent",
          },
        },
      });
      localCart.push({
        name: "markup tax percent",
        id: teeTimeId ?? data?.teeTimeId,
        price: teeTimeData?.markupTaxPercent || 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(teeTimeData?.markupTaxPercent || 0),
        product_data: {
          metadata: {
            type: "markupTaxPercent",
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
    data,
    debouncedPromoCode,
    promoCodePrice,
    selectedCharity,
    deboundCharityAmount,
    course?.markupFeesFixedPerPlayer,
    course?.convenienceFeesFixedPerPlayer,
    // playerCount,
    validatePlayers,
  ]);

  useEffect(() => {
    if (playerCount && data?.availableSlots)
      setAmountOfPlayers((_prev) =>
        Math.min(Number(playerCount), Number(data?.availableSlots))
      );
  }, [data]);

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

  const marginTop =
    notificationsCount > 0 ? `${notificationsCount * 10}px` : "0";

  if (isError && error) {
    return (
      <div
        className={`flex justify-center flex-col items-center`}
        style={{ height }}
      >
        <div className="text-center">Error: {error?.message}</div>
        <Link href="/" className="underline">
          Return to home
        </Link>
      </div>
    );
  }

  if (isErrorBookingCancelled) {
    return (
      <div
        className={`flex justify-center flex-col items-center`}
        style={{ height }}
      >
        <div className="text-center">Error: {errorMessage}</div>
        <Link href="/" className="underline">
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
        <div className="h-12 w-full "></div>
        <CheckoutBreadcumbs status={"checkout"} />
        {maxReservation && maxReservation?.success === false && (
          <div className="bg-alert-red text-white p-1 pl-2  w-full rounded">
            {maxReservation?.message}
          </div>
        )}
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="md:w-3/5">
            <OrderSummary
              teeTime={data}
              isLoading={isLoading || isSessionLoading}
              sensibleDataToMountComp={{
                partner_id: process.env.NEXT_PUBLIC_SENSIBLE_PARTNER_ID ?? "",
                product_id: process.env.NEXT_PUBLIC_SENSIBLE_PRODUCT_ID ?? "",
                coverageStartDate: formatDate(new Date(data?.date ?? "")),
                coverageEndDate: formatDate(new Date(data?.date ?? "")),
                coverageStartHourNumber: startHourNumber,
                coverageEndHourNumber: endHourNumber === 0 ? 23 : endHourNumber, // SAFE VALUE SHOULDN'T BE 0 OR 24
                currency: "USD",
                langLocale: "en-US",
                exposureName: course?.name ?? "",
                exposureLatitude: course?.latitude ?? 0,
                exposureLongitude: course?.longitude ?? 0,
                exposureTotalCoverageAmount:
                  Number(data?.pricePerGolfer) * amountOfPlayers || 0,
              }}
              isSensibleInvalid={isSensibleInvalid}
              privacyPolicyAndTCByCourseUrl={privacyPolicyAndTCByCourseUrl}
            />
          </div>
          <div className="md:w-2/5">
            {isLoading || !data || data === null ? (
              <div className="flex justify-center items-center h-[200px] w-full md:min-w-[370px]">
                <Spinner className="w-[50px] h-[50px]" />
              </div>
            ) : !isLoading && isError && error ? (
              <div className="text-center h-[200px] flex items-center justify-center rounded-xl bg-white p-6">
                {error?.message ?? "An error occurred fetching checkout data"}
              </div>
            ) : (
              <HyperSwitch
                teeTimeId={
                  teeTimeId !== undefined ? teeTimeId : listingId ?? ""
                }
                setIsLoading={setIsSessionLoading}
                listingId={listingId}
                isBuyNowAuction={false}
                cartData={cartData}
                teeTimeDate={teeTimeData?.date}
                playerCount={playerCount}
                teeTimeData={data}
                // maxReservation={maxReservation}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
