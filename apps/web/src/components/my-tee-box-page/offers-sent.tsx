"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { CancelOffer } from "./cancel-offer";
import { ManageOffer } from "./manage-offer";
import { SkeletonRow } from "./skeleton-row";

export type OfferSentType = {
  offer: {
    courseId: string;
    details: {
      courseName: string;
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
    ownedBy: {
      userId: string | null;
      name: string | null;
      handle: string | null;
      image: string;
    };
    offerAmount: number;
    originalPrice: number | null;
    lastHighestSale: number | null;
    golfers: number | null;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    expiresAt: string;
    offerId: string;
  };
};

export const OffersSent = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isCancelOfferOpen, setIsCancelOfferOpen] = useState<boolean>(false);
  const [isManageOfferOpen, setIsManageOfferOpen] = useState<boolean>(false);
  const { data, isLoading, isError, error, refetch } =
    api.teeBox.getOfferSentForUser.useQuery(
      {
        courseId: courseId ?? "",
      },
      { enabled: !!courseId }
    );

  const [selectedOffer, setSelectedOffer] = useState<OfferSentType | undefined>(
    undefined
  );
  useEffect(() => {
    if (!isCancelOfferOpen && !isManageOfferOpen) {
      setSelectedOffer(undefined);
    }
  }, [isCancelOfferOpen, isManageOfferOpen]);

  const openCancelOffer = (offer: OfferSentType) => {
    setSelectedOffer(offer);
    setIsCancelOfferOpen(true);
  };

  const openManageOffer = (offer: OfferSentType) => {
    setSelectedOffer(offer);
    setIsManageOfferOpen(true);
  };

  if (isError && error) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if ((!data || data.length === 0) && !isLoading && !isError && !error) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        No offers sent
      </div>
    );
  }

  return (
    <>
      <div className="relative flex max-w-full flex-col gap-4  overflow-auto pb-2  text-sm md:pb-3">
        <table className="w-full table-auto  overflow-auto">
          <thead className="top-0 table-header-group">
            <tr className="text-left">
              <TableHeader text="Details" />
              <TableHeader text="Owned By" />
              <TableHeader text="Offer Price" />
              <TableHeader text="Golfers" />
              <TableHeader text="Status" />
              <TableHeader text="" className="text-right" />
            </tr>
          </thead>
          <tbody className={`max-h-[18.75rem] w-full flex-col overflow-scroll`}>
            {isLoading
              ? Array(3)
                .fill(null)
                .map((_, idx) => <SkeletonRow key={idx} />)
              : data.map((i, idx) => (
                <TableRow
                  course={i.offer.details.courseName}
                  date={i.offer.details.teeTimeDate!}
                  iconSrc={i.offer.details.courseImage}
                  key={idx}
                  offerPrice={i.offer.offerAmount ?? 0}
                  golfers={Number(i.offer.golfers) ?? 0}
                  ownedBy={i.offer.ownedBy.name ?? ""}
                  ownedByImage={i.offer.ownedBy.image ?? ""}
                  ownedById={i.offer.ownedBy.userId ?? ""}
                  status={i.offer.status ?? ""}
                  courseId={i.offer.courseId}
                  teeTimeId={i.offer.details.teeTimeId ?? ""}
                  timezoneCorrection={course?.timezoneCorrection}
                  openCancelOffer={() => openCancelOffer(i)}
                  openManageOffer={() => openManageOffer(i)}
                />
              ))}
          </tbody>
        </table>
      </div>
      <CancelOffer
        isCancelOfferOpen={isCancelOfferOpen}
        setIsCancelOfferOpen={setIsCancelOfferOpen}
        selectedOffer={selectedOffer}
        refetch={refetch}
      />
      <ManageOffer
        isManageOfferOpen={isManageOfferOpen}
        setIsManageOfferOpen={setIsManageOfferOpen}
        selectedOffer={selectedOffer}
      />
    </>
  );
};

const TableHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
      {text}
    </th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
  offerPrice,
  golfers,
  status,
  ownedBy,
  ownedByImage,
  ownedById,
  courseId,
  teeTimeId,
  timezoneCorrection,
  openCancelOffer,
  openManageOffer,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: number;
  offerPrice: number;
  status: string;
  ownedBy: string;
  ownedByImage: string;
  ownedById: string;
  courseId: string;
  teeTimeId: string;
  timezoneCorrection: number | undefined;
  openCancelOffer: () => void;
  openManageOffer: () => void;
}) => {
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
          <Avatar src={iconSrc} />
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
          href={`/${courseId}/profile/${ownedById}`}
          target="_blank"
          rel="noopenner noreferrer"
          className="flex items-center gap-2 underline"
          data-testid="owned-by-id"
          data-test={ownedById}
          data-qa={courseId}
        >
          <Avatar src={ownedByImage} />
          <div className="text-primary-gray">{ownedBy}</div>
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(offerPrice)}
        <span className="font-[300]">/golfer</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {golfers} {golfers === 1 ? "golfer" : "golfers"}
      </td>
      <td className="flex items-center capitalize gap-1 whitespace-nowrap px-4 pb-3 pt-6">
        {status.toLowerCase()}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {status === "PENDING" ? (
          <div className="flex  justify-end gap-2">
            <OutlineButton
              onClick={openManageOffer}
              data-testid="manage-button-id"
            >
              Manage
            </OutlineButton>

            <FilledButton
              onClick={openCancelOffer}
              data-testid="cancel-offer-button-id"
            >
              Cancel Offer
            </FilledButton>
          </div>
        ) : null}
      </td>
    </tr>
  );
};
