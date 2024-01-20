import { formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { ReservationForm } from "../forms/reservation-form";
import { TableHeader } from "./table-header";

export const Reservations = () => {
  const [isEditReservationOpen, setIsEditReservationOpen] =
    useState<boolean>(false);

  const openEditReservation = () => {
    setIsEditReservationOpen(true);
  };

  const onCloseEditReservation = () => {
    setIsEditReservationOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Date" />
            <TableHeader className="pr-2" text="Course" />
            <TableHeader className="pr-2" text="Customer" />
            <TableHeader className="pr-2" text="Golfers" />
            <TableHeader className="pr-2" text="Type" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            date="2024-11-24 10:15:00"
            courseName="Encinitas Ranch"
            customerImage="/defaults/default-profile.webp"
            customerUsername="mrjones8"
            golferCount="3"
            type="Primary"
            status="Active"
            openEditReservation={openEditReservation}
          />
        </tbody>
      </table>
      {isEditReservationOpen && (
        <ReservationForm isEdit={true} onClose={onCloseEditReservation} />
      )}
    </>
  );
};

const TableRow = ({
  date,
  courseName,
  customerImage,
  customerUsername,
  golferCount,
  type,
  status,
  openEditReservation,
}: {
  date: string;
  courseName: string;
  customerImage: string;
  customerUsername: string;
  golferCount: string;
  type: string;
  status: string;
  openEditReservation: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2">{formatTime(date, false)}</td>
      <td className="pr-2">{courseName}</td>
      <td className="pr-2">
        <Link href="#" className="flex items-center gap-2">
          <Avatar src={customerImage} />
          <p className="text-primary">{customerUsername}</p>
        </Link>
      </td>
      <td className="pr-2">{golferCount}</td>
      <td className="pr-2">{type}</td>
      <td className="pr-2">{status}</td>
      <td>
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditReservation}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
