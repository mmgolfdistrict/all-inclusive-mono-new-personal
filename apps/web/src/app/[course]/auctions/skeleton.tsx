export const Skeleton = () => {
  return (
    <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6 animate-pulse">
      <div className="animate-pulse h-4 w-[15%] bg-gray-200 rounded-md " />
      <div className="px-4 md:px-0">
        <div className="animate-pulse h-10 w-[60%] bg-gray-200 rounded-md " />
        <div className="animate-pulse h-6 w-[20%] mt-2 bg-gray-200 rounded-md " />
      </div>
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
        <div className="flex flex-col gap-4 w-full">
          <div className="animate-pulse md:h-[600px] h-[500px] w-full object-cover md:rounded-xl mt-2 bg-gray-200 rounded-md " />
          <div className="animate-pulse md:h-[600px] h-[500px] w-full object-cover md:rounded-xl mt-2 bg-gray-200 rounded-md " />
        </div>
        <div className="animate-pulse md:w-[40%] w-full object-cover md:rounded-xl mt-2 bg-gray-200 rounded-md " />
      </div>
    </section>
  );
};
