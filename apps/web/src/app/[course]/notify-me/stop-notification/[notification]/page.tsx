"use client";

import { api } from "~/utils/api";
import Link from "next/link";
import React, { useEffect } from "react";

function StopNotification({ params }: { params: { notification: string } }) {
  const { mutateAsync } =
    api.userWaitlist.deleteWaitlistNotification.useMutation();

  const handleStopNotification = async () => {
    await mutateAsync({ ids: [params.notification] });
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleStopNotification();
  }, [params.notification]);

  return (
    <div className="flex justify-center flex-col items-center h-[200px]">
      <span>Stopped notification successfully</span>
      <Link href="/" className="underline">
        Return to home
      </Link>
    </div>
  );
}

export default StopNotification;
