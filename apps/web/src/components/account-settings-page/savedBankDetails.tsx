"use client";

import { type CustomerPaymentMethod } from "~/hooks/usePaymentMethods";
import { api } from "~/utils/api";

import { Spinner } from "../loading/spinner";
import CardDetails from "./CardDetails";
import { Trashcan } from "../icons/trashcan";

export const SavedBankDetails = () => {
  const { data: associatedBanks, isLoading } =
    api.cashOut.getAssociatedAccounts.useQuery({});

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
}: {
  card: CustomerPaymentMethod;
  removeMethod: (x: string) => Promise<void>;
}) => {
  return (
    <div className="border border-stroke rounded-md p-3 flex flex-col relative">
      <div className="flex items-start flex-col gap-1">
        <CardDetails label="Bank Name" value={"N/A"} />
        <CardDetails label="Routing Number" value={"N/A"} />
      </div>
      <div className="flex w-full justify-between items-end">
        <CardDetails
          label="Account Details"
          value={`${card?.accountNumber}`}
        // onRemove={() => setConfirmStatus(true)}
        />
        <button
          // onClick={() => setConfirmStatus(true)}
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
