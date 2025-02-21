"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import { FilledButton } from "~/components/buttons/filled-button";
import { TransactionHistory } from "~/components/cards/transaction-history";
import { UnlistedDetails } from "~/components/cards/unlisted-details";
import { CourseDescription } from "~/components/tee-time-page/course-description";
import { InviteFriends } from "~/components/tee-time-page/invite-friends";
import { useAppContext } from "~/contexts/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface OwnerTeeTimeDetailsProps {
  teeTimeId: string;
  courseId: string;
  ownerId: string;
  isTransactionHistoryVisible: string | undefined | null;
}

const OwnerTeeTimeDetails = ({
  teeTimeId,
  courseId,
  ownerId,
  isTransactionHistoryVisible,
}: OwnerTeeTimeDetailsProps) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { setPrevPath } = useAppContext();

  return (
    <div>
      {" "}
      {!session ? (
        status == "loading" ? null : (
          <div className="min-h-[450px] flex items-center justify-center">
            <Link
              href={`/${courseId}/login`}
              onClick={() => {
                setPrevPath({
                  path: pathname,
                  createdAt: new Date().toISOString(),
                });
              }}
              data-testid="login-to-view-id"
            >
              <FilledButton>Login to view</FilledButton>
            </Link>
          </div>
        )
      ) : (
        <section className="flex flex-col gap-4 pl-0 pt-6 md:flex-row md:pl-6 md:pt-8">
          <div className="hidden md:block">
            <CourseDescription />
          </div>
          <div className="flex w-full flex-col gap-4 pr-0 md:pr-6">
            <UnlistedDetails ownerId={ownerId} teeTimeId={teeTimeId} />

            <div className="md:hidden">
              <CourseDescription />
            </div>
            {"true" === isTransactionHistoryVisible?.toLowerCase() && (
              <TransactionHistory teeTimeId={teeTimeId} />
            )}
            <InviteFriends teeTimeId={teeTimeId} />
          </div>
        </section>
      )}
    </div>
  );
};

export default OwnerTeeTimeDetails;
