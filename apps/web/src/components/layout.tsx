"use client";

import { getNICDetails } from "~/utils/ipUtility";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Footer } from "./footer/footer";
import { MainNav } from "./nav/main-nav";

const AllowedPathsForMainNav = [
  "/",
  "/terms-of-service",
  "/privacy-policy",
  "/reset-password",
  "/login",
  "/register",
  "/forgot-password",
  "/faq",
  "/how-to-guide",
  "/about-us",
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const query = useSearchParams();

  const errorKey = query.get("error");
  const nicInfos = getNICDetails();

  useEffect(() => {
    const html = document.querySelector("html");
    html?.scrollTo(0, 0);
  }, [pathname]);

  const topPadding = useMemo(() => {
    if (pathname.includes("admin")) {
      return "";
    } else {
      return "pt-[67px] md:pt-[89px]";
    }
  }, [pathname]);

  const bgColor = useMemo(() => {
    if (pathname.includes("admin")) {
      return "bg-[#FFFFFF]";
    } else {
      return "bg-secondary-white";
    }
  }, [pathname]);

  return (
    <div className={`relative flex w-full flex-col ${bgColor}`}>
      {AllowedPathsForMainNav.includes(pathname) ? <MainNav /> : null}

      <div className={`min-h-[100dvh] ${bgColor} ${topPadding}`}>
        {children}
      </div>
      <Footer />
    </div>
  );
};
