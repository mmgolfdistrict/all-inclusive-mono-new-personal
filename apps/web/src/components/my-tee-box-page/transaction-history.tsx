"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import type { InviteFriend } from "~/utils/types";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { BookingDetails } from "./booking-details";
import { SkeletonRow } from "./skeleton-row";
import { TxnDetails } from "./txn-details";

export type TxnHistoryType = {
  // courseName: string;
  // courseLogo: string;
  // date: string;
  // firstHandPrice: number;
  // golfers: string[];
  // pricePerGolfer: number[];
  // bookingIds: string[];
  // playerCount?: number;
  // status: string; //"SOLD" | "PURCHASED" |
  courseId: string;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  cartFeePrice:number;
  pricePerGolfer: number[];
  golfers: InviteFriend[];
  bookingIds: string[];
  status: string;
  playerCount?: number;
  sellerServiceFee: number;
  receiveAfterSale: number;
  weatherGuaranteeAmount: number;
  weatherGuaranteeId: string;
};

export const TransactionHistory = () => {
  // const [amount, setAmount] = useState<number>(4);
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isTxnDetailsOpen, setIsTxnDetailsOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const { data, isLoading, isError, error } =
    api.teeBox.getTransactionHistory.useQuery(
      {
        courseId: courseId ?? "",
      },
      { enabled: !!courseId }
    );
  const [selectedTxn, setSelectedTxn] = useState<TxnHistoryType | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TxnHistoryType | null>(null);

  function sortByDate(objectOfObjects: Record<string, TxnHistoryType>) {
    const arrayOfObjects: TxnHistoryType[] = Object.values(objectOfObjects);
    arrayOfObjects.sort((a, b) => {
      const dateA = Number(new Date(a.date));
      const dateB = Number(new Date(b.date));
      return dateB - dateA;
    });

    return arrayOfObjects;
  }

  const txnHistory = useMemo(() => {
    if (!data || Array.isArray(data)) return undefined;
    return sortByDate(data as Record<string, TxnHistoryType>);
  }, [data]);
  console.log(txnHistory);
  // const loadMore = () => {
  //   setAmount(amount + 4);
  // };

  const openTxnDetails = (txn: TxnHistoryType) => {
    setSelectedTxn(txn);
    setIsTxnDetailsOpen(true);
  };

  const openReceipt = (i: TxnHistoryType) => {
    setSelectedReceipt(i);
    setIsReceiptOpen(true);
  };

  useEffect(() => {
    if (!isTxnDetailsOpen) {
      setSelectedTxn(null);
    }
  }, [isTxnDetailsOpen]);

  useEffect(() => {
    if (!selectedReceipt) {
      setSelectedReceipt(null);
    }
  }, [selectedReceipt]);

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching tee times"}
      </div>
    );
  }

  if (
    (!txnHistory || txnHistory.length === 0) &&
    !isLoading &&
    !isError &&
    !error
  ) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        No transaction history found
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
              <TableHeader text="Price" />
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
              : txnHistory?.map((i, idx) => (
                  <TableRow
                    course={i.courseName}
                    date={i.date}
                    iconSrc={i.courseLogo}
                    key={idx}
                    purchasePrice={i.pricePerGolfer[0] ?? i.firstHandPrice}
                    golfers={i.golfers}
                    playerCount={i.playerCount}
                    status={i.status}
                    openTxnDetails={() => openTxnDetails(i)}
                    openReceipt={() => openReceipt(i)}
                    timezoneCorrection={course?.timezoneCorrection}
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
      <TxnDetails
        isTxnDetailsOpen={isTxnDetailsOpen}
        setIsTxnDetailsOpen={setIsTxnDetailsOpen}
        selectedTxn={selectedTxn}
      />
      <BookingDetails
        isReceiptOpen={isReceiptOpen}
        setIsReceiptOpen={setIsReceiptOpen}
        selectedReceipt={selectedReceipt}
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
  purchasePrice,
  golfers,
  status,
  timezoneCorrection,
  openReceipt,
  playerCount = 1,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: InviteFriend[];
  purchasePrice: number;
  status: string;
  timezoneCorrection: number | undefined;
  playerCount?: number;
  openTxnDetails: () => void;
  openReceipt: () => void;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar src={iconSrc} />
          <div className="flex flex-col">
            <div className="whitespace-nowrap text-secondary-black">
              {course}
            </div>
            <div className="text-primary-gray">
              {formatTime(date, false, timezoneCorrection)}
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(purchasePrice * golfers.length)}
        <span className="font-[300]"> Transaction Total</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {playerCount > 2
          ? `You, Guest & ${playerCount - 2} ${
              playerCount - 2 === 1 ? "golfers" : "golfers"
            }`
          : golfers.map((i, idx) => {
              if (playerCount === 1) return "Guest";
              if (idx === playerCount - 1) return `& You`;
              if (idx === playerCount - 2) return `Guest `;
              return `Guest, `;
            })}
      </td>
      <td className="flex items-center gap-1 whitespace-nowrap px-4 pb-3 pt-6 capitalize">
        {status.toLowerCase()}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="col-span-3 flex w-full justify-end gap-2">
          {/* <OutlineButton
            onClick={openTxnDetails}
            data-testid="details-button-id"
          >
            Details
          </OutlineButton> */}
          <OutlineButton onClick={openReceipt} data-testid="receipt-button-id">
            Receipt
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
