import { formatDate, formatMoney } from "~/utils/formatters";
import Link from "next/link";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { TableHeader } from "./table-header";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TransactionHistory = ({ teeTimeId }: { teeTimeId: string }) => {
  return (
    <div className="flex w-full flex-col text-[14px] gap-4 bg-white text-primary-gray">
      <div className="border-secondary-gray flex justify-between gap-4 border-b pb-2">
        <div className="font-semibold">Transaction History</div>
      </div>
      <div className="flex max-w-full flex-col gap-4 overflow-auto">
        {/* {isLoading ? (
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
        ) : ( */}
        <div className="max-h-[300px] overflow-auto w-full">
          <table className="w-full">
            <thead className="top-0">
              <tr className="text-left">
                <TableHeader text="Purchased by" />
                <TableHeader text="Date" />
                <TableHeader className="text-right" text="Sale Price" />
              </tr>
            </thead>
            <tbody className=" w-full flex-col">
              {/* {data.map((i, idx) => ( */}
              <TableRow
                purchasedByUsername={"mrjones8"}
                date={formatDate("2024-11-24 10:15:00")}
                salePrice={formatMoney(500)}
                userImage={"/defaults/default-profile.webp"}
                userId={"a40fb164-18cd-4458-83a8-9da592ca1ae8"}
                courseId={"5df5581f-6e5c-49af-a360-a7c9fd733f22"}
              />
              <TableRow
                purchasedByUsername={"mrjones8"}
                date={formatDate("2024-11-24 10:15:00")}
                salePrice={formatMoney(500)}
                userImage={"/defaults/default-profile.webp"}
                userId={"a40fb164-18cd-4458-83a8-9da592ca1ae8"}
                courseId={"5df5581f-6e5c-49af-a360-a7c9fd733f22"}
              />
              <TableRow
                purchasedByUsername={"mrjones8"}
                date={formatDate("2024-11-24 10:15:00")}
                salePrice={formatMoney(500)}
                userImage={"/defaults/default-profile.webp"}
                userId={"a40fb164-18cd-4458-83a8-9da592ca1ae8"}
                courseId={"5df5581f-6e5c-49af-a360-a7c9fd733f22"}
              />
              {/* ))} */}
            </tbody>
          </table>
        </div>
        {/* )} */}
        {/* {data && data.length > 0 ? ( */}
        <OutlineButton className="mx-auto px-8 !rounded-full">
          Load more
        </OutlineButton>
        {/* ) : null} */}
      </div>
    </div>
  );
};

const TableRow = ({
  purchasedByUsername,
  date,
  salePrice,
  userImage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  courseId,
}: {
  purchasedByUsername: string;
  date: string;
  salePrice: string;
  userImage: string;
  userId: string;
  courseId: string;
}) => {
  return (
    <tr className="w-full border-b border-stroke whitespace-nowrap text-[12px] h-[50px]">
      <td className="pr-2">
        <Link
          href={`#`}
          // href={`/${courseId}/profile/${userId}`}
          className="flex items-center gap-2"
        >
          <Avatar src={userImage ?? ""} />
          {purchasedByUsername}
        </Link>
      </td>
      <td className="pr-2">{date}</td>
      <td className="text-right">{salePrice}</td>
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
