import Link from "next/link";
import { useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { UserForm } from "../forms/user-form";
import { TableHeader } from "./table-header";

export const Users = () => {
  const [isEditUserOpen, setIsEditUserOpen] = useState<boolean>(false);

  const openEditUser = () => {
    setIsEditUserOpen(true);
  };

  const closeEditUser = () => {
    setIsEditUserOpen(false);
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
            openEditUser={openEditUser}
          />
          <TableRow
            name="Marvin Willis"
            userImage="/defaults/default-profile.webp"
            username="mrjones8"
            userId="12341234"
            email="user@email.com"
            phoneNumber="(123) 456-7890"
            status="Active"
            openEditUser={openEditUser}
          />
          <TableRow
            name="Marvin Willis"
            userImage="/defaults/default-profile.webp"
            username="mrjones8"
            userId="12341234"
            email="user@email.com"
            phoneNumber="(123) 456-7890"
            status="Active"
            openEditUser={openEditUser}
          />
        </tbody>
      </table>
      {isEditUserOpen && <UserForm isEdit={true} onClose={closeEditUser} />}
    </>
  );
};

const TableRow = ({
  name,
  userImage,
  username,
  userId,
  email,
  phoneNumber,
  status,
  openEditUser,
}: {
  name: string;
  userImage: string;
  username: string;
  userId: string;
  email: string;
  phoneNumber: string;
  status: string;
  openEditUser: () => void;
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
            onClick={openEditUser}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
