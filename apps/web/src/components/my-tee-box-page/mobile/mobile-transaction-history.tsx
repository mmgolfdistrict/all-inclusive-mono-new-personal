"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import type { InviteFriend } from "~/utils/types";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../../avatar";
import { OutlineButton } from "../../buttons/outline-button";
import { BookingDetails } from "../booking-details";
import { SkeletonRow } from "../skeleton-row";
import { TxnDetails } from "../txn-details";
import { type TxnHistoryType } from "../transaction-history";

export const MobileTransactionHistory = () => {
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
  const [selectedReceipt, setSelectedReceipt] = useState<TxnHistoryType | null>(
    null
  );

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
      <div className="relative flex max-w-full flex-col overflow-auto text-[14px] m-2 px-2">
        {isLoading
          ? Array(3)
            .fill(null)
            .map((_, idx) => <SkeletonRow key={idx} />)
          : txnHistory?.map((i, idx) => (
            <TableCard
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

const TableCard = ({
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
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <div className="card-body">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody className="text-xs text-gray-700 bg-gray-50">
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Course</th>
              <td>
                <div className="items-center">
                  <Avatar src={iconSrc} />
                  <div className="flex flex-col">
                    <div className="whitespace-nowrap text-secondary-black">
                      {course}
                    </div>
                  </div>
                </div>
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
                  {playerCount > 2
                    ? `You, Guest & ${playerCount - 2} ${playerCount - 2 === 1 ? "golfer" : "golfers"}`
                    : golfers.map((i, idx) => {
                      if (playerCount === 1) return "Guest";
                      if (idx === playerCount - 1) return `& You`;
                      if (idx === playerCount - 2) return `Guest `;
                      return `Guest, `;
                    })}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="px-2 py-1">Status</th>
              <td>
                <div className="flex items-center gap-1 whitespace-nowrap capitalize">
                  {status.toLowerCase()}
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Transaction Total</th>
              <td>
                <div className="whitespace-nowrap">
                  {formatMoney(purchasePrice * golfers.length)}
                </div>
              </td>
            </tr>
            <tr>
              <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
                <div className="col-span-3 flex w-full justify-center gap-12">
                  <OutlineButton className="w-full" onClick={openReceipt} data-testid="receipt-button-id">
                    Receipt
                  </OutlineButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
