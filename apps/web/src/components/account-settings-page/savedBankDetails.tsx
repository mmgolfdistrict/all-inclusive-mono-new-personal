"use client";

import { type CustomerPaymentMethod } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";
import { useState } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Trashcan } from "../icons/trashcan";
import { Spinner } from "../loading/spinner";
import CardDetails from "./CardDetails";

export const SavedBankDetails = () => {
  const { data: associatedBanks, isLoading } =
    api.cashOut.getAssociatedAccounts.useQuery({});
  const { refetch: refetchAssociatedBanks } =
    api.cashOut.getAssociatedAccounts.useQuery({}, { enabled: false });
  const deletePaymentInstrument =
    api.cashOut.deletePaymentInstrument.useMutation();

  const [loader, setLoader] = useState<boolean>(false);

  const removeMethod = async (paymentMethodId: string) => {
    setLoader(true);
    try {
      await deletePaymentInstrument.mutateAsync({
        paymentInstrumentId: paymentMethodId,
      });
      await refetchAssociatedBanks();
      setLoader(false);
      toast.success("Bank detail removed successfully.");
    } catch (error) {
      setLoader(false);
      console.log(error);
      toast.error(
        (error as Error)?.message ??
          "An error occurred submitting your request."
      );
    }
  };

  return (
    <section
      id="payment-method"
      className="flex h-fit w-full flex-col bg-white px-3 py-2  md:rounded-xl md:p-6 md:py-4"
    >
      <h1 className="pb-6 text-[18px] md:text-[24px]">Saved Bank Details</h1>
      <div className="flex flex-col gap-2">
        {associatedBanks && associatedBanks.length > 0 ? (
          associatedBanks.map((bank, idx) => (
            <CardDisplay removeMethod={removeMethod} card={bank} key={idx} />
          ))
        ) : isLoading || loader ? (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <Spinner className="w-[50px] h-[50px]" />
          </div>
        ) : (
          <div className="text-center">No bank details added.</div>
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
  const [confirmStatus, setConfirmStatus] = useState<boolean>(false);

  const removeCard = async () => {
    if (card.id) await removeMethod(card.id);
    setConfirmStatus(false);
  };

  return (
    <div className="border border-stroke rounded-md p-3 flex flex-col relative">
      <div className="flex items-start flex-col gap-1">
        <CardDetails label="Bank Name" value={"N/A"} />
        <CardDetails label="Routing Number" value={"N/A"} />
      </div>
      <div className="flex w-full justify-between items-end">
        <CardDetails label="Account Details" value={`${card?.accountNumber}`} />
        <button
          onClick={() => setConfirmStatus(true)}
          className="border border-alert-red px-3 rounded-md"
        >
          <Trashcan fill="#EE2020" className="w-[20px] h-[20px]" />
        </button>
      </div>
      {/* {confirmStatus ? (
        <SidePanel isOpen={true}>
          <div className="bg-white p-8 text-sm rounded shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-2">Are you sure you want to delete card?</p>
            <div className="flex justify-end">
              <button
                style={{ background: "red" }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
                onClick={removeCard}
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
        </SidePanel>
      ) : null} */}
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
              <div className="text-lg">Confirm Deletion</div>

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
                <div className="mt-6  pb-4 text-center text-2xl font-[300] md:text-xl">
                  Are you sure you want to delete bank detail?
                </div>
                <div className="flex items-start flex-col gap-1 px-1">
                  <div className="font-[500] text-md">Account Number</div>
                  <div className="text-sm">{card?.accountNumber}</div>
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
                    Remove
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
