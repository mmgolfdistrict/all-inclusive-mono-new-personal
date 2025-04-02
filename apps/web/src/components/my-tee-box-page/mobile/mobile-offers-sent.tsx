"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "../../avatar";
import { FilledButton } from "../../buttons/filled-button";
import { OutlineButton } from "../../buttons/outline-button";
import { CancelOffer } from "./../cancel-offer";
import { ManageOffer } from "./../manage-offer";
import { SkeletonRow } from "./../skeleton-row";
import { type OfferSentType } from "../offers-sent";

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
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if ((!data || data.length === 0) && !isLoading && !isError && !error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        No offers sent
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
          : data.map((i, idx) => (
            <TableCard
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

const TableCard = ({
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
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <div className="card-body">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody className="text-xs text-gray-700 bg-gray-50">
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Course</th>
              <td>
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
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Owned By</th>
              <td>
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
              <th scope="col" className="px-2 py-1">Golfers</th>
              <td>
                <div className="whitespace-nowrap">
                  {golfers} {golfers === 1 ? "golfer" : "golfers"}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="px-2 py-1">Status</th>
              <td>
                <div className="flex items-center gap-1 whitespace-nowrap capitalize">
                  {status.toLowerCase()}
                </div>
              </td>
            </tr>
            <tr>
              <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
                {status === "PENDING" ? (
                  <div className="flex  justify-center gap-2">
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
          </tbody>
        </table>
      </div>
    </div>
  );
};
