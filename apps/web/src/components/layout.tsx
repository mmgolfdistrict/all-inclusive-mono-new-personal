"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
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
  "/about-us",
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.querySelector("html");
    html?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative flex w-full flex-col bg-secondary-white">
      {AllowedPathsForMainNav.includes(pathname) ? <MainNav /> : null}

      <div className="min-h-[100dvh] bg-secondary-white pt-[67px]  md:pt-[89px]">
        {children}
      </div>
      <Footer />
    </div>
  );
};
