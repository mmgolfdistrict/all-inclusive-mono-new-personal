import { formatMoney, formatTime } from "@golf-district/shared";
import { TableCell, TableRow } from "@mui/material";
import { useSidebar } from "~/hooks/useSidebar";
import type { Dispatch, SetStateAction } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import type { TxnHistoryType } from "./cashouts";
import { FilledButton } from "../buttons/filled-button";

type BookingDetailsProps = {
  isReceiptOpen: boolean;
  setIsReceiptOpen: Dispatch<SetStateAction<boolean>>;
  selectedReceipt: TxnHistoryType | null;
  onClickDownload: () => void
};

export const TransactionDetails = ({
  isReceiptOpen,
  setIsReceiptOpen,
  selectedReceipt,
  onClickDownload
}: BookingDetailsProps) => {
  const { toggleSidebar } = useSidebar({
    isOpen: isReceiptOpen,
    setIsOpen: setIsReceiptOpen,
  });

  return (
    <>
      {isReceiptOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur`}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isReceiptOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Cash out Reciept</div>
            <button
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isReceiptOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto p-4">
            <table border={0} cellPadding={0} cellSpacing={0} width="100%">
              <TableRow>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Date:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {selectedReceipt?.createdDateTime
                    ? formatTime(selectedReceipt?.createdDateTime)
                    : "-"}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Amount:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {selectedReceipt?.amount
                    ? formatMoney(selectedReceipt?.amount / 100)
                    : "-"}
                </TableCell>
              </TableRow>
            </table>
            <div className="flex flex-col gap-2 px-4 pb-8">
            <FilledButton onClick={onClickDownload} data-testid="download-cash-out-button-id">Download</FilledButton>
              <OutlineButton
                onClick={() => setIsReceiptOpen(false)}
                data-testid="cancel-button-id"
              >
                Close
              </OutlineButton>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
