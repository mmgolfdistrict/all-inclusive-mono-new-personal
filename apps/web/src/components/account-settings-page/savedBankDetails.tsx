"use client";

import { type CustomerPaymentMethod } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";
import { useState } from "react";
import { Spinner } from "../loading/spinner";
import CardDetails from "./CardDetails";
import SidePanel from "./SidePanel";

export const SavedBankDetails = () => {
  // const { cards, refetch, isLoading } = usePaymentMethods();
  const { data: associatedBanks, refetch, isLoading } = api.cashOut.getAssociatedAccounts.useQuery(
    {}
  );
  const removeCard = api.checkout.removePaymentMethod.useMutation();

  const removeMethod = async (_paymentMethodId: string) => {
    // TODO: Implement the removeMethod functionality
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
        ) : isLoading ? (
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
  const [confirmStatus, setConfirmStatus] = useState(false);
  // payment_method_idw
  // const removeCard = () => {
  //   // await removeMethod(card.payment_method_id);
  //   setConfirmStatus(false);
  // };

  return (
    <div className="border border-stroke rounded-md p-3 flex flex-col relative">
      <CardDetails label="Bank Name" value={"N/A"} />
      <CardDetails label="Routing Number" value={"N/A"} />
      <CardDetails
        label="Account Details"
        value={`${card?.accountNumber}`}
        // onRemove={() => setConfirmStatus(true)}
      />
      {/* {confirmStatus ? (
        <SidePanel isOpen={true}>
          <div className="bg-white p-8 text-sm rounded shadow-md h-full">
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
        </SidePanel>
      ) : null} */}
    </div>
  );
};
