"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";

export const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  console.log("pathname", pathname);

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

  const marginTop =
    notificationsCount > 0
      ? notificationsCount >= 5
        ? `${notificationsCount * 27 + 20}px`
        : `${notificationsCount * 20}px`
      : "0";
  const styling = useMemo(() => {
    const coursePathPattern = `/${courseId}/`;

    if (pathname.includes("/checkout")) {
      return "";
    }
    if (courseId && pathname.includes(coursePathPattern)) {
      return isMobile ? "pt-0" : "pt-16";
    } else {
      return isMobile ? "pt-0" : "pt-12";
    }
  }, [pathname, notificationsCount, isMobile]);

  // const divHeight = document?.getElementById('notification-container')?.offsetHeight;

  return (
    <div className={styling} style={{ marginTop }}>
      {children}
    </div>
  );
};
