"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useExpiration } from "~/hooks/useExpiration";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../../avatar";
import { FilledButton } from "../../buttons/filled-button";
import { Counteroffer } from "./../counteroffer";
import { CounterofferSuccess } from "./../counteroffer-success";
import { SkeletonRow } from "./../skeleton-row";
import { ViewOffer } from "./../view-offer";
import { type OfferType } from "../offers-received";

export type SelectedOffer = { expirationDate: string } | undefined;

type SortDirectionType = "asc" | "desc" | undefined;

export const MobileOffersReceived = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isViewOfferOpen, setIsViewOfferOpen] = useState<boolean>(false);
  const [isCounterofferOpen, setIsCounterofferOpen] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferType | undefined>(
    undefined
  );
  const [sortDetails, _setSortDetails] = useState<SortDirectionType>(undefined);
  const [sortPrice, _setSortPrice] = useState<SortDirectionType>(undefined);
  const [sortExpiresIn, _setSortExpiresIn] =
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

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
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
      <div className="text-center h-[200px] flex items-center justify-center">
        No offers received
      </div>
    );
  }

  return (
    <>
      <div className="relative flex max-w-full flex-col overflow-auto text-[14px] m-2 px-2">
        {isLoading
          ? Array(3)
            .fill(null)
            .map((_, idx) => <SkeletonRow key={idx} />)
          : sortedData?.map((i, idx) => (
            <TableCard
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

const TableCard = ({
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
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <div className="card-body">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody className="text-xs text-gray-700 bg-gray-50">
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Course</th>
              <td>
                <div className="items-center">
                  <Link
                    href={`/${courseId}/${teeTimeId}`}
                    className="flex items-center gap-2"
                    data-testid="course-tee-time-id"
                    data-test={teeTimeId}
                    data-qa={courseId}
                  >
                    <Avatar src={iconSrc} />
                    <div className="flex flex-col">
                      <div className="whitespace-nowrap text-secondary-black">
                        {course}
                      </div>
                    </div>
                  </Link>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Tee Time</th>
              <td>{formatTime(date, false, timezoneCorrection)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Offer By</th>
              <td>
                <Link
                  href={`/${courseId}/profile/${offeredById}`}
                  target="_blank"
                  rel="noopenner noreferrer"
                  className="flex items-center gap-2 underline"
                  data-testid="offered-by-id"
                  data-test={offeredById}
                  data-qa={courseId}
                >
                  <Avatar src={offeredByImage} />
                  <div className="text-primary-gray">{offeredBy}</div>
                </Link>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="px-2 py-1">Offer Price</th>
              <td>
                <div className="flex items-center gap-1 whitespace-nowrap capitalize">
                  {formatMoney(offerPrice)}
                  <span className="font-[300]">/golfer</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="px-2 py-1">Golfers</th>
              <td>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  {golfers} {parseInt(golfers) === 1 ? "golfer" : "golfers"}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Expires In</th>
              <td>
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
            </tr>
            <tr>
              <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
                <div className="col-span-3 flex w-full justify-center">
                  <FilledButton
                    onClick={openViewOffer}
                    data-testid="view-offer-button-id"
                    className="w-full"
                  >
                    View Offer
                  </FilledButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
