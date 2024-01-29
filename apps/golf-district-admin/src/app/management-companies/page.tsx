"use client";

import { OutlineButton } from "~/components/buttons/outline-button";
import { ManagementForm } from "~/components/forms/management-form";
import { Plus } from "~/components/icons/plus";
import { ManagementCompanies } from "~/components/tables/management-companies";
import { useState } from "react";

export default function AdminManagementCompanies() {
  const [isNewManagementCompanyOpen, setIsNewManagementCompanyOpen] =
    useState<boolean>(false);

  const openNewManagementCompany = () => {
    setIsNewManagementCompanyOpen(true);
  };

  const onCloseNewManagementCompany = () => {
    setIsNewManagementCompanyOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Management Companies</h1>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewManagementCompany}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <ManagementCompanies />
      </section>
      {isNewManagementCompanyOpen && (
        <ManagementForm isEdit={false} onClose={onCloseNewManagementCompany} />
      )}
    </main>
  );
}
