"use client";

import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { RoleForm } from "~/components/forms/role-form";
import { Plus } from "~/components/icons/plus";
import { Roles } from "~/components/tables/roles";
import { useState } from "react";

export default function AdminRoles() {
  const [isNewRoleOpen, setIsNewRoleOpen] = useState<boolean>(false);

  const openNewRole = () => {
    setIsNewRoleOpen(true);
  };

  const onCloseNewRole = () => {
    setIsNewRoleOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Roles</h1>
        <div className="flex items-center gap-2">
          <NoOutlineButton>Edit Columns</NoOutlineButton>
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewRole}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <Roles />
      </section>
      {isNewRoleOpen && <RoleForm isEdit={false} onClose={onCloseNewRole} />}
    </main>
  );
}
