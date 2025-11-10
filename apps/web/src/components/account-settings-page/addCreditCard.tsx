"use client";

import { usePaymentMethods } from "~/hooks/usePaymentMethods";
import { AddCard } from "./add-card";

export const AddCreditCard = () => {
  const { refetch } = usePaymentMethods();

  return (
    <section
      id="payment-method"
      className="flex h-fit w-full flex-col bg-white px-3 py-2  md:rounded-xl md:p-6 md:py-4"
    >
      <h1 className="pb-6 text-[1.125rem] md:text-[1.5rem]">Add New Credit Card</h1>

      <div className="w-full md:min-w-[23.125rem] px-2 md:px-0">
        <AddCard refetchCards={refetch} />
      </div>
    </section>
  );
};
