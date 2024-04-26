// components/OptionDetails.tsx

import { useState } from "react";

const OptionDetails = ({
  associatedBanks = [],
  handleTransferAmount,
}: {
  associatedBanks?: { id: string; accountNumber: string | null }[];
  handleTransferAmount: (
    paymentInstrumentId: any,
    amount: any
  ) => Promise<void>;
}) => {
  const [value, setValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };
  //   const account = associatedBanks.find((bank) => bank.id === selectedOption);
  if (!associatedBanks.length) {
    return null;
  }
  return (
    <div className="container mx-auto ">
      <h3 className="text-xl font mb-4">Select an account to cashout:</h3>
      <select
        value={selectedOption}
        onChange={handleChange}
        className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
      >
        <option value="">Select an option</option>
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
                onChange={(e) => setValue(e.target.value)}
                className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400 mr-4"
              />
              <button
                onClick={() => handleTransferAmount(selectedOption, value)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionDetails;
