"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import { type InviteFriend } from "~/utils/types";
import { useMemo, useState } from "react";
import { Avatar } from "../../avatar";
import { FilledButton } from "../../buttons/filled-button";
import { OutlineButton } from "../../buttons/outline-button";
import { CancelListing } from "../cancel-listing";
import { ListTeeTime } from "../list-tee-time";
import { ManageOwnedTeeTime } from "../manage-owned-tee-time";
import { SkeletonRow } from "../skeleton-row";
import { type OwnedTeeTime } from "../owned";
import Link from "next/link";
import { CollectPayment } from "../collect-payment";

export const MobileOwned = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isListTeeTimeOpen, setIsListTeeTimeOpen] = useState<boolean>(false);
  const [isCancelListingOpen, setIsCancelListingOpen] =
    useState<boolean>(false);
  const [isCollectTeeTimeOpen, setIsCollectPaymentOpen] =
    useState<boolean>(false);
  const [isManageOwnedTeeTimeOpen, setIsManageOwnedTeeTimeOpen] =
    useState<boolean>(false);
  const [sideBarClose, setIsSideBarClose] = useState<boolean>(false)
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
  const { data: isCollectPaymemtEnabled } = api.checkout.isCollectPaymentEnabled.useQuery({});
  const ownedTeeTimes = useMemo(() => {
    if (!data) return undefined;
    return Object.keys(data).map((key) => {
      return { ...data[key], teeTimeId: data[key].teeTimeId } as OwnedTeeTime;
    }).sort((a, b) => {
      const dateA = a.date;
      const dateB = b.date;

      return Number(new Date(dateA)) - Number(new Date(dateB));
    });
  }, [data]);

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
  const collectPaymentList = (teeTime: OwnedTeeTime) => {
    setIsCollectPaymentOpen(true);
    setSelectedTeeTime(teeTime);
  }

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
      <div className="relative flex max-w-full flex-col overflow-auto text-[14px] m-2 px-2">
        {isLoading
          ? Array(3)
            .fill(null)
            .map((_, idx) => <SkeletonRow key={idx} />)
          : ownedTeeTimes?.map((i, idx) => (
            <TableCard
              course={i.courseName}
              date={i.date}
              iconSrc={i.courseLogo}
              key={idx}
              purchasePrice={
                (i.purchasedFor ?? i.firstHandPrice) * i.golfers.length
              }
              golfers={i.golfers}
              status={i.status}
              // offers={i.offers ? parseInt(i.offers) : undefined}
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
              isCollectPaymemtEnabled={isCollectPaymemtEnabled ?? false}
              collectPaymentList={() => collectPaymentList(i)}
            />
          ))}
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
      <CollectPayment
        isCollectPaymentOpen={isCollectTeeTimeOpen}
        setIsCollectPaymentOpen={setIsCollectPaymentOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
        setIsSideBarClose={setIsSideBarClose}
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

const TableCard = ({
  iconSrc,
  date,
  course,
  golfers,
  status,
  // offers,
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
  isCollectPaymemtEnabled,
  collectPaymentList
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: InviteFriend[];
  purchasePrice: number;
  status: "UNLISTED" | "LISTED";
  // offers?: number;
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
  isCollectPaymemtEnabled: boolean;
  collectPaymentList: () => void;
}) => {
  const href = useMemo(() => {
    if (isListed) {
      return `/${courseId}/${teeTimeId}/listing/${listingId}`;
    }
    return `/${courseId}/${teeTimeId}/owner/${ownerId}`;
  }, [courseId, teeTimeId, listingId, ownerId, isListed]);

  return (
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <div className="card-body">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody className="text-xs text-gray-700 bg-gray-50">
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Course</th>
              <td>
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
                      <div className="whitespace-normal overflow-y-auto underline text-secondary-black">
                        {course}
                      </div>
                      <div className="text-primary-gray unmask-time">
                        {formatTime(date, false, timezoneCorrection)}
                      </div>
                    </div>
                  </Link>
                )}
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">
                <p>Tee Time</p>
                <p># of Golfers</p>
              </th>
              <td>
                <div className="text-primary-gray unmask-time">{formatTime(date, false, timezoneCorrection)}</div>
                <div className="whitespace-nowrap unmask-players">
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
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="px-2 py-1">
                <p>Status</p>
                <p>Booking Status</p>
              </th>
              <td>
                <div className="whitespace-nowrap capitalize">
                  {status.toLowerCase()}
                </div>
                <div className="whitespace-nowrap capitalize">
                  {bookingStatus.toLowerCase()}
                </div>
              </td>
            </tr>
            <tr>
              <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
                <div className="flex w-full justify-center gap-2">
                  {golfers.length > 1 && isCollectPaymemtEnabled && (
                    <div className="flex flex-col items-center justify-center min-h-[100px]">
                      <FilledButton
                        className="min-w-[145px] mt-5"
                        onClick={collectPaymentList}
                        data-testid="sell-button-id"
                        data-test={courseId}
                        data-qa={course}
                        id="sell-teetime-button"
                      >
                        Collect payment
                      </FilledButton>
                      <span className="text-xs text-gray-500 mt-1">Split Cost with your group</span>
                    </div>
                  )}
                  {golfers.length > 1 && (
                    <div className="flex flex-col items-center justify-center min-h-[100px]" id="manage-teetime-button">
                      <OutlineButton
                        onClick={openManageListTeeTime}
                        data-testid="manage-button-id"
                        data-test={courseId}
                        data-qa={course}
                      >
                        Invite Players
                      </OutlineButton>
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center min-h-[100px]">
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
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};
