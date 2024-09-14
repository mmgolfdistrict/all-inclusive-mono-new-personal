import { appSettingService } from "@golf-district/service/src/app-settings/initialized";
import { GoBack } from "~/components/buttons/go-back";
import OwnerTeeTimeDetails from "~/components/my-tee-box-page/OwnerTeeTimeDetails";

export default async function UnlistedPage({
  params,
}: {
  params: { "tee-time": string; course: string; ownerId: string };
}) {
  const teeTimeId = params["tee-time"];
  const courseId = params.course;
  const ownerId = params.ownerId;
  const isTransactionHistoryVisible = await appSettingService.get(
    "ShowTeeTimeDetailTransactionHistory"
  );

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="flex items-center justify-between px-4 md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>

      <OwnerTeeTimeDetails
        teeTimeId={teeTimeId}
        courseId={courseId}
        ownerId={ownerId}
        isTransactionHistoryVisible={isTransactionHistoryVisible}
      />
    </main>
  );
}
