"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import { formatQueryDate } from "@golf-district/shared";
import { FilledButton } from "~/components/buttons/filled-button";
import { HyperSwitch } from "~/components/checkout-page/hyper-switch";
import { OrderSummary } from "~/components/checkout-page/order-summary";
import { BlurImage } from "~/components/images/blur-image";
import { Spinner } from "~/components/loading/spinner";
import { CheckoutBreadcumbs } from "~/components/nav/checkout-breadcrumbs";
import { UserInNav } from "~/components/user/user-in-nav";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, getPromoCodePrice } from "~/utils/formatters";
import type {
  AuctionProduct,
  CartProduct,
  CharityProduct,
  ConvenienceFeeProduct,
  FirstHandProduct,
  MarkupProduct,
  Offer,
  SecondHandProduct,
  SensibleProduct,
  TaxProduct,
} from "~/utils/types";
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
  const { status } = useSession();

  const {
    shouldAddSensible,
    sensibleData,
    amountOfPlayers,
    promoCode,
    selectedCharity,
    selectedCharityAmount,
    setAmountOfPlayers,
  } = useCheckoutContext();

  useEffect(() => {
    if (playerCount) {
      setAmountOfPlayers(Number(playerCount));
    }
  }, []);

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
  console.log(data, "ygufuyffcytucctctctc");
  const isLoading = teeTimeId ? isLoadingTeeTime : isLoadingListing;
  const isError = teeTimeId ? isErrorTeeTime : isErrorListing;
  const error = teeTimeId ? errorTeeTime : errorListing;

  const saleType = teeTimeId ? "first_hand" : "second_hand";

  const teeTimeDate = formatQueryDate(new Date(data?.date ?? ""));

  const isSensibleInvalid = teeTimeDate === currentDate;

  const validatePromoCode = api.checkout.validatePromoCode.useMutation();
  const debouncedPromoCode = useDebounce(promoCode, 500);
  const deboundCharityAmount = useDebounce(selectedCharityAmount, 500);

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
      | TaxProduct =
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

    const localCart: CartProduct[] = [
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

    if (data) {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price:
          ((data?.greenFeeTax ?? 0) + (data?.cartFeeTax ?? 0)) *
          amountOfPlayers, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          ((data?.greenFeeTax ?? 0) + (data?.cartFeeTax ?? 0)) * amountOfPlayers
        ),
        product_data: {
          metadata: {
            type: "taxes",
          },
        },
      });
    }

    if (course?.convenienceFees) {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price: course?.convenienceFees * amountOfPlayers ?? 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(
          (course?.convenienceFees ? course?.convenienceFees / 100 : 0) *
            amountOfPlayers
        ),
        product_data: {
          metadata: {
            type: "convenience_fee",
          },
        },
      });
    }

    if (course?.markup) {
      localCart.push({
        name: "Golf District Tee Time",
        id: teeTimeId ?? data?.teeTimeId,
        price: course?.markup ?? 0, //int
        image: "", //
        currency: "USD", //USD
        display_price: formatMoney(course?.markup ? course?.markup / 100 : 0),
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

    if (selectedCharity && deboundCharityAmount && deboundCharityAmount > 0) {
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
            charity_id: selectedCharity?.charityId,
            donation_amount: deboundCharityAmount * 100,
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
    course?.markup,
    course?.convenienceFees,
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
        <div className="flex p-2 justify-between w-full relative">
          <div />

          <Link
            href={`/${course?.id}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            data-testid="course-logo-id"
          >
            <BlurImage
              src={course?.logo ?? ""}
              alt="course logo"
              width={50}
              height={100}
              className="w-[50px] object-fit"
            />
          </Link>
          {status=="loading"?null:
          user && status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <UserInNav alwaysShow={true} />
            </div>
          ) : (
            <Link href={`/${course?.id}/login`} data-testid="login-button-id">
              <FilledButton>Log In</FilledButton>
            </Link>
          )}
        </div>
        <CheckoutBreadcumbs status={"checkout"} />

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="md:w-3/5">
            <OrderSummary
              teeTime={data}
              isLoading={isLoading}
              sensibleDataToMountComp={{
                partner_id: process.env.NEXT_PUBLIC_SENSIBLE_PARTNER_ID ?? "",
                product_id: process.env.NEXT_PUBLIC_SENSIBLE_PRODUCT_ID ?? "",
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
                isBuyNowAuction={false}
                cartData={cartData}
                teeTimeDate={teeTimeData?.date}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
