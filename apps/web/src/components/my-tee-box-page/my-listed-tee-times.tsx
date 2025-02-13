"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { ManageTeeTimeListing } from "./manage-tee-time-listing";
import { SkeletonRow } from "./skeleton-row";

export type MyListedTeeTimeType = {
  listingId: string | null;
  courseName: string;
  courseLogo: string;
  courseId: string;
  date: string;
  firstHandPrice: number;
  miniumOfferPrice: number;
  listPrice: number | null;
  status: string;
  listedSpots: string[] | null;
  teeTimeId: string;
  listedSlotsCount?: number;
  groupId: string | null;
};

export const MyListedTeeTimes = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isManageTeeTimeListingOpen, setIsManageTeeTimeListingOpen] =
    useState<boolean>(false);
  const [selectedTeeTime, setSelectedTeeTime] = useState<
    MyListedTeeTimeType | undefined
  >(undefined);
  const { data, isLoading, isError, error, refetch } =
    api.teeBox.getMyListedTeeTime.useQuery(
      {
        courseId: courseId ?? "",
      },
      { enabled: !!courseId }
    );

  const myListedTeeTimes = useMemo(() => {
    if (!data) return undefined;
    return Object.keys(data).map((key) => {
      return {
        ...data[key],
        teeTimeId: key,
      } as MyListedTeeTimeType;
    });
  }, [data]);

  const openManageListTeeTimeListing = (teeTime: MyListedTeeTimeType) => {
    setSelectedTeeTime(teeTime);
    setIsManageTeeTimeListingOpen(true);
  };

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if (
    (!myListedTeeTimes || myListedTeeTimes.length === 0) &&
    !isLoading &&
    !isError &&
    !error
  ) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        No listed tee times found
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
              <TableHeader text="List Price" />
              <TableHeader text="Golfers" />
              <TableHeader text="Status" />
              <TableHeader text="" className="text-right" />
            </tr>
          </thead>
          <tbody className={`max-h-[300px] w-full flex-col overflow-scroll`}>
            {isLoading
              ? Array(3)
                  .fill(null)
                  .map((_, idx) => <SkeletonRow key={idx} />)
              : myListedTeeTimes?.map((i, idx) => (
                  <TableRow
                    course={i.courseName}
                    date={i.date}
                    iconSrc={i.courseLogo}
                    key={idx}
                    listedPrice={i?.listPrice ?? 0}
                    golfers={i?.listedSlotsCount || 0}
                    status={i.status}
                    courseId={i.courseId}
                    teeTimeId={i.teeTimeId}
                    listingId={i.listingId ?? ""}
                    timezoneCorrection={course?.timezoneCorrection}
                    openManageListTeeTimeListing={() =>
                      openManageListTeeTimeListing(i)
                    }
                  />
                ))}
          </tbody>
        </table>
      </div>

      <ManageTeeTimeListing
        isManageTeeTimeListingOpen={isManageTeeTimeListingOpen}
        setIsManageTeeTimeListingOpen={setIsManageTeeTimeListingOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
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
  listedPrice,
  golfers,
  status,
  courseId,
  teeTimeId,
  listingId,
  timezoneCorrection,
  openManageListTeeTimeListing,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: number;
  listedPrice: number;
  status: string;
  courseId: string;
  teeTimeId: string;
  listingId: string;
  timezoneCorrection?: number;
  openManageListTeeTimeListing: () => void;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        <Link
          href={`/${courseId}/${teeTimeId}/listing/${listingId}`}
          className="flex items-center gap-2"
          data-testid="course-listing-id"
          data-test={listingId}
          data-qa={teeTimeId}
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
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(listedPrice)}
        <span className="font-[300]">/golfer</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 unmask-players">
        {golfers} {golfers === 1 ? "golfer" : "golfers"}
      </td>
      <td className="flex items-center gap-1 whitespace-nowrap px-4 pb-3 pt-6 capitalize">
        {status.toLowerCase()}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex  justify-end gap-2">
          <OutlineButton
            onClick={openManageListTeeTimeListing}
            data-testid="manage-button-id"
          >
            Manage
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
