"use client";

import { GoBack } from "~/components/buttons/go-back";
import { ProfileDetails } from "~/components/profile-page/profile-details";
import { TeeTimeHistory } from "~/components/profile-page/tee-time-history";
import { UpcomingTeeTimes } from "~/components/profile-page/upcoming-tee-times";

export default function Profile({
  params,
}: {
  params: { course: string; userId: string };
}) {
  const courseId = params.course;
  const userId = params.userId;

  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
        <ProfileDetails />

        <UpcomingTeeTimes courseId={courseId} userId={userId} />
        <TeeTimeHistory courseId={courseId} />
      </section>
    </main>
  );
}
