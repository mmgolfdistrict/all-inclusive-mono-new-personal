"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const styling = useMemo(() => {
    if (pathname.includes("/checkout")) {
      return "";
    } else {
      return "pt-14";
    }
  }, [pathname]);

  return <div className={styling}>{children}</div>;
};
