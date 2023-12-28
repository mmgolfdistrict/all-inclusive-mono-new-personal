import { TeeTimeSkeleton } from "./tee-time-skeleton";

export const Skeleton = () => (
  <div className="flex flex-col gap-4 bg-white px-4 py-3 md:rounded-xl md:px-8 md:py-6">
    <div className="flex flex-wrap justify-between gap-2">
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
    </div>
    <div className="scrollbar-none relative flex gap-4 overflow-x-auto overflow-y-hidden h-[262px]">
      {Array(5)
        .fill(null)
        .map((_, idx) => (
          <TeeTimeSkeleton key={idx} />
        ))}
    </div>
  </div>
);
