"use client";

import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { UserForm } from "~/components/forms/user-form";
import { Plus } from "~/components/icons/plus";
import { Users } from "~/components/tables/users";
import { useState } from "react";

export default function AdminUsers() {
  const [isNewUserOpen, setIsNewUserOpen] = useState<boolean>(false);

  const openNewUser = () => {
    setIsNewUserOpen(true);
  };

  const onCloseNewUser = () => {
    setIsNewUserOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Users</h1>
        <div className="flex items-center gap-2">
          <NoOutlineButton>Edit Columns</NoOutlineButton>
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewUser}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <Users />
      </section>
      {isNewUserOpen && <UserForm isEdit={false} onClose={onCloseNewUser} />}
    </main>
  );
}
