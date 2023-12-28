import { GoBack } from "~/components/buttons/go-back";
import { TeeTime } from "~/components/cards/tee-time";
import { ProfileDetails } from "~/components/profile-page/profile-details";
import { TeeTimeHistory } from "~/components/profile-page/tee-time-history";
import { UpcomingTeeTimes } from "~/components/profile-page/upcoming-tee-times";

const MOCK_TEE_TIMES = [
  { time: "1:00 PM", canChoosePlayer: false, players: "2", price: "115.00" },
  { time: "2:00 PM", canChoosePlayer: true, players: "2", price: "175.00" },
  { time: "3:00 PM", canChoosePlayer: false, players: "1", price: "150.00" },
  { time: "4:00 PM", canChoosePlayer: true, players: "2", price: "215.00" },
  { time: "5:00 PM", canChoosePlayer: false, players: "4", price: "95.00" },
];

export default function Profile({ params }: { params: { course: string } }) {
  const courseId = params.course;
  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
        <ProfileDetails />
        <UpcomingTeeTimes>
          {MOCK_TEE_TIMES.map((i, idx) => (
            <TeeTime
              time={i.time}
              key={idx}
              canChoosePlayer={i.canChoosePlayer}
              players={i.players}
              price={Number(i.price)}
              isOwned={false}
              isForSale={false}
              soldById={""}
              soldByImage={""}
              soldByName={""}
              availableSlots={0}
              teeTimeId={""}
              isLiked={false}
              status={"FIRST_HAND"}
              minimumOfferPrice={0}
              bookingIds={[]}
              listingId={""}
              firstHandPurchasePrice={0}
            />
          ))}
        </UpcomingTeeTimes>
        <TeeTimeHistory />
      </section>
    </main>
  );
}
