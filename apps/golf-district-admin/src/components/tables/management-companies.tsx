import Image from "next/image";
import { useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { ManagementForm } from "../forms/management-form";
import { TableHeader } from "./table-header";

export const ManagementCompanies = () => {
  const [isEditManagementCompanyOpen, setIsEditManagementCompanyOpen] =
    useState<boolean>(false);

  const openEditManagementCompany = () => {
    setIsEditManagementCompanyOpen(true);
  };

  const closeEditManagementCompany = () => {
    setIsEditManagementCompanyOpen(false);
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
            managementImage="/defaults/entity.png"
            managementName="Management Company #1 Name"
            status="Active"
            openEditManagementCompany={openEditManagementCompany}
          />
        </tbody>
      </table>
      {isEditManagementCompanyOpen && (
        <ManagementForm isEdit={true} onClose={closeEditManagementCompany} />
      )}
    </>
  );
};

const TableRow = ({
  managementImage,
  managementName,
  status,
  openEditManagementCompany,
}: {
  managementImage: string;
  managementName: string;
  status: string;
  openEditManagementCompany: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2 w-full">
        <div className="flex items-center gap-2">
          <Image
            src={managementImage}
            alt="entity logo"
            width={80}
            height={24}
          />
          <div>
            <p className="text-secondary-black">{managementName}</p>
          </div>
        </div>
      </td>
      <td className="pr-2">{status}</td>
      <td className="min-w-[150px]">
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditManagementCompany}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
