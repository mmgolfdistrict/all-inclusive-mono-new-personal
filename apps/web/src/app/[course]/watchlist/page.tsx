import { GoBack } from "~/components/buttons/go-back";
import { WatchlistTable } from "~/components/watchlist-page/watchlist-table";

export default function Watchlist({ params }: { params: { course: string } }) {
  const courseId = params.course;
  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
        <div className="px-4 md:px-0">
          <h1 className="flex items-center gap-2 text-[24px] text-secondary-black md:text-[32px]">
            Watchlist
          </h1>
          <p className=" text-[14px] text-primary-gray md:text-[20px]">
            View all the tee times you&apos;re watching
          </p>
        </div>
        <WatchlistTable />
      </section>
    </main>
  );
}
