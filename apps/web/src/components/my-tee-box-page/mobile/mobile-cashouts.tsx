"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { useMemo, useState } from "react";
import { OutlineButton } from "../../buttons/outline-button";
import { SkeletonRow } from "../skeleton-row";
import { TransactionDetails } from "../transaction-details";
import { useUserContext } from "~/contexts/UserContext";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { type TxnHistoryType } from "../cashouts";

pdfMake.vfs = pdfFonts

export const MobileCashouts = () => {
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const [selectedReceipt, setSelectedReceipt] = useState<TxnHistoryType | null>(
    null
  );
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

  const downloadCashoutReceipt = () => {
    const amount = (selectedReceipt?.amount || 0) / 100;
    const datetime = selectedReceipt?.createdDateTime || '';
    const docDefinition = {
      content: [
        { text: "Withdrawal Reciept", style: "header", alignment: "center" },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                { text: "Name", style: "tableHeader", border: [] },
                { text: user?.name, border: [] },
              ],
              [
                { text: "Email", style: "tableHeader", border: [] },
                { text: user?.email, border: [] }
              ],
              [
                { text: "Amount", style: "tableHeader", border: [] },
                { text: formatMoney(amount), border: [] }
              ],
              [
                { text: "Date", style: "tableHeader", border: [] },
                { text: formatTime(datetime), border: [] }
              ],
              [
                { text: "Status", style: "tableHeader", border: [] },
                { text: selectedReceipt?.externalStatus, border: [] }
              ]
            ]
          },
          layout: "noBorders"
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        tableHeader: {
          bold: true
        }
      }
    };

    pdfMake.createPdf(docDefinition).download("withdrawal-receipt.pdf");
  };

  return (
    <div className="relative flex max-w-full flex-col gap-4 overflow-auto pb-2 text-[14px] mx-4">
      {isLoading
        ? Array(3)
          .fill(null)
          .map((_, idx) => <SkeletonRow key={idx} />)
        : txnHistory?.map((i, idx) => (
          <TableCard
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
      <TransactionDetails
        isReceiptOpen={isReceiptOpen}
        setIsReceiptOpen={setIsReceiptOpen}
        selectedReceipt={selectedReceipt}
        onClickDownload={downloadCashoutReceipt}
      />
    </div>
  );
};

const TableCard = ({
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
    <div className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2">
      <div className="card-body">
        <table className="w-full text-sm text-left text-gray-500">
          <tbody className="text-xs text-gray-700 bg-gray-50">
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Date</th>
              <td>{time}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="px-2 py-1">Amount</th>
              <td>{amount}</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap px-2 py-2" colSpan={2}>
                <OutlineButton
                  onClick={openReceipt} data-testid="receipt-button-id"
                  className="w-full"
                >
                  Receipt
                </OutlineButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
