export const SkeletonRow = () => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="h-8 w-[50%] bg-gray-200 rounded-md animate-pulse" />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="h-8 w-[70%] bg-gray-200 rounded-md animate-pulse" />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="h-8 w-[70%] bg-gray-200 rounded-md animate-pulse" />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex gap-2 justify-end w-full">
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </td>
    </tr>
  );
};
