import { appSettingService } from "@golf-district/service/src/app-settings/initialized";
import { GoBack } from "~/components/buttons/go-back";
import { ListedDetails } from "~/components/cards/listed-details";
import { TransactionHistory } from "~/components/cards/transaction-history";
import { CourseDescription } from "~/components/tee-time-page/course-description";
import { InviteFriends } from "~/components/tee-time-page/invite-friends";

export default async function ListedPage({
  params,
}: {
  params: { "tee-time": string; course: string; listingId: string };
}) {
  const teeTimeId = params["tee-time"];
  const courseId = params.course;
  const listingId = params.listingId;
  const isTransactionHistoryVisible = await appSettingService.get(
    "ShowTeeTimeDetailTransactionHistory"
  );

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack
          data-testid="go-back"
          href={`/${courseId}`} text={`Back to tee times`}
        />
      </div>
      <section className="flex flex-col gap-4 pl-0 pt-6 md:flex-row md:pl-6 md:pt-8">
        <div className="hidden md:block">
          <CourseDescription data-testid="course-description" />
        </div>
        <div className="flex w-full flex-col gap-4 pr-0 md:pr-6">
          <ListedDetails
            data-testid="listed-details"
            listingId={listingId}
            teeTimeId={teeTimeId}
          />

          <div className="md:hidden">
            <CourseDescription data-testid="hidden-course-description" />
          </div>
          {"true" === isTransactionHistoryVisible && (
            <TransactionHistory teeTimeId={teeTimeId} data-testid="transaction-history" />
          )}
          <InviteFriends teeTimeId={teeTimeId} data-testid="invite-friends" />
        </div>
      </section>
    </main>
  );
}
