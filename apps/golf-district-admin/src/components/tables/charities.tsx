import { useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { CharityForm } from "../forms/charity-form";
import { TableHeader } from "./table-header";

export const Charities = () => {
  const [isEditCharityOpen, setIsEditCharityOpen] = useState<boolean>(false);

  const openEditCharity = () => {
    setIsEditCharityOpen(true);
  };

  const closeEditCharity = () => {
    setIsEditCharityOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Name" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            name="Charity Name #1"
            status="Active"
            openEditCharity={openEditCharity}
          />
        </tbody>
      </table>
      {isEditCharityOpen && (
        <CharityForm isEdit={true} onClose={closeEditCharity} />
      )}
    </>
  );
};

const TableRow = ({
  name,
  status,
  openEditCharity,
}: {
  name: string;
  status: string;
  openEditCharity: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2 w-full">{name}</td>
      <td className="pr-2">{status}</td>
      <td className="min-w-[150px]">
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditCharity}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
