export const TeeTimeSkeleton = () => (
  <div className="rounded-xl bg-secondary-white min-w-[228px] md:min-w-[220px]">
    <div className="border-b border-stroke">
      <div className="flex justify-between py-1.5 px-3 md:p-3">
        <div className="h-4 md:h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
    </div>
    <div className="flex flex-col gap-4 p-3  text-[14px]">
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />

        <div className="whitespace-nowrap pr-2">
          <div className="h-6 w-10 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
      </div>
      <div className="flex min-h-[31px] items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-8 w-[60%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
      <div className="flex flex-col gap-1 relative">
        <div className="h-4 md:h-6 w-[45%] bg-gray-200 rounded-md  animate-pulse" />
      </div>

      <div className="flex items-center gap-1 hidden md:flex">
        <div className=" min-h-[32px] h-[32px] w-[32px] min-w-[32px] bg-gray-200 rounded-full animate-pulse" />
        <div className="h-8 w-full bg-gray-200 rounded-full animate-pulse" />
        <div className="h-8 w-full bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);
