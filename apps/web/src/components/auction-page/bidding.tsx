"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useExpiration } from "~/hooks/useExpiration";
import { cleanTimeString, formatMoney, formatTime } from "~/utils/formatters";
import { useState, type ChangeEvent } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { BuyNowCheckout } from "../modal/buy-now-checkout";
import { BuyNow } from "./buy-now";
import { PlaceBid } from "./place-bid";

const auctionId = "72673ea0-7e91-444c-a76a-824d518362e8";

export const Bidding = ({
  endDate,
  startingPrice,
  highestBid,
  bidCount,
  buyNowPrice,
  refetchData,
}: {
  endDate?: string;
  startingPrice?: number;
  highestBid?: number;
  bidCount?: number;
  buyNowPrice?: number | null;
  refetchData: () => Promise<unknown>;
}) => {
  const [bid, setBid] = useState<number>(startingPrice ?? 50);
  const [isPlaceBidOpen, setIsPlaceBidOpen] = useState<boolean>(false);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState<boolean>(false);
  const [isBuyNowCheckoutOpen, setIsBuyNowCheckoutOpen] =
    useState<boolean>(false);
  const { timeTillEnd, count } = useExpiration({
    expirationDate: Math.floor(
      endDate ? new Date(cleanTimeString(endDate))?.getTime() / 1000 : 0
    ).toString(),
    intervalMs: 60000,
  });
  const { course } = useCourseContext();

  const isDisabled = bid === 0;

  const openPlaceBid = () => {
    if (isDisabled) return;
    setIsPlaceBidOpen(true);
  };

  const openBuyNow = () => {
    setIsBuyNowOpen(true);
  };

  const openBuyNowCheckout = () => {
    setIsBuyNowCheckoutOpen(true);
  };

  const closeBuyNowCheckout = () => {
    setIsBuyNowCheckoutOpen(false);
  };

  const handleBid = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("$", "").replaceAll(",", "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");
    setBid(Number(strippedLeadingZeros));
  };

  const handleFocus = () => {
    if (!bid) setBid(startingPrice ?? 50);
  };

  const handleBlur = () => {
    if (!bid) setBid(startingPrice ?? 50);
  };

  const clearBid = () => {
    setBid(0);
  };

  return (
    <div className="flex h-fit w-full flex-col gap-4 bg-white p-4 md:w-[380px] md:min-w-[380px] md:rounded-xl md:p-6">
      <div className="text-center md:text-start">
        <div className="text-[24px] font-[400] text-secondary-black md:text-[32px]">
          Place bid
        </div>
        <div className="text-primary-gray">
          Sale ends{" "}
          {endDate
            ? formatTime(endDate, false, course?.timezoneCorrection)
            : "-"}
        </div>
      </div>
      <div className="flex justify-center gap-4 border-t border-stroke py-2 md:justify-start">
        {count === 0 ? (
          <div className="text-[20px] text-secondary-black md:text-[28px]">
            Auction Is Over
          </div>
        ) : (
          <>
            <Item data={timeTillEnd.days.toString()} description="Days" />
            <Item data={timeTillEnd.hours.toString()} description="Hours" />
            <Item data={timeTillEnd.minutes.toString()} description="Minutes" />
            <Item data={timeTillEnd.seconds.toString()} description="Seconds" />
          </>
        )}
      </div>
      <div className="flex justify-center gap-4 border-t border-stroke py-2 md:justify-start">
        <Item
          data={formatMoney(startingPrice ?? 0)}
          description="Starting Bid"
        />
        <Item data={formatMoney(highestBid ?? 0)} description="Highest Bid" />
        <Item data={bidCount ?? "-"} description="Bids" />
      </div>
      <div className="flex flex-col gap-6 border-t border-stroke pb-2 pt-4">
        <div className={`flex flex-col gap-1 text-center mx-auto w-fit`}>
          <label
            htmlFor="bid"
            className="text-[16px] text-primary-gray md:text-[18px]"
          >
            Enter bid
          </label>
          <div className="relative">
            <span className="absolute left-1 top-1 text-[24px] md:text-[32px] text-primary">
              $
            </span>
            <input
              id="bid"
              value={bid?.toString()?.replace(/^0+/, "")}
              type="number"
              onFocus={handleFocus}
              onChange={handleBid}
              onBlur={handleBlur}
              className="w-[250px] md:w-[332px] rounded-lg bg-tertiary-gray px-4 py-1 text-center text-[24px] font-semibold text-primary outline-none md:text-[32px]"
              data-testid="auction-bid-id"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FilledButton
            onClick={openPlaceBid}
            className={isDisabled ? "opacity-50" : "opacity-100"}
            data-testid="review-bid-button-id"
          >
            Review Bid
          </FilledButton>
          <OutlineButton onClick={openBuyNow} data-testid="buy-now-button-id">Buy Now</OutlineButton>
        </div>
      </div>

      <PlaceBid
        isPlaceBidOpen={isPlaceBidOpen}
        setIsPlaceBidOpen={setIsPlaceBidOpen}
        bid={bid}
        clearBid={clearBid}
        refetch={refetchData}
      />

      <BuyNow
        isBuyNowOpen={isBuyNowOpen}
        setIsBuyNowOpen={setIsBuyNowOpen}
        reserve={Number(buyNowPrice) ?? 0}
        openBuyNowCheckout={openBuyNowCheckout}
      />
      <BuyNowCheckout
        isOpen={isBuyNowCheckoutOpen}
        onClose={closeBuyNowCheckout}
        buyNowPrice={Number(buyNowPrice) + 90 ?? 0}
        auctionId={auctionId}
      />
    </div>
  );
};

const Item = ({
  data,
  description,
}: {
  data: string | number;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="font-[500]] text-[20px] text-secondary-black md:text-[24px]">
        {data}
      </div>
      <div className="text-[14px] text-primary-gray md:text-base">
        {description}
      </div>
    </div>
  );
};
