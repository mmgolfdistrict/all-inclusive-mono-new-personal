"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import type { InviteFriend } from "~/utils/types";
import { useMemo, useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { SkeletonRow } from "./skeleton-row";
import { TransactionDetails } from "./transaction-details";

export type TxnHistoryType = {
  courseId: string;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  pricePerGolfer: number[];
  golfers: InviteFriend[];
  bookingIds: string[];
  status: string;
  playerCount?: number;
  sellerServiceFee: number;
  receiveAfterSale: number;
  weatherGuaranteeAmount: number;
  weatherGuaranteeId: string;
  amount?: number | undefined;
  externalStatus?: string;
  createdDateTime?: string;
};

export const Cashouts = () => {
  const { course } = useCourseContext();
  const [selectedReceipt, setSelectedReceipt] = useState<TxnHistoryType | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const { data, isLoading, isError, error } =
    api.cashOut.getCashoutTransactions.useQuery({});

  function sortByDate(objectOfObjects) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const arrayOfObjects: TxnHistoryType[] = Object.values(objectOfObjects);
    arrayOfObjects.sort((a, b) => {
      const dateA = Number(new Date(a.date));
      const dateB = Number(new Date(b.date));
      return dateB - dateA;
    });

    return arrayOfObjects;
  }

  const openReceipt = (i: TxnHistoryType) => {
    setSelectedReceipt(i);
    setIsReceiptOpen(true);
  };

  const txnHistory = useMemo(() => {
    if (!data || !Array.isArray(data)) return undefined;
    return sortByDate(data);
  }, [data]);

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching transaction history"}
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
    <div className="relative flex max-w-full flex-col gap-4 overflow-auto pb-2 text-[14px] md:pb-3">
      <table className="w-full table-auto overflow-auto">
        <thead className="top-0 table-header-group">
          <tr className="text-left">
            <TableHeader text="Date" />
            <TableHeader text="Amount" />
          </tr>
        </thead>
        <tbody className={`max-h-[300px] w-full flex-col overflow-scroll`}>
          {isLoading
            ? Array(3)
                .fill(null)
                .map((_, idx) => <SkeletonRow key={idx} />)
            : txnHistory?.map((i, idx) => (
                <TableRow
                  key={idx}
                  amount={formatMoney((i?.amount ?? 0) / 100)}
                  status={i.externalStatus ?? ""}
                  time={formatTime(
                    i.createdDateTime ?? "",
                    false,
                    course?.timezoneCorrection
                  )}
                  openReceipt={() => openReceipt(i)}
                />
              ))}
        </tbody>
      </table>

      <TransactionDetails
        isReceiptOpen={isReceiptOpen}
        setIsReceiptOpen={setIsReceiptOpen}
        selectedReceipt={selectedReceipt}
      />
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
    <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
      {text}
    </th>
  );
};

const TableRow = ({
  amount,
  time,
  openReceipt,
}: {
  amount: string;
  status: string;
  time: string;
  openReceipt: () => void;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="whitespace-nowrap px-4 py-3">{time}</td>
      <td className="whitespace-nowrap px-4 py-3">{amount}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <OutlineButton onClick={openReceipt} data-testid="receipt-button-id">
          Receipt
        </OutlineButton>
      </td>
    </tr>
  );
};
