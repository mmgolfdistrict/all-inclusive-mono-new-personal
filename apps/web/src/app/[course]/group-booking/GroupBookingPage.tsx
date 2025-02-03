import { FilledButton } from "~/components/buttons/filled-button";
// import { useMe } from "~/hooks/useMe";
// import { useParams } from "next/navigation";
import React from "react";

const GroupBookingPage = () => {
  // const { user, isLoading: isUserLoading } = useMe();
  // const { course } = useParams();
  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <div className="relative flex items-center justify-between md:mb-2">
        <h1 className="text-[20px] capitalize text-secondary-black md:text-[32px] flex items-center gap-6">
          Available Tee Times
        </h1>
      </div>
      <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
          <h2 className="text-[13px] md:text-lg capitalize text-secondary-black unmask-time">
            23 January 2025
          </h2>
        </div>

        {/* Group booking Items */}
        <div className="flex flex-row h-[100%] gap-4 overflow-x-auto ">
          <div className="bg-white p-3 rounded-xl max-w-[280px] md:max-w-none md:w-[300px] flex flex-col text-[12px] md:text-[16px] text-secondary-black cursor-pointer">
            {/* First Row */}
            <div className="flex flex-row justify-between items-center unmask-time">
              <div className="font-semibold text-[16px] md:text-[20px] unmask-time">
                12:00 PM
              </div>
            </div>

            {/* Second Row */}
            <div className="flex flex-row items-center gap-1 mt-2">
              <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black">
                $2
              </div>
              <div className="text-[12px] md:text-[14px] text-primary-gray">
                /golfer
              </div>
            </div>

            {/* Third Row */}
            <div className="mt-2 w-full mb-4">
              <FilledButton
                className="whitespace-nowrap !min-w-[82px] md:min-w-[110px] !py-[.28rem] md:py-1.5 w-full"
                data-testid="buy-tee-time-id"
                data-qa="Buy"
              >
                Buy
              </FilledButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupBookingPage;
