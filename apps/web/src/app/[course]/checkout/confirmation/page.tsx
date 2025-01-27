"use client";

import { Confirmation } from "~/components/checkout-page/confirmation";
import { CheckoutBreadcumbs } from "~/components/nav/checkout-breadcrumbs";
import { useSearchParams } from "next/navigation";
import { api } from "~/utils/api";
import { useCourseContext } from "~/contexts/CourseContext";

export default function CheckoutConfirmation() {
  const params = useSearchParams();
  const { course } = useCourseContext();
  const teeTimeId = params.get("teeTimeId");
  const bookingId = params.get("bookingId");
  const isEmailSend = params.get("isEmailSend") === "true";

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: course?.id ?? "",
    });

  const notificationsCount =
    (systemNotifications ? systemNotifications.length : 0) +
    (courseGlobalNotification ? courseGlobalNotification.length : 0);

  const marginTop = notificationsCount > 0 ? `${notificationsCount * 8}px` : "0";
  return (
    <div className="relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8" style={{ marginTop }}>
      <div className="h-12 w-full "></div>
      <CheckoutBreadcumbs status={"confirmation"} />
      <Confirmation
        teeTimeId={teeTimeId!}
        bookingId={bookingId ?? ""}
        isEmailSend={isEmailSend}
      />
    </div>
  );
}
