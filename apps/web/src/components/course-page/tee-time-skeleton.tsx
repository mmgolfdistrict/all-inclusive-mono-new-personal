export const TeeTimeSkeleton = () => (
  <div className="md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[14.375rem] md:min-w-[16.5625rem] mr-4">
    <div className="border-b border-stroke">
      <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
        <div className="h-4 md:h-6 w-[3.75rem] bg-gray-200 rounded-md animate-pulse" />
        <div className="flex gap-2">
          <div className="h-[2.5rem] w-[5rem] bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[0.625rem] md:text-[0.875rem]">
      <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
        <div className="h-4 md:h-5 w-[5rem] bg-gray-200 rounded-md animate-pulse" />
      </div>

      <div className="flex md:min-h-[1.9375rem] items-center gap-2">
        <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-6 md:h-8 w-[8.75rem] md:w-[11.25rem] bg-gray-200 rounded-md animate-pulse" />
        <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-200 rounded-full animate-pulse" />
      </div>

      <div className="flex items-center gap-1">
        <div className="h-[2rem] w-[2rem] bg-gray-200 rounded-md animate-pulse" />
        <div className="h-[2rem] w-full bg-gray-200 rounded-md animate-pulse" />
        <div className="h-[2rem] w-[2rem] bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  </div>
);
