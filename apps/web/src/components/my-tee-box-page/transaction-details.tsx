import { formatMoney, formatTime } from "@golf-district/shared";
import { TableCell, TableRow } from "@mui/material";
import { useSidebar } from "~/hooks/useSidebar";
import type { Dispatch, SetStateAction } from "react";
import { OutlineButton } from "../buttons/outline-button";
import type { TxnHistoryType } from "./cashouts";
import { FilledButton } from "../buttons/filled-button";
import Flyout from "../modal/flyout";
import { Modal } from "../modal/modal";
import { useMediaQuery } from "usehooks-ts";

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
  useSidebar({
    isOpen: isReceiptOpen,
    setIsOpen: setIsReceiptOpen,
  });

  const isMobile = useMediaQuery("(max-width: 768px)");

  const TransactionDetailData = ({
    setIsReceiptOpen,
    selectedReceipt,
    onClickDownload
  }: Omit<BookingDetailsProps, "isReceiptOpen">) => {
    return (<div className="
      flex h-full flex-col justify-between overflow-y-auto p-4"
    >
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
    </div>);
  };

  return isMobile ? (
    <Modal
      isOpen={isReceiptOpen}
      title="Cash out Reciept"
      onClose={() => setIsReceiptOpen(false)}
    >
      <TransactionDetailData
        setIsReceiptOpen={setIsReceiptOpen}
        selectedReceipt={selectedReceipt}
        onClickDownload={onClickDownload}
      />
    </Modal>
  ) : (
    <Flyout
      title="Cash out Reciept"
      isOpen={isReceiptOpen}
      setIsOpen={setIsReceiptOpen}
    >
      <TransactionDetailData
        setIsReceiptOpen={setIsReceiptOpen}
        selectedReceipt={selectedReceipt}
        onClickDownload={onClickDownload}
      />
    </Flyout>
  );
};
