"use client";

import { Bidding } from "~/components/auction-page/bidding";
import { Description } from "~/components/auction-page/description";
import { Title } from "~/components/auction-page/title";
import { GoBack } from "~/components/buttons/go-back";
import { BlurImage } from "~/components/images/blur-image";
import { useCourseContext } from "~/contexts/CourseContext";
import { useAuction } from "~/hooks/useAuction";
import { fullDate, placeholderBlurhash } from "~/utils/formatters";
import { redirect } from "next/navigation";
import { Skeleton } from "./skeleton";

const auctionId = "72673ea0-7e91-444c-a76a-824d518362e8";

export default function AuctionsPage({
  params,
}: {
  params: { auction: string; course: string };
}) {
  const courseId = params.course;
  const { course } = useCourseContext();
  if (course?.allowAuctions !== 1 || !course) {
    redirect(`/${courseId}`);
  }
  const { auctionData, isLoading, refetch } = useAuction(auctionId);

  const refetchData = async () => {
    await refetch();
  };

  if (isLoading) return <Skeleton />;

  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
        <div className="px-4 md:px-0">
          <Title
            title={auctionData?.auction.name ?? "-"}
            subtitle={`${
              auctionData?.auction.eventDate &&
              fullDate(
                auctionData?.auction.eventDate,
                course?.timezoneCorrection
              )
            } @ ${auctionData?.auction.eventLocation}`}
          />
        </div>
        <div className="flex  flex-col justify-between gap-4 md:flex-row">
          <div className="flex flex-col gap-4">
            <BlurImage
              src={auctionData?.assetUrl ?? placeholderBlurhash}
              alt="Auction Placeholder"
              width={960}
              height={600}
              className="md:w-[960]px md:h-[600]px h-[250]px w-full object-cover md:rounded-xl"
              unoptimized
            />
            <Description
              title={auctionData?.auction.name ?? "-"}
              date={auctionData?.auction.eventDate ?? "-"}
              location={auctionData?.auction.eventLocation ?? "-"}
              time={auctionData?.auction.eventTime ?? "-"}
              body={auctionData?.auction.extendedDescription ?? "-"}
            />
          </div>
          <Bidding
            endDate={auctionData?.auction.endDate}
            startingPrice={auctionData?.auction.startingPrice}
            highestBid={auctionData?.highestBid}
            bidCount={auctionData?.bidCount}
            buyNowPrice={auctionData?.auction.buyNowPrice}
            refetchData={refetchData}
          />
        </div>
      </section>
    </main>
  );
}
