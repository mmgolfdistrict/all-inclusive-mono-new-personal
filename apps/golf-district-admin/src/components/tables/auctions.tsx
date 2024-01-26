import { formatDateForAuction } from "~/utils/formatters";
import { useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { AuctionForm } from "../forms/auction-form";
import { TableHeader } from "./table-header";

export const Auctions = () => {
  const [isEditAuctionOpen, setIsEditAuctionOpen] = useState<boolean>(false);

  const openEditAuction = () => {
    setIsEditAuctionOpen(true);
  };

  const closeEditAuction = () => {
    setIsEditAuctionOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Name" />
            <TableHeader className="pr-2" text="Course" />
            <TableHeader className="pr-2" text="Location" />
            <TableHeader className="pr-2" text="Start Date" />
            <TableHeader className="pr-2" text="End Date" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            auctionName="Auction Name #1"
            courseName="Encinitas Ranch"
            location="San Diego, CA"
            startDate={formatDateForAuction("12/14/2023")}
            endDate={formatDateForAuction("01/14/2024")}
            status="Active"
            openEditAuction={openEditAuction}
          />
        </tbody>
      </table>
      {isEditAuctionOpen && (
        <AuctionForm isEdit={true} onClose={closeEditAuction} />
      )}
    </>
  );
};

const TableRow = ({
  auctionName,
  courseName,
  location,
  startDate,
  endDate,
  status,
  openEditAuction,
}: {
  auctionName: string;
  courseName: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  openEditAuction: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2">{auctionName}</td>
      <td className="pr-2">{courseName}</td>
      <td className="pr-2">{location}</td>
      <td className="pr-2">{startDate}</td>
      <td className="pr-2">{endDate}</td>
      <td className="pr-2">{status}</td>
      <td>
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditAuction}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
