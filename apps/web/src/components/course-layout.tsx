"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";

export const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();

  const { course } = useCourseContext();
  const courseId = course?.id;

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: courseId ?? "",
    });

  const notificationsCount =
    (systemNotifications ? systemNotifications.length : 0) +
    (courseGlobalNotification ? courseGlobalNotification.length : 0);

  const styling = useMemo(() => {
    if (pathname.includes("/checkout")) {
      return "";
    } else {
      return notificationsCount === 0 ? "pt-14" : isMobile ? "pt-28" : "pt-20";
    }
  }, [pathname, notificationsCount, isMobile]);

  return <div className={styling}>{children}</div>;
};
