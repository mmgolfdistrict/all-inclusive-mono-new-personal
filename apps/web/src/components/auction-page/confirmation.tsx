"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import Link from "next/link";
import { FilledButton } from "../buttons/filled-button";

export const Confirmation = () => {
  const { course } = useCourseContext();
  const { user } = useUserContext();
  return (
    <section className="mx-auto mt-6 flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[780px] md:rounded-xl md:p-6 md:py-4">
      <video
        className="max-h-[200px] w-full"
        autoPlay
        muted
        playsInline
        preload="auto"
        // width={780}
        // height={439}
        src={"/videos/confirmation.mp4"}
      />
      <h1 className="text-[24px] md:text-[32px]">
        Thanks For Your Auction Purchase!
      </h1>
      <p className="text-[14px] text-primary-gray md:text-[16px]">
        lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
      </p>
      <p className="text-[14px] text-primary-gray md:text-[16px]">
        lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lorem ipsum
        dolor sit amet, consectetur adipiscing elit. Sed
      </p>
      <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
        <Link
          href={`/${course?.id}/profile/${user?.id}`}
          className="w-full md:w-fit md:min-w-[250px]"
          data-testid="go-to-profile-button-id"
        >
          <FilledButton className="w-full">Go to Profile</FilledButton>
        </Link>
      </div>
    </section>
  );
};
