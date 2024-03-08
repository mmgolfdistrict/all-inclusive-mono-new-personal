import { appSettingService } from "@golf-district/api/src/initialization";
import { GoBack } from "~/components/buttons/go-back";
import { TeeTimeDetails } from "~/components/cards/tee-time-details";
import { TransactionHistory } from "~/components/cards/transaction-history";
import { CourseDescription } from "~/components/tee-time-page/course-description";
import { InviteFriends } from "~/components/tee-time-page/invite-friends";

export default async function TeeTimePage({
  params,
}: {
  params: { "tee-time": string; course: string };
}) {
  const teeTimeId = params["tee-time"];
  const courseId = params.course;

  const isTransactionHistoryVisible = await appSettingService.get(
    "ShowTeeTimeDetailTransactionHistory"
  );

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="flex flex-col gap-4 pl-0 pt-6 md:flex-row md:pl-6 md:pt-8">
        <div className="hidden md:block">
          <CourseDescription />
        </div>
        <div className="flex w-full flex-col gap-4 pr-0 md:pr-6">
          <TeeTimeDetails teeTimeId={teeTimeId} />

          <div className="md:hidden">
            <CourseDescription />
          </div>
          {"true" === isTransactionHistoryVisible?.toLowerCase() && (
            <TransactionHistory teeTimeId={teeTimeId} />
          )}
          <InviteFriends teeTimeId={teeTimeId} />
        </div>
      </section>
    </main>
  );
}
