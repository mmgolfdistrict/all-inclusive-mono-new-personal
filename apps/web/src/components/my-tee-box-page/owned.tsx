"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import { type InviteFriend } from "~/utils/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { CancelListing } from "./cancel-listing";
import { ListTeeTime } from "./list-tee-time";
import { ManageOwnedTeeTime } from "./manage-owned-tee-time";
import { SkeletonRow } from "./skeleton-row";

export type OwnedTeeTime = {
  courseName: string;
  courseLogo: string;
  courseId: string;
  date: string;
  firstHandPrice: number;
  golfers: InviteFriend[];
  purchasedFor: number;
  bookingIds: string[];
  status: "UNLISTED" | "LISTED";
  offers: string;
  listingId: null | string;
  listedSpots: null | string[];
  teeTimeId: string;
  listPrice: number | null;
  minimumOfferPrice: number;
  weatherGuaranteeAmount?: number;
  selectedSlotsCount?: "1" | "2" | "3" | "4";
  slots?: number;
  bookingStatus: string;
  slotsData?: string[];
  isGroupBooking: boolean;
  groupId: string;
  allowSplit?: boolean;
  totalMerchandiseAmount: number;
};

export const Owned = () => {
  // const [amount, setAmount] = useState<number>(4);
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isListTeeTimeOpen, setIsListTeeTimeOpen] = useState<boolean>(false);
  const [isCancelListingOpen, setIsCancelListingOpen] =
    useState<boolean>(false);
  const [isManageOwnedTeeTimeOpen, setIsManageOwnedTeeTimeOpen] =
    useState<boolean>(false);
  const { data, isLoading, isError, error, refetch } =
    api.teeBox.getOwnedTeeTimes.useQuery(
      {
        courseId: courseId ?? "",
      },
      { enabled: !!courseId }
    );

  const [selectedTeeTime, setSelectedTeeTime] = useState<
    OwnedTeeTime | undefined
  >(undefined);
  const { user } = useUserContext();

  const ownedTeeTimes = useMemo(() => {
    if (!data) return undefined;
    return Object.keys(data)
      .map((key) => {
        return { ...data[key], teeTimeId: data[key].teeTimeId } as OwnedTeeTime;
      })
      .sort((a, b) => {
        const dateA = a.date;
        const dateB = b.date;

        return Number(new Date(dateA)) - Number(new Date(dateB));
      });
  }, [data]);
  // const loadMore = () => {
  //   setAmount(amount + 4);
  // };

  const openListTeeTime = (teeTime: OwnedTeeTime) => {
    setSelectedTeeTime(teeTime);
    setIsListTeeTimeOpen(true);
  };

  const openCancelListing = (teeTime: OwnedTeeTime) => {
    setSelectedTeeTime(teeTime);

    setIsCancelListingOpen(true);
  };

  const openManageListTeeTime = (teeTime: OwnedTeeTime) => {
    setSelectedTeeTime(teeTime);
    setIsManageOwnedTeeTimeOpen(true);
  };

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if (
    (!ownedTeeTimes || ownedTeeTimes?.length === 0) &&
    !isLoading &&
    !isError &&
    !error
  ) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        No owned tee times found
      </div>
    );
  }

  return (
    <>
      <div className="relative flex max-w-full flex-col gap-4  overflow-auto pb-2  text-[14px] md:pb-3">
        <table className="w-full table-auto  overflow-auto">
          <thead className="top-0 table-header-group">
            <tr className="text-left">
              <TableHeader text="Details" />
              {/* <TableHeader text="Purchase Price" /> */}
              <TableHeader text="Golfers" />
              <TableHeader text="Status" />
              <TableHeader text="Booking Status" />
              <TableHeader text="" className="text-right" />
            </tr>
          </thead>
          <tbody className={`max-h-[300px] w-full flex-col overflow-scroll`}>
            {isLoading
              ? Array(3)
                .fill(null)
                .map((_, idx) => <SkeletonRow key={idx} />)
              : ownedTeeTimes?.map((i, idx) => (
                <TableRow
                  course={i.courseName}
                  date={i.date}
                  iconSrc={i.courseLogo}
                  key={idx}
                  purchasePrice={
                    (i.purchasedFor ?? i.firstHandPrice) * i.golfers.length
                  }
                  golfers={i.golfers}
                  status={i.status}
                  offers={i.offers ? parseInt(i.offers) : undefined}
                  isListed={i.status === "LISTED"}
                  openListTeeTime={() => openListTeeTime(i)}
                  openCancelListing={() => openCancelListing(i)}
                  openManageListTeeTime={() => openManageListTeeTime(i)}
                  courseId={i.courseId}
                  teeTimeId={i.teeTimeId}
                  listingId={i.listingId}
                  ownerId={user?.id ?? ""}
                  timezoneCorrection={course?.timezoneCorrection}
                  bookingStatus={i.bookingStatus}
                  isGroupBooking={i.isGroupBooking}
                />
              ))}
          </tbody>
        </table>
        {/* <OutlineButton
          className="sticky left-1/2 mx-auto w-fit -translate-x-1/2"
          onClick={loadMore}
        >
          Load more
        </OutlineButton> */}
      </div>

      <ListTeeTime
        isListTeeTimeOpen={isListTeeTimeOpen}
        setIsListTeeTimeOpen={setIsListTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
      />
      <ManageOwnedTeeTime
        isManageOwnedTeeTimeOpen={isManageOwnedTeeTimeOpen}
        setIsManageOwnedTeeTimeOpen={setIsManageOwnedTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
      />
      <CancelListing
        isCancelListingOpen={isCancelListingOpen}
        setIsCancelListingOpen={setIsCancelListingOpen}
        courseName={selectedTeeTime?.courseName}
        courseLogo={selectedTeeTime?.courseLogo}
        date={selectedTeeTime?.date}
        golferCount={selectedTeeTime?.slots || 0}
        pricePerGolfer={
          selectedTeeTime?.listPrice ? selectedTeeTime?.listPrice / 100 : 0
        }
        listingId={selectedTeeTime?.listingId ?? undefined}
        isGroupBooking={selectedTeeTime?.isGroupBooking}
        groupBookingId={selectedTeeTime?.groupId ?? undefined}
        refetch={refetch}
        allowSplit={selectedTeeTime?.allowSplit}
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
  golfers,
  status,
  offers,
  isListed,
  courseId,
  teeTimeId,
  listingId,
  ownerId,
  timezoneCorrection,
  openListTeeTime,
  openCancelListing,
  openManageListTeeTime,
  bookingStatus,
  isGroupBooking,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: InviteFriend[];
  purchasePrice: number;
  status: "UNLISTED" | "LISTED";
  offers?: number;
  isListed: boolean;
  courseId: string;
  teeTimeId: string;
  listingId: null | string;
  ownerId: string;
  timezoneCorrection: number | undefined;
  openListTeeTime: () => void;
  openCancelListing: () => void;
  openManageListTeeTime: () => void;
  bookingStatus: string;
  isGroupBooking: boolean;
}) => {
  const href = useMemo(() => {
    if (isListed) {
      return `/${courseId}/${teeTimeId}/listing/${listingId}`;
    }
    return `/${courseId}/${teeTimeId}/owner/${ownerId}`;
  }, [courseId, teeTimeId, listingId, ownerId, isListed]);

  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        {isGroupBooking ? (
          <div className="flex items-center gap-2">
            <Avatar src={iconSrc} />
            <div className="flex flex-col">
              <div className="whitespace-nowrap underline text-secondary-black">
                {course}
              </div>
              <div className="text-primary-gray unmask-time">
                {formatTime(date, false, timezoneCorrection)}
              </div>
            </div>
          </div>
        ) : (
          <Link
            href={href}
            className="flex items-center gap-2"
            data-testid="course-tee-time-listing-id"
            data-test={teeTimeId}
            data-qa={courseId}
          >
            <Avatar src={iconSrc} />
            <div className="flex flex-col">
              <div className="whitespace-nowrap underline text-secondary-black">
                {course}
              </div>
              <div className="text-primary-gray unmask-time">
                {formatTime(date, false, timezoneCorrection)}
              </div>
            </div>
          </Link>
        )}
      </td>
      {/* <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(purchasePrice)}
      </td> */}
      <td className="whitespace-nowrap px-4 py-3 unmask-players">
        {golfers.length > 2
          ? `You, ${golfers[1]?.name || "Guest"} & ${golfers.length - 2} ${golfers.length - 2 === 1 ? "golfers" : "golfers"
          }`
          : golfers.map((i, idx) => {
            if (idx === 0) return "You ";
            if (golfers.length === 1) return "You";
            if (idx === golfers.length - 1) return `& ${i.name || "Guest"}`;
            if (idx === golfers.length - 2) return `${i.name || "Guest"} `;
            return `${i.name || "Guest"}, `;
          })}
      </td>
      <td className="flex items-center gap-1 whitespace-nowrap px-4 pb-3 pt-6">
        {offers ? (
          <div className="flex items-center gap-1">
            <div className="flex min-w-[22px] items-center justify-center rounded-full bg-alert-red px-1.5 text-white">
              {offers}
            </div>
            <div className="text-primary">
              {offers === 1 ? "Offer" : "Offers"},
            </div>
          </div>
        ) : null}
        <span className="capitalize">{status.toLowerCase()}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="capitalize">{bookingStatus.toLowerCase()}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex w-full justify-end gap-2">
          <div id="manage-teetime-button">
            <OutlineButton
              onClick={openManageListTeeTime}
              data-testid="manage-button-id"
              data-test={courseId}
              data-qa={course}
            >
              Invite Players
            </OutlineButton>
          </div>
          {isListed ? (
            <FilledButton
              className="min-w-[145px]"
              onClick={openCancelListing}
              data-testid="cancel-listing-button-id"
              data-test={courseId}
              data-qa={course}
            >
              Cancel Listing
            </FilledButton>
          ) : (
            <FilledButton
              className="min-w-[145px]"
              onClick={openListTeeTime}
              data-testid="sell-button-id"
              data-test={courseId}
              data-qa={course}
              id="sell-teetime-button"
            >
              Sell
            </FilledButton>
          )}
        </div>
      </td>
    </tr>
  );
};
