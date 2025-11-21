// components/OptionDetails.tsx

import { LoadingContainer } from "~/app/[course]/loader";
import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import styles from "./select.module.css";

const OptionDetails = ({
  associatedBanks = [],
  handleTransferAmount,
  loadingCashout = false,
  disabledCashOut = true,
}: {
  loadingCashout: boolean;
  associatedBanks?: {
    id: string;
    accountNumber: string | null;
    onboardingStatus: string | null;
  }[];
  handleTransferAmount: (paymentInstrumentId, amount) => Promise<void>;
  disabledCashOut: boolean;
}) => {
  const [value, setValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };
  const handleCashoutClick = async () => {
    setValue("");
    await handleTransferAmount(selectedOption, value);
  };
  //   const account = associatedBanks.find((bank) => bank.id === selectedOption);
  if (!associatedBanks.length) {
    return null;
  }

  return (
    <div className="container mx-auto ">
      <div className="flex justify-between">
        <h3 className="font mb-2 text-gray-600">Select Your Bank Account to Deposit:</h3>
        {disabledCashOut && (
          <Tooltip
            trigger={<Info className="h-[1.25rem] w-[1.25rem]" />}
            content="You have a 0 balance. There are no funds to cash out."
          />
        )}
      </div>
      <select
        disabled={disabledCashOut}
        value={selectedOption}
        onChange={handleChange}
        className={`block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400 ${styles.select}`}
      >
        <option value="">Select a Bank Account Below</option>
        {associatedBanks.map((bank) => (
          <option
            key={bank.id}
            value={bank.id}
            disabled={bank.onboardingStatus !== "APPROVED"}
          >
            <span
              style={
                bank.onboardingStatus === "REJECTED"
                  ? { textDecoration: "line-through" }
                  : {}
              }
            >
              {bank.accountNumber}
            </span>
            {bank.onboardingStatus === "PROVISIONING" && (
              <span> - Pending Review</span>
            )}
            {bank.onboardingStatus === "REJECTED" && (
              <span> - Not Approved</span>
            )}
          </option>
        ))}
      </select>

      {selectedOption && (
        <div className="mt-4">
          {/* <h2 className="text-xl font-semibold">{account?.accountNumber}</h2> */}
          <div className="container mx-auto py-2">
            <div className="flex flex-col w-full mx-auto">
              <label htmlFor="amount" className="font mb-2 text-gray-600">
                Amount
              </label>
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  placeholder="Enter amount"
                  value={value}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const regex = /^\d*\.?\d{0,2}$/;
                    if (regex.test(inputValue)) {
                      setValue(inputValue);
                    }
                  }}
                  className="pl-6 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400 w-full"
                />
              </div>

              <FilledButton
                onClick={!loadingCashout ? handleCashoutClick : undefined}
              // className="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none"
              >
                {loadingCashout ? "Processing..." : "Deposit From Golf District Wallet to Your Bank Account"}
              </FilledButton>

              <LoadingContainer isLoading={loadingCashout}>
                <div></div>
              </LoadingContainer>
            </div>
          </div>

        </div>
      )}
      {selectedOption && <p className=" text-[0.875rem] text-blue-500 md:text-[1rem]">
        You can cashout once a day up to $3000.
      </p>}
    </div>
  );
};

export default OptionDetails;
