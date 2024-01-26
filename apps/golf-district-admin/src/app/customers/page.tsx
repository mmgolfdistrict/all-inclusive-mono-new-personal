"use client";

import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { CustomerForm } from "~/components/forms/customer-form";
import { Plus } from "~/components/icons/plus";
import { Customers } from "~/components/tables/customers";
import { useState } from "react";

export default function AdminCustomers() {
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState<boolean>(false);

  const openNewCustomer = () => {
    setIsNewCustomerOpen(true);
  };

  const onCloseNewCustomer = () => {
    setIsNewCustomerOpen(false);
  };

  return (
    <>
      <main className="flex flex-col gap-6 w-full relative">
        <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
          <h1 className="font-500 text-[24px]">Customers</h1>
          <div className="flex items-center gap-2">
            <NoOutlineButton>Edit Columns</NoOutlineButton>
            <OutlineButton
              className="flex items-center gap-2"
              onClick={openNewCustomer}
            >
              <Plus /> New
            </OutlineButton>
          </div>
        </section>
        <section>
          <Customers />
        </section>
        {isNewCustomerOpen && (
          <CustomerForm isEdit={false} onClose={onCloseNewCustomer} />
        )}
      </main>
    </>
  );
}
