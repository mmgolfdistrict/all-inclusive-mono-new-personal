"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, fullDate } from "~/utils/formatters";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "../avatar";
import { Heart } from "../icons/heart";
import { ModalWrapper } from "../modal/modal-wrapper";

export const TransactionHistory = ({ teeTimeId }: { teeTimeId: string }) => {
  const { data, isLoading, error, isError } =
    api.history.getHistoryForTeeTime.useQuery({
      teeTimeId: teeTimeId,
    });
  const { data: watcherData } = api.searchRouter.getTeeTimeById.useQuery({
    teeTimeId: teeTimeId,
  });
  const [isViewWatchersOpen, setIsViewWatchersOpen] = useState<boolean>(false);

  const { course } = useCourseContext();

  const watchers = watcherData?.watchers ?? [];

  const openWatchers = () => {
    setIsViewWatchersOpen(true);
  };

  const closeWatchers = () => {
    setIsViewWatchersOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 items-center md:px-6 md:py-4">
        <div className="text-lg font-semibold">Transaction History</div>
        {watchers?.length > 0 ? (
          <button
            onClick={openWatchers}
            className="flex text-sm gap-[2px] items-center border border-stroke rounded-md px-2"
            data-testid="open-watchers-button-id"
          >
            <Heart className={`w-[13px] md:w-[18px]`} fill={"#40942A"} />
            {watchers.length === 10 ? "10+" : watchers.length}
          </button>
        ) : null}
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
      {isViewWatchersOpen ? (
        <ModalWrapper
          isOpen={isViewWatchersOpen}
          onClose={closeWatchers}
          className="pt-4"
        >
          <div className="flex flex-col gap-4">
            <h1>Current Watchers</h1>
            <div className="w-full max-h-[300px] overflow-auto">
              {watchers?.map((watcher, idx) => (
                <Link
                  href={`/${course?.id}/profile/${watcher?.userId}`}
                  key={idx}
                  target={"_blank"}
                  rel={"noopener noreferrer"}
                  className={`flex max-w-[98%] w-full gap-2 items-center p-2 ${
                    idx !== watchers.length - 1 ? "border-b border-stroke" : ""
                  }`}
                  data-testid="watcher-profile-id"
                  data-test={watcher?.userId}
                  data-qa={course?.id}
                >
                  <Avatar src={watcher.image ?? ""} />
                  <div>{watcher.handle}</div>
                </Link>
              ))}
            </div>
          </div>
        </ModalWrapper>
      ) : null}
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
          data-testid="profile-user-id"
          data-test={userId}
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
