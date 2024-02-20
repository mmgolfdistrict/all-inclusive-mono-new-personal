"use client";

import type { Card } from "~/hooks/usePaymentMethods";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import { Trashcan } from "../icons/trashcan";
import { Spinner } from "../loading/spinner";
import { AddCard } from "./add-card";

export const PaymentInfoMangeProfile = () => {
  const { cards, refetch, isLoading } = usePaymentMethods();
  const removeCard = api.checkout.removePaymentMethod.useMutation();

  const removeMethod = async (paymentMethodId: string) => {
    toast.info("Currently under development.");
    return;
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
      className="mx-auto flex h-fit w-full flex-col bg-white px-3 py-2 md:max-w-[50%] md:rounded-xl md:p-6 md:py-4"
    >
      <h1 className="pb-6 text-[18px] md:text-[24px]">Payment Information</h1>
      <div className="flex flex-col gap-2">
        {cards && cards.length > 0 ? (
          cards.map((card, idx) => (
            <CardDisplay removeMethod={removeMethod} card={card} key={idx} />
          ))
        ) : isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <Spinner className="w-[50px] h-[50px]" />
          </div>
        ) : (
          <div className="text-center">No cards on file.</div>
        )}
      </div>
      <div className="flex items-center py-4">
        <div className="h-[1px] w-full bg-stroke" />
      </div>
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
  card: Card;
  removeMethod: (x: string) => Promise<void>;
}) => {
  return (
    <div className="border border-stroke rounded-md p-3 flex flex-col gap-2">
      <div className="flex items-start flex-col gap-1">
        <div className="font-[500] text-md">Card Number</div>
        <div className="text-sm">XXXX XXXX XXXX {card?.card?.last4}</div>
      </div>
      <div className="flex w-full justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="font-[500] text-md">Card Expiry</div>
          <div className="text-sm">
            {card?.card?.exp_month}/{card?.card?.exp_year}
          </div>
        </div>
        <button
          onClick={() => void removeMethod(card.id)}
          className="border border-alert-red px-3 rounded-md"
        >
          <Trashcan fill="#EE2020" className="w-[20px] h-[20px]" />
        </button>
      </div>
    </div>
  );
};
