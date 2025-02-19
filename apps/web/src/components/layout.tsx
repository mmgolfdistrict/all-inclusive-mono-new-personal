"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "./footer/footer";
import { MainNav } from "./nav/main-nav";
import { toast } from "react-toastify";
import { api } from "~/utils/api";

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

  const getRecievables = api.cashOut.getRecievablesMute.useMutation();
    const showBalanceToast = async () =>{
      const recievableData = await getRecievables.mutateAsync({});
      if (localStorage.getItem("showBalanceToast") === "true") {
        setTimeout(() => {
          toast.success(`Congratulations! You have $${recievableData?.withdrawableAmount} in your account. Please visit 'Account Settings' to withdraw your balance by adding a bank account.`);
        }, 3000);
      localStorage.setItem("showBalanceToast", "false"); 
      }
    }
    
  useEffect(() => {
    showBalanceToast()
  }, []);

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
