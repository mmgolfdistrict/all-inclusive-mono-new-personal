"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import Link from "next/link";
import { Avatar } from "../avatar";

export const TeeTimeHistory = ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) => {
  const { data, isLoading, error } = api.user.getTeeTimeHistoryForUser.useQuery(
    { userId, courseId }
  );
  const { course } = useCourseContext();
  const timezoneCorrection = course?.timezoneCorrection ?? 0;

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="text-lg font-semibold">Tee Time History</div>
      </div>
      {!isLoading && error ? (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pb-2 h-[200px] text-[14px] md:px-6 md:pb-3">
          <div className="text-center">{error?.message}</div>
        </div>
      ) : !isLoading && data?.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pb-2 h-[200px] text-[14px] md:px-6 md:pb-3">
          <div className="text-center">No tee times found.</div>
        </div>
      ) : (
        <div className="flex max-w-full flex-col gap-4 overflow-auto px-4 pb-2 text-[14px] md:px-6 md:pb-3">
          <table className="w-full table-auto">
            <thead className="top-0 table-header-group">
              <tr className="text-left">
                <TableHeader text="Course" />
                <TableHeader text="Date" className="text-right" />
              </tr>
            </thead>
            <tbody className="table-row-group max-h-[300px] w-full flex-col overflow-scroll">
              {isLoading && !data
                ? Array(3)
                    .fill(null)
                    .map((_, idx) => <SkeletonRow key={idx} />)
                : data?.map((i, idx) => (
                    <TableRow
                      course={i.courseName ?? ""}
                      date={i.date ?? ""}
                      iconSrc={i.courseImage}
                      key={idx}
                      courseId={i.courseId ?? ""}
                      timezoneCorrection={timezoneCorrection}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
    <th className={`whitespace-nowrap px-4 ${className ?? ""}`}>{text}</th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
  courseId,
  timezoneCorrection,
}: {
  course: string;
  date: string;
  iconSrc: string;
  courseId: string;
  timezoneCorrection: number;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="w-full gap-2 px-4 py-3">
        <Link
          href={`/${courseId}`}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="course-id"
          data-test={courseId}
        >
          <Avatar src={iconSrc} />
          {course}
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {formatTime(date, true, timezoneCorrection)}
      </td>
    </tr>
  );
};

const SkeletonRow = () => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="h-6 w-[100px] bg-gray-200 rounded-md animate-pulse" />
      </td>
    </tr>
  );
};
