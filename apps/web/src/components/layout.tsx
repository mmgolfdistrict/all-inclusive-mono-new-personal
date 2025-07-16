"use client";

import { api } from "~/utils/api";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Footer } from "./footer/footer";
import { MainNav } from "./nav/main-nav";
import { useSession } from "@golf-district/auth/nextjs-exports";

const AllowedPathsForMainNav = [
  "/",
  "/terms-of-service",
  "/privacy-policy",
  "/reset-password",
  "/login",
  "/register",
  "/forgot-password",
  "/faq",
  "/release-history",
  "/how-to-guide",
  "/about-us",
];
export const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { status } = useSession();

  const getRecievables = api.cashOut.getRecievablesMute.useMutation();

  const showBalanceToast = async () => {
    const recievableData = await getRecievables.mutateAsync({});
    if (recievableData?.withdrawableAmount > 0 && recievableData?.withdrawableAmount > 0) {
      if (localStorage.getItem("showBalanceToast") === "true") {
        setTimeout(() => {
          toast.success(
            `Congratulations! You have $${recievableData?.withdrawableAmount} in your account. Please visit 'Account Settings' to withdraw your balance by adding a bank account.`
          );
        }, 3000);
        localStorage.setItem("showBalanceToast", "false");
      }
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      void showBalanceToast();
    }
  }, [status]);

  useEffect(() => {
    const html = document.querySelector("html");
    html?.scrollTo(0, 0);
  }, [pathname]);

  const bgColor = useMemo(() => {
    if (pathname.includes("admin")) {
      return "bg-[#FFFFFF]";
    } else {
      return "bg-secondary-white";
    }
  }, [pathname]);

  console.log("pathname", pathname);

  return (
    <div className={`relative flex w-full flex-col ${bgColor} ${pathname === '/' ? 'mb-0' : 'mb-[3.6875rem]'} md:mb-0`}>
      {AllowedPathsForMainNav.includes(pathname) ? <MainNav /> : null}

      <div className={`min-h-[100dvh] ${bgColor}`}>{children}</div>
      <Footer />
    </div>
  );
};
