"use client";

import type { CustomerPaymentMethod } from "~/hooks/usePaymentMethods";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";
import { useState } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Trashcan } from "../icons/trashcan";
import { Spinner } from "../loading/spinner";

export const PaymentInfoMangeProfile = () => {
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
      <h1 className="pb-6 text-[18px] md:text-[24px]">Saved Credit Cards</h1>
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

      <>
        {confirmStatus && (
          <div
            className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
          >
            <div className="h-screen bg-[#00000099]" />
          </div>
        )}
        <aside
          // ref={sidebar}
          className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
            confirmStatus ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <div className="text-lg">Remove saved card</div>

              <button
                // ref={trigger}
                onClick={() => setConfirmStatus(false)}
                aria-controls="sidebar"
                aria-expanded={confirmStatus}
                className="z-[2]"
                aria-label="sidebarToggle"
              >
                <Close className="h-[25px] w-[25px]" />
              </button>
            </div>
            <div className="flex h-full flex-col justify-between overflow-y-auto">
              <div className="flex flex-col gap-6 px-0 sm:px-4">
                <div>
                  <div className="mt-6  pb-4 text-center text-2xl font-[300] md:text-xl">
                    Are you sure you want to delete this credit card?
                  </div>
                  <div>
                    <div className="flex items-start flex-col gap-1 px-1">
                      <div className="font-[500] text-md">Card Number</div>
                      <div className="text-sm">
                        XXXX XXXX XXXX {card?.card?.last4_digits}
                      </div>
                    </div>
                    <div className="flex w-full justify-between items-end px-1">
                      <div className="flex flex-col gap-1">
                        <div className="font-[500] text-md">Card Expiry</div>
                        <div className="text-sm">
                          {card?.card?.expiry_month}/{card?.card?.expiry_year}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 px-4 pb-6">
                <div className="flex flex-col gap-2">
                  <FilledButton
                    className="w-full"
                    onClick={() => removeCard()}
                    data-testid="cancel-listing-button-id"
                    style={{
                      background: "red",
                      border: "red",
                    }}
                  >
                    Remove card
                  </FilledButton>

                  <OutlineButton
                    onClick={() => setConfirmStatus(false)}
                    data-testid="cancel-button-id"
                  >
                    Cancel
                  </OutlineButton>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </>
    </div>
  );
};
