export const TeeTimeSkeleton = () => (
  <div className="md:rounded-xl rounded-lg bg-secondary-white w-fit min-w-[230px] md:min-w-[265px] mr-4">
    <div className="border-b border-stroke">
      <div className="flex justify-between py-1 px-2 md:px-3 md:p-3 items-center">
        <div className="h-4 md:h-6 w-[60px] bg-gray-200 rounded-md animate-pulse" />
        <div className="flex gap-2">
          <div className="h-[40px] w-[80px] bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-1 md:gap-4 p-2 md:p-3 text-[10px] md:text-[14px]">
      <div className="flex flex-col gap-1 relative pt-1.5 md:pt-0">
        <div className="h-4 md:h-5 w-[80px] bg-gray-200 rounded-md animate-pulse" />
      </div>

      <div className="flex md:min-h-[31px] items-center gap-2">
        <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-6 md:h-8 w-[140px] md:w-[180px] bg-gray-200 rounded-md animate-pulse" />
        <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-200 rounded-full animate-pulse" />
      </div>

      <div className="flex items-center gap-1">
        <div className="h-[32px] w-[32px] bg-gray-200 rounded-md animate-pulse" />
        <div className="h-[32px] w-full bg-gray-200 rounded-md animate-pulse" />
        <div className="h-[32px] w-[32px] bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  </div>
);
