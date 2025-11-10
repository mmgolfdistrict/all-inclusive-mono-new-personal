import React from 'react';
export const TeeTimeSkeletonV2 = () => (
  <div className="md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[14.375rem] md:min-w-[16.5625rem] w-full animate-pulse">
    <div className="border-b border-stroke">
      <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
        <div className="h-5 md:h-7 w-16 bg-gray-200 rounded-md" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[0.625rem] md:text-[0.875rem]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
          <div className="h-6 w-20 bg-gray-200 rounded-md" />
        </div>
        <div className="flex md:min-h-[1.9375rem] items-center gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-8 w-16 bg-gray-200 rounded-md" />
          <div className="h-8 w-16 bg-gray-200 rounded-md" />
        </div>

        <div className="h-10 w-24 bg-gray-200 rounded-md" />
      </div>
    </div>
  </div>
);
