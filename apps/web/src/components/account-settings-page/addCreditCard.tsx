"use client";

import type { CustomerPaymentMethod } from "~/hooks/usePaymentMethods";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";
import { useState } from "react";
import { toast } from "react-toastify";
import { Trashcan } from "../icons/trashcan";
// import { Spinner } from "../loading/spinner";
import { AddCard } from "./add-card";

export const AddCreditCard = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cards, refetch, isLoading } = usePaymentMethods();
  const removeCard = api.checkout.removePaymentMethod.useMutation();

  const removeMethod = async (paymentMethodId: string) => {
    if (!paymentMethodId) return;
    if (removeCard.isLoading) return;
    try {
      await removeCard.mutateAsync({ paymentMethodId });
      await refetch();
      toast.success("Card removed successfully");
    } catch (error) {
      console.log(error);
      toast.error((error as Error)?.message ?? "Error removing card");
    }
  };

  return (
    <section
      id="payment-method"
      className="flex h-fit w-full flex-col bg-white px-3 py-2  md:rounded-xl md:p-6 md:py-4"
    >
      <h1 className="pb-6 text-[18px] md:text-[24px]">Add New Credit Card</h1>

      <div className="w-full md:min-w-[370px] px-2 md:px-0">
        <AddCard refetchCards={refetch} />
      </div>
    </section>
  );
};

const CardDisplay = ({
  card,
  removeMethod,
}: {
  card: CustomerPaymentMethod;
  removeMethod: (x: string) => Promise<void>;
}) => {
  const [confirmStatus, setConfirmStatus] = useState(false);
  // payment_method_idw
  const removeCard = async () => {
    await removeMethod(card?.payment_method_id ?? "");
    setConfirmStatus(false);
  };

  return (
    <div className="border border-stroke rounded-md p-3 flex flex-col gap-2 relative">
      <div className="flex items-start flex-col gap-1">
        <div className="font-[500] text-md">Card Number</div>
        <div className="text-sm">XXXX XXXX XXXX {card?.card?.last4_digits}</div>
      </div>
      <div className="flex w-full justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="font-[500] text-md">Card Expiry</div>
          <div className="text-sm">
            {card?.card?.expiry_month}/{card?.card?.expiry_year}
          </div>
        </div>
        <button
          onClick={() => setConfirmStatus(true)}
          className="border border-alert-red px-3 rounded-md"
        >
          <Trashcan fill="#EE2020" className="w-[20px] h-[20px]" />
        </button>
      </div>
      {/* <div id="backdrop" className="fixed inset-0 bg-black opacity-50 z-10 backdrop"></div> */}
      {confirmStatus ? (
        <div
          id="slideOut"
          className="absolute top-0 bg-white-500 w-1/2 h-full transition-transform duration-300 ease-in-out transform translate-x-full z-20"
        >
          <div className="bg-white p-2 text-sm rounded shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-2">Are you sure you want to delete card?</p>
            <div className="flex justify-end">
              <button
                style={{ background: "red" }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
                onClick={() => removeCard()}
              >
                Yes
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setConfirmStatus(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
