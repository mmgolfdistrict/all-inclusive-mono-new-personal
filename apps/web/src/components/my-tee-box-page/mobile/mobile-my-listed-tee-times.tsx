"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { useMemo, useState } from "react";
import { Avatar } from "../../avatar";
import { OutlineButton } from "../../buttons/outline-button";
import { ManageTeeTimeListing } from "../manage-tee-time-listing";
import { SkeletonRow } from "../skeleton-row";
import { type MyListedTeeTimeType } from "../my-listed-tee-times";
import Link from "next/link";

const MobileMyListedTeeTimes = () => {
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
      <div className="relative flex max-w-full flex-col overflow-auto text-[14px] m-2 px-1">
        {isLoading
          ? Array(3)
            .fill(null)
            .map((_, idx) => <SkeletonRow key={idx} />)
          : myListedTeeTimes?.map((i, idx) => (
            <TableCard
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

const TableCard = ({
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
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <table className="w-full text-sm text-left text-gray-500">
        <tbody className="text-xs text-gray-700 bg-gray-50">
          <tr className="border-b border-gray-300">
            <th scope="col" className="px-2 py-1">Course</th>
            <td>
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
          </tr>
          <tr className="border-b border-gray-300">
            <th className="px-2 py-1">
              <p>List Price</p>
              <p># of Golfers</p>
            </th>
            <td>
              <div className="flex items-center gap-1 whitespace-nowrap capitalize">
                {formatMoney(listedPrice)} <span className="font-[300]">/golfer</span>
              </div>
              <div className="whitespace-nowrap unmask-players">
                {golfers} {golfers === 1 ? "golfer" : "golfers"}
              </div>
            </td>
          </tr>
          <tr>
            <th className="px-2 py-1">
              <p>Status</p>
            </th>
            <td>
              <div className="whitespace-nowrap capitalize">
                {status.toLowerCase()}
              </div>
            </td>
          </tr>
          <tr>
            <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
              <div className="flex justify-center gap-2">
                <OutlineButton
                  onClick={openManageListTeeTimeListing}
                  data-testid="manage-button-id"
                  className="w-full"
                >
                  Manage
                </OutlineButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MobileMyListedTeeTimes;