import { useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { RoleForm } from "../forms/role-form";
import { TableHeader } from "./table-header";

export const Roles = () => {
  const [isEditRoleOpen, setIsEditRoleOpen] = useState<boolean>(false);

  const openEditRole = () => {
    setIsEditRoleOpen(true);
  };

  const closeEditRole = () => {
    setIsEditRoleOpen(false);
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
            name="Persona 1"
            userId="12341234"
            status="Active"
            openEditRole={openEditRole}
          />
        </tbody>
      </table>
      {isEditRoleOpen && <RoleForm isEdit={true} onClose={closeEditRole} />}
    </>
  );
};

const TableRow = ({
  name,
  userId,
  status,
  openEditRole,
}: {
  name: string;
  userId: string;
  status: string;
  openEditRole: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2 w-full">{name}</td>
      <td className="pr-2">{status}</td>
      <td className="min-w-[150px]">
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditRole}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
