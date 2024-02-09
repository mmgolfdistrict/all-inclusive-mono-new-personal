"use client";

import { formatQueryDate } from "@golf-district/shared";
import { HyperSwitch } from "~/components/checkout-page/hyper-switch";
import { OrderSummary } from "~/components/checkout-page/order-summary";
import { BlurImage } from "~/components/images/blur-image";
import { Spinner } from "~/components/loading/spinner";
import { CheckoutBreadcumbs } from "~/components/nav/checkout-breadcrumbs";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, getPromoCodePrice } from "~/utils/formatters";
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
  const { course } = useCourseContext();
  const { shouldAddSensible, sensibleData, amountOfPlayers, promoCode } =
    useCheckoutContext();

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

  const data = teeTimeId ? teeTimeData : listingData;
  const isLoading = teeTimeId ? isLoadingTeeTime : isLoadingListing;
  const isError = teeTimeId ? isErrorTeeTime : isErrorListing;
  const error = teeTimeId ? errorTeeTime : errorListing;

  const saleType = teeTimeId ? "first_hand" : "second_hand";

  const teeTimeDate = formatQueryDate(new Date(data?.date ?? ""));

  const isSensibleInvalid = teeTimeDate === currentDate;

  const validatePromoCode = api.checkout.validatePromoCode.useMutation();
  const debouncedPromoCode = useDebounce(promoCode, 500);

  const [promoCodePrice, setPromoCodePrice] = useState<number | undefined>(
    undefined
  );

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
      console.log(error);
    }
  };

  useEffect(() => {
    if (debouncedPromoCode) {
      void checkPromoCode();
    }
  }, [debouncedPromoCode]);

  const cartData = useMemo(() => {
    if (!data || data === null) return [];

    const metadata =
      saleType === "first_hand"
        ? {
            type: "first_hand",
            tee_time_id: teeTimeId,
            number_of_bookings: amountOfPlayers,
          }
        : {
            type: "second_hand",
            second_hand_id: listingId,
          };
    if (!shouldAddSensible || isSensibleInvalid) {
      return [
        {
          name: "Golf District Tee Time",
          id: teeTimeId ?? data?.teeTimeId,
          price:
            debouncedPromoCode && promoCodePrice !== undefined
              ? promoCodePrice * 100
              : Number(data?.pricePerGolfer * 100) * amountOfPlayers, //int
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
    } else {
      return [
        {
          name: "Golf District Tee Time",
          id: teeTimeId ?? data?.teeTimeId,
          courseId: course?.id,
          price:
            debouncedPromoCode && promoCodePrice !== undefined
              ? promoCodePrice * 100
              : Number(data?.pricePerGolfer * 100) * amountOfPlayers, //int
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
        {
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
        },
      ];
    }
  }, [
    sensibleData,
    saleType,
    amountOfPlayers,
    shouldAddSensible,
    isSensibleInvalid,
    data,
    debouncedPromoCode,
    promoCodePrice,
  ]);

  if (isError && error) {
    return (
      <div className="flex justify-center flex-col items-center h-[200px]">
        <div className="text-center">Error: {error?.message}</div>
        <Link href="/" className="underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8">
        <Link href={`/${course?.id}`} className="w-[105px] pb-4">
          <BlurImage
            src={course?.logo ?? ""}
            alt="course logo"
            width={60}
            height={100}
            className="w-[50px] object-fit"
          />
        </Link>
        <CheckoutBreadcumbs status={"checkout"} />

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <OrderSummary
            teeTime={data}
            isLoading={isLoading}
            sensibleDataToMountComp={{
              partner_id: "58222273-8372-4f8d-a366-79613453ff93",
              product_id: "4b1342df-0d23-456e-81de-22d62aa3cee9",
              coverageStartDate: formatQueryDate(new Date(data?.date ?? "")),
              coverageEndDate: formatQueryDate(new Date(data?.date ?? "")),
              currency: "USD",
              langLocale: "en-US",
              exposureName: course?.name ?? "",
              exposureLatitude: course?.latitude ?? 0,
              exposureLongitude: course?.longitude ?? 0,
              exposureTotalCoverageAmount:
                Number(data?.pricePerGolfer) * amountOfPlayers ?? 0,
            }}
            isSensibleInvalid={isSensibleInvalid}
          />
          <div>
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
                isBuyNowAuction={false}
                cartData={cartData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
