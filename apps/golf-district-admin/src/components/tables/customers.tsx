import Link from "next/link";
import { useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { CustomerForm } from "../forms/customer-form";
import { TableHeader } from "./table-header";

export const Customers = () => {
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState<boolean>(false);

  const openEditCustomer = () => {
    setIsEditCustomerOpen(true);
  };

  const closeEditCustomer = () => {
    setIsEditCustomerOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Name" />
            <TableHeader className="pr-2" text="Email" />
            <TableHeader className="pr-2" text="Phone" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            name="Marvin Willis"
            userImage="/defaults/default-profile.webp"
            username="mrjones8"
            userId="12341234"
            email="user@email.com"
            phoneNumber="(123) 456-7890"
            status="Active"
            openEditCustomer={openEditCustomer}
          />
          <TableRow
            name="Marvin Willis"
            userImage="/defaults/default-profile.webp"
            username="mrjones8"
            userId="12341234"
            email="user@email.com"
            phoneNumber="(123) 456-7890"
            status="Active"
            openEditCustomer={openEditCustomer}
          />
          <TableRow
            name="Marvin Willis"
            userImage="/defaults/default-profile.webp"
            username="mrjones8"
            userId="12341234"
            email="user@email.com"
            phoneNumber="(123) 456-7890"
            status="Active"
            openEditCustomer={openEditCustomer}
          />
        </tbody>
      </table>
      {isEditCustomerOpen && (
        <CustomerForm isEdit={true} onClose={closeEditCustomer} />
      )}
    </>
  );
};

const TableRow = ({
  name,
  userImage,
  username,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
  email,
  phoneNumber,
  status,
  openEditCustomer,
}: {
  name: string;
  userImage: string;
  username: string;
  userId: string;
  email: string;
  phoneNumber: string;
  status: string;
  openEditCustomer: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-2">
        <Link href="#" className="flex items-center gap-2">
          <Avatar src={userImage} />
          <p>{name}</p>
          <p className="text-primary">{username}</p>
        </Link>
      </td>
      <td className="pr-2">{email}</td>
      <td className="pr-2">{phoneNumber}</td>
      <td className="pr-2">{status}</td>
      <td>
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditCustomer}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
