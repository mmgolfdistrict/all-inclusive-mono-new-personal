"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, fullDate } from "~/utils/formatters";
import Link from "next/link";
// import { useState } from "react";
import { Avatar } from "../avatar";

// import { OutlineButton } from "../buttons/outline-button";

export const TransactionHistory = ({ teeTimeId }: { teeTimeId: string }) => {
  // const [amount, setAmount] = useState<number>(4);
  const { data, isLoading, error, isError } =
    api.history.getHistoryForTeeTime.useQuery({
      teeTimeId: teeTimeId,
    });
  const { course } = useCourseContext();

  //   const loadMore = () => {
  //   setAmount(amount + 4);
  // };

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="text-lg font-semibold">Transaction History</div>
      </div>
      <div className="flex max-w-full flex-col gap-4 overflow-auto px-4 pb-2 text-[14px] md:px-6 md:pb-3">
        {isLoading ? (
          Array(2)
            .fill(null)
            .map((_, idx) => <SkeletonRow key={idx} />)
        ) : isError && error ? (
          <div className="flex justify-center items-center h-[130px]">
            <div className="text-center">Error: {error?.message}</div>
          </div>
        ) : !data || data?.length === 0 ? (
          <div className="flex justify-center items-center h-[130px]">
            <div className="text-center">
              No transaction history for this tee time.
            </div>
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead className=" top-0 table-header-group">
              <tr className="text-left">
                <TableHeader text="Purchased by" />
                <TableHeader text="Date" />
                <TableHeader text="Sale Price" />
              </tr>
            </thead>
            <tbody className="table-row-group max-h-[300px] w-full flex-col overflow-scroll">
              {data.map((i, idx) => (
                <TableRow
                  user={i.purchasedByName ?? ""}
                  date={fullDate(i.purchasedAt, course?.timezoneCorrection)}
                  salePrice={formatMoney(i.purchaseAmount)}
                  key={idx}
                  userImage={i.purchasedByImage}
                  userId={i.purchasedById}
                  courseId={course?.id ?? ""}
                />
              ))}
            </tbody>
          </table>
        )}
        {/* {data && data.length > 0 ? (
          <OutlineButton className="mx-auto w-fit" onClick={loadMore}>
            Load more
          </OutlineButton>
        ) : null} */}
      </div>
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
  user,
  date,
  salePrice,
  userImage,
  userId,
  courseId,
}: {
  user: string;
  date: string;
  salePrice: string;
  userImage: string;
  userId: string;
  courseId: string;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="w-full gap-2 px-4 py-3">
        <Link
          href={`/${courseId}/profile/${userId}`}
          className="flex items-center gap-2"
        >
          <Avatar src={userImage ?? ""} />
          {user}
        </Link>
      </td>
      <td className="px-4 py-3">{date}</td>
      <td className="px-4 py-3">{salePrice}</td>
    </tr>
  );
};

export const SkeletonRow = () => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="w-full gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
      </td>
    </tr>
  );
};
