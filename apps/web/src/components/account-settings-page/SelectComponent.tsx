// components/OptionDetails.tsx

import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";

const OptionDetails = ({
  associatedBanks = [],
  handleTransferAmount,
  loadingCashout = false,
}: {
  loadingCashout: boolean;
  associatedBanks?: {
    id: string;
    accountNumber: string | null;
  }[];
  handleTransferAmount: (paymentInstrumentId, amount) => Promise<void>;
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
      <h3 className="text-xl font mb-4">Select an Account to Cashout:</h3>
      <select
        value={selectedOption}
        onChange={handleChange}
        className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
      >
        <option value="">Select a Bank Account Below</option>
        {associatedBanks.map((bank) => (
          <option key={bank.id} value={bank.id}>
            {bank.accountNumber}
          </option>
        ))}
      </select>

      {selectedOption && (
        <div className="mt-4">
          {/* <h2 className="text-xl font-semibold">{account?.accountNumber}</h2> */}
          <div className="container mx-auto py-8">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="mr-4">
                Amount:
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="Enter amount"
                value={value}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Regular expression to match numbers with up to two decimal places
                  const regex = /^\d*\.?\d{0,2}$/;
                  if (regex.test(inputValue)) {
                    setValue(inputValue);
                  }
                }}
                className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400 mr-4"
              />
              <FilledButton
                onClick={!loadingCashout ? handleCashoutClick : undefined}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
              >
                {loadingCashout ? "Processing..." : "Cashout"}
              </FilledButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionDetails;
