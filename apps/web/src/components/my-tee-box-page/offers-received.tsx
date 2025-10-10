"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useExpiration } from "~/hooks/useExpiration";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { ChevronUp } from "../icons/chevron-up";
import { Counteroffer } from "./counteroffer";
import { CounterofferSuccess } from "./counteroffer-success";
import { SkeletonRow } from "./skeleton-row";
import { ViewOffer } from "./view-offer";

export type SelectedOffer = { expirationDate: string } | undefined;

type SortDirectionType = "asc" | "desc" | undefined;

export type OfferType = {
  offer: {
    courseId: string;
    details: {
      courseName: string | null;
      teeTimeDate: string | null;
      teeTimeId: string | null;
      courseImage: string;
    };
    offeredBy: {
      userId: string | null;
      name: string | null;
      handle: string | null;
      image: string;
    };

    amountOffered: number;
    originalPrice: number | null;
    lastHighestSale: number | null;
    golfers: number | null;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    expiresAt: string;
    offerId: string;
  };
};

export const OffersReceived = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isViewOfferOpen, setIsViewOfferOpen] = useState<boolean>(false);
  const [isCounterofferOpen, setIsCounterofferOpen] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferType | undefined>(
    undefined
  );
  const [sortDetails, setSortDetails] = useState<SortDirectionType>(undefined);
  const [sortPrice, setSortPrice] = useState<SortDirectionType>(undefined);
  const [sortExpiresIn, setSortExpiresIn] =
    useState<SortDirectionType>(undefined);
  const [isCounterofferSuccessOpen, setIsCounterofferSuccessOpen] =
    useState<boolean>(false);
  const { data, isLoading, isError, error, refetch } =
    api.teeBox.getOfferReceivedForUser.useQuery(
      {
        courseId: courseId ?? "",
      },
      { enabled: !!courseId }
    );

  const openViewOffer = (offer: OfferType) => {
    setSelectedOffer(offer);
    setIsViewOfferOpen(true);
  };

  useEffect(() => {
    if (!isViewOfferOpen && !isCounterofferOpen && !isCounterofferSuccessOpen) {
      setSelectedOffer(undefined);
    }
  }, [isViewOfferOpen, isCounterofferOpen, isCounterofferSuccessOpen]);

  const openCounteroffer = () => {
    setIsViewOfferOpen(false);
    setIsCounterofferOpen(true);
  };

  const sortedData: OfferType[] | undefined = useMemo(() => {
    if (!data) return undefined;
    if (sortDetails === "asc") {
      return data.sort(
        (a, b) =>
          new Date(a?.offer?.details?.teeTimeDate ?? "").getTime() -
          new Date(b?.offer?.details?.teeTimeDate ?? "").getTime()
      );
    }
    if (sortDetails === "desc") {
      return data.sort(
        (a, b) =>
          new Date(b?.offer?.details?.teeTimeDate ?? "").getTime() -
          new Date(a?.offer?.details?.teeTimeDate ?? "").getTime()
      );
    }
    if (sortPrice === "asc") {
      return data.sort((a, b) => a.offer.amountOffered - b.offer.amountOffered);
    }
    if (sortPrice === "desc") {
      return data.sort((a, b) => b.offer.amountOffered - a.offer.amountOffered);
    }
    if (sortExpiresIn === "asc") {
      return data.sort(
        (a, b) =>
          new Date(a.offer.expiresAt).getTime() -
          new Date(b.offer.expiresAt).getTime()
      );
    }
    if (sortExpiresIn === "desc") {
      return data.sort(
        (a, b) =>
          new Date(b.offer.expiresAt).getTime() -
          new Date(a.offer.expiresAt).getTime()
      );
    }
    return data;
  }, [data, sortDetails, sortPrice, sortExpiresIn]);

  const sortDetailsFn = () => {
    if (!sortedData) return;
    if (sortPrice !== undefined) setSortPrice(undefined);
    if (sortExpiresIn !== undefined) setSortExpiresIn(undefined);
    if (sortDetails === undefined) {
      setSortDetails("asc");
    }
    if (sortDetails === "asc") {
      setSortDetails("desc");
    }
    if (sortDetails === "desc") {
      setSortDetails(undefined);
    }
  };

  const sortPriceFn = () => {
    if (!sortedData) return;
    if (sortExpiresIn !== undefined) setSortExpiresIn(undefined);
    if (sortDetails !== undefined) setSortDetails(undefined);
    if (sortPrice === undefined) {
      setSortPrice("asc");
    }
    if (sortPrice === "asc") {
      setSortPrice("desc");
    }
    if (sortPrice === "desc") {
      setSortPrice(undefined);
    }
  };

  const sortExpiresInFn = () => {
    if (!sortedData) return;
    if (sortDetails !== undefined) setSortDetails(undefined);
    if (sortPrice !== undefined) setSortPrice(undefined);
    if (sortExpiresIn === undefined) {
      setSortExpiresIn("asc");
    }
    if (sortExpiresIn === "asc") {
      setSortExpiresIn("desc");
    }
    if (sortExpiresIn === "desc") {
      setSortExpiresIn(undefined);
    }
  };

  if (isError && error) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if (
    (!sortedData || sortedData.length === 0) &&
    !isLoading &&
    !isError &&
    !error
  ) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        No offers received
      </div>
    );
  }

  return (
    <>
      <div className="relative flex max-w-full flex-col gap-4  overflow-auto pb-2  text-sm md:pb-3">
        <table className="w-full table-auto  overflow-auto">
          <thead className="top-0 table-header-group">
            <tr className="text-left">
              <TableHeader
                text="Details"
                sortDirection={sortDetails}
                className="cursor-pointer"
                sortFn={sortDetailsFn}
              />
              <TableHeader text="Offered By" />
              <TableHeader
                text="Offer Price"
                sortDirection={sortPrice}
                className="cursor-pointer"
                sortFn={sortPriceFn}
              />
              <TableHeader text="Golfers" />
              <TableHeader
                text="Expires In"
                sortDirection={sortExpiresIn}
                className="cursor-pointer"
                sortFn={sortExpiresInFn}
              />
              <TableHeader text="" className="text-right" />
            </tr>
          </thead>
          <tbody className={`max-h-[18.75rem] w-full flex-col overflow-scroll`}>
            {isLoading
              ? Array(3)
                .fill(null)
                .map((_, idx) => <SkeletonRow key={idx} />)
              : sortedData?.map((i, idx) => (
                <TableRow
                  course={i.offer.details.courseName!}
                  date={i.offer.details.teeTimeDate!}
                  iconSrc={i.offer.details.courseImage}
                  key={idx}
                  offerPrice={i.offer.amountOffered}
                  golfers={i.offer.golfers?.toString() ?? "0"}
                  offeredBy={
                    i.offer.offeredBy.handle ?? i.offer.offeredBy.name ?? ""
                  }
                  offeredById={i.offer.offeredBy.userId!}
                  offeredByImage={i.offer.offeredBy.image ?? ""}
                  expirationDate={i.offer.expiresAt}
                  courseId={i.offer.courseId}
                  teeTimeId={i.offer.details.teeTimeId!}
                  timezoneCorrection={course?.timezoneCorrection}
                  openViewOffer={() => openViewOffer(i)}
                />
              ))}
          </tbody>
        </table>
      </div>
      <ViewOffer
        isViewOfferOpen={isViewOfferOpen}
        setIsViewOfferOpen={setIsViewOfferOpen}
        selectedOffer={selectedOffer}
        openCounteroffer={openCounteroffer}
        refetch={refetch}
      />
      <Counteroffer
        isCounterofferOpen={isCounterofferOpen}
        setIsCounterofferOpen={setIsCounterofferOpen}
        setIsCounterofferSuccessOpen={setIsCounterofferSuccessOpen}
      />
      <CounterofferSuccess
        isCounterofferSuccessOpen={isCounterofferSuccessOpen}
        setIsCounterofferSuccessOpen={setIsCounterofferSuccessOpen}
        selectedOffer={selectedOffer}
      />
    </>
  );
};

const TableHeader = ({
  text,
  className,
  sortFn,
  sortDirection,
}: {
  text: string;
  className?: string;
  sortFn?: () => void;
  sortDirection?: SortDirectionType;
}) => {
  return (
    <th
      className={`whitespace-nowrap px-4 font-semibold select-none ${className ?? ""
        }`}
      onClick={() => (sortFn ? sortFn() : null)}
      data-testid="table-sort-id"
    >
      <div className="flex items-center gap-1">
        {text}
        {sortFn ? (
          <ChevronUp
            fill={`${sortDirection === "asc" ? "#353B3F" : "#D7DCDE"}`}
          />
        ) : null}
        {sortFn ? (
          <ChevronUp
            fill={`${sortDirection === "desc" ? "#353B3F" : "#D7DCDE"}`}
            className={"rotate-180"}
          />
        ) : null}
      </div>
    </th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
  offerPrice,
  golfers,
  expirationDate,
  offeredBy,
  offeredById,
  offeredByImage,
  courseId,
  teeTimeId,
  timezoneCorrection,
  openViewOffer,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: string;
  offerPrice: number;
  expirationDate: string;
  offeredBy: string;
  offeredById: string;
  offeredByImage: string;
  courseId: string;
  teeTimeId: string;
  timezoneCorrection?: number;
  openViewOffer: () => void;
}) => {
  const { timeTillEnd, count } = useExpiration({
    expirationDate: Math.floor(
      new Date(expirationDate).getTime() / 1000
    ).toString(),
    intervalMs: 60000,
  });

  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        <Link
          href={`/${courseId}/${teeTimeId}`}
          className="flex items-center gap-2"
          data-testid="course-tee-time-id"
          data-test={teeTimeId}
          data-qa={courseId}
        >
          <Avatar src={iconSrc} isRounded={false} />
          <div className="flex flex-col">
            <div className="whitespace-nowrap underline text-secondary-black">
              {course}
            </div>
            <div className="text-primary-gray">
              {formatTime(date, false, timezoneCorrection)}
            </div>
          </div>
        </Link>
      </td>
      <td className="gap-2 px-4 py-3">
        <Link
          href={`/${courseId}/profile/${offeredById}`}
          target="_blank"
          rel="noopenner noreferrer"
          className="flex items-center gap-2 underline"
          data-testid="offered-by-id"
          data-test={offeredById}
          data-qa={courseId}
        >
          <Avatar src={offeredByImage} isRounded={false} />
          <div className="text-primary-gray">{offeredBy}</div>
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(offerPrice)}
        <span className="font-[300]">/golfer</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {golfers} {parseInt(golfers) === 1 ? "golfer" : "golfers"}
      </td>
      <td className="flex items-center gap-1 whitespace-nowrap px-4 pb-3 pt-6">
        {count <= 0 ? (
          <div className="text-primary-gray">Expired</div>
        ) : (
          <div className="flex gap-1">
            <div className="text-primary-gray">{timeTillEnd.days}d</div>
            <div className="text-primary-gray">{timeTillEnd.hours}h</div>
            <div className="text-primary-gray">{timeTillEnd.minutes}m</div>
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex  justify-end gap-2">
          <FilledButton
            onClick={openViewOffer}
            data-testid="view-offer-button-id"
          >
            View Offer
          </FilledButton>
        </div>
      </td>
    </tr>
  );
};
