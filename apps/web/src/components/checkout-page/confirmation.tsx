"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import Link from "next/link";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Facebook } from "../icons/share/facebook";
import { Instagram } from "../icons/share/instagram";
import { LinkedIn } from "../icons/share/linkedin";
import { X } from "../icons/share/x";
import { InviteFriends } from "../tee-time-page/invite-friends";

export const Confirmation = ({ teeTimeId }: { teeTimeId: string }) => {
  const { course } = useCourseContext();
  return (
    <section className="mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[780px] md:rounded-xl md:p-6 md:py-4">
      <video
        className="max-h-[200px] w-full"
        autoPlay
        muted
        playsInline
        // width={780}
        // height={439}

        src={"/videos/confirmation.mp4"}
      />
      <h1 className="text-[24px] md:text-[32px]">Thanks for your purchase</h1>
      <p className="text-[14px] text-primary-gray md:text-[16px]">
        Your Tee-Time will be viewable in your Profile. All purchases are final.
        You can sell or adjust your tee-time up to 30 minutes before the
        scheduled time.
      </p>
      <p className="text-[14px] text-primary-gray md:text-[16px]">
        Add your golfers to your tee time. You can invite your friends to your
        tee time with the option of splitting the fare.
      </p>
      <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
        <Link
          href={`/${course?.id}/my-tee-box`}
          className="w-full md:w-fit md:min-w-[250px]"
        >
          <FilledButton className="w-full">Go To My Tee Box</FilledButton>
        </Link>
      </div>
      <InviteFriends isConfirmationPage={true} teeTimeId={teeTimeId} />
      <div className="flex flex-col gap-2">
        <div className="text-secondary-black">Share your Tee-Time</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <OutlineButton
            className={"flex h-[48px] w-[48px] items-center justify-center"}
          >
            <Facebook className="min-h-[24px] min-w-[24px]" />
          </OutlineButton>
          <OutlineButton
            className={"flex h-[48px] w-[48px] items-center justify-center"}
          >
            <X className="min-h-[24px] min-w-[24px]" />
          </OutlineButton>
          <OutlineButton
            className={"flex h-[48px] w-[48px] items-center justify-center"}
          >
            <LinkedIn className="min-h-[24px] min-w-[24px]" />
          </OutlineButton>
          <OutlineButton
            className={"flex h-[48px] w-[48px] items-center justify-center"}
          >
            <Instagram className="min-h-[24px] min-w-[24px]" />
          </OutlineButton>
        </div>
      </div>
    </section>
  );
};
