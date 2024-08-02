"use client";

import { api } from "~/utils/api";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";

export const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  console.log(isMobile);

  const styling = useMemo(() => {
    if (pathname.includes("/checkout")) {
      return "";
    } else {
      return systemNotifications?.length === 0
        ? "pt-14"
        : isMobile === true
        ? "pt-28"
        : "pt-20";
    }
  }, [pathname]);

  return <div className={styling}>{children}</div>;
};
