import { useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { TeeSheetForm } from "../forms/tee-sheet-form";
import { TableHeader } from "./table-header";

export const TeeSheets = () => {
  const [isEditTeeSheetOpen, setIsEditTeeSheetOpen] = useState<boolean>(false);

  const openEditTeeSheet = () => {
    setIsEditTeeSheetOpen(true);
  };

  const closeEditTeeSheet = () => {
    setIsEditTeeSheetOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Name" />
            <TableHeader className="pr-2" text="Internal Name" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            name="Tee Sheet 23"
            internalName="tee-sheet-23"
            status="Active"
            openEditTeeSheet={openEditTeeSheet}
          />
        </tbody>
      </table>
      {isEditTeeSheetOpen && (
        <TeeSheetForm isEdit={true} onClose={closeEditTeeSheet} />
      )}
    </>
  );
};

const TableRow = ({
  name,
  internalName,
  status,
  openEditTeeSheet,
}: {
  name: string;
  internalName: string;
  status: string;
  openEditTeeSheet: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2 min-w-[135px]">{name}</td>
      <td className="pr-2 w-full">{internalName}</td>
      <td className="pr-2 min-w-[135px]">{status}</td>
      <td>
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditTeeSheet}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
