"use client";

import { signOut, useSession } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
import { Auction } from "../icons/auction";
import { Calendar } from "../icons/calendar";
import { Hamburger } from "../icons/hamburger";
import { Info } from "../icons/info";
import { Marketplace } from "../icons/marketplace";
import { Megaphone } from "../icons/megaphone";
import { MyOffers } from "../icons/my-offers";
import { Search } from "../icons/search";
import { BlurImage } from "../images/blur-image";
import { PoweredBy } from "../powered-by";
import { Tooltip } from "../tooltip";
import { PathsThatNeedRedirectOnLogout, UserInNav } from "../user/user-in-nav";
import { NavItem } from "./nav-item";
import { SideBar } from "./side-bar";
import "shepherd.js/dist/css/shepherd.css";
import "./courseNav.css";
import { ThreeDots } from "../icons/threedots";
import { UserProfile } from "../icons/user-profile";
import { DownArrow } from "../icons/down-arrow";

export const CourseNav = () => {
  const { user } = useUserContext();
  const { entity, setPrevPath, isNavExpanded,
    setIsNavExpanded, setHeaderHeight } = useAppContext();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const session = useSession();
  const { setDateType } = useFiltersContext();
  const router = useRouter();
  const bottomNavRef = useRef<HTMLDivElement | null>(null);

  const toggleNavExpansion = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  const { data: unreadOffers } = api.user.getUnreadOffersForCourse.useQuery(
    {
      courseId: courseId ?? "",
    },
    {
      enabled: courseId !== undefined && user?.id !== undefined,
    }
  );

  const { data: systemNotifications, isLoading: loadingSystemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification, isLoading: loadingCourseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: courseId ?? "",
    });

  const { data: isUserBlocked } = api.user.isUserBlocked.useQuery({
    userEmail: session?.data?.user.email ?? "",
  });

  const auditLog = api.webhooks.auditLog.useMutation();

  const logAudit = (func: () => unknown) => {
    auditLog
      .mutateAsync({
        userId: user?.id ?? "",
        teeTimeId: "",
        bookingId: "",
        listingId: "",
        courseId,
        eventId: "USER_LOGGED_OUT",
        json: `user logged out `,
      })
      .then((res) => {
        if (res) {
          func();
        }
      })
      .catch((err) => {
        console.log("error", err);
      });
  };

  useEffect(() => {
    (() => {
      if (isUserBlocked) {
        logAudit(async () => {
          localStorage.clear();
          sessionStorage.clear();
          session.data = null;
          session.status = "unauthenticated";
          await session.update(null);
          if (PathsThatNeedRedirectOnLogout.some((i) => pathname.includes(i))) {
            const data = await signOut({
              callbackUrl: `/${courseId}`,
              redirect: false,
            });
            router.push(data.url);
            return;
          }
          const data = await signOut({
            callbackUrl: pathname,
            redirect: false,
          });
          router.push(data.url);
        });
      }
    })();
  }, [isUserBlocked]);

  useEffect(() => {
    if (isSideBarOpen && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isSideBarOpen, isMobile]);

  const toggleSideBar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };

  const handleResetFilters = () => {
    setDateType("All");
  };

  const divHeight = !loadingCourseGlobalNotification || !loadingSystemNotifications ? document?.getElementById('header')?.offsetHeight || 0 : 0;
  setHeaderHeight(divHeight)

  return (
    <>
      <div className="fixed top-0 w-full z-20" id="header">
        <div id="notification-container">
          <div className="relative" >
            {systemNotifications?.map((elm) => (
              <div
                key={elm.id}
                style={{
                  backgroundColor: elm.bgColor,
                  color: elm.color,
                }}
                className="w-full p-1 text-center flex items-center justify-center"
              >
                {elm.shortMessage}
                {elm.longMessage && (
                  <Tooltip
                    trigger={
                      <Info longMessage className="ml-2 h-[20px] w-[20px]" />
                    }
                    content={<div>
                      {elm.longMessage.split("\\n").map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>}
                  />
                )}
              </div>
            ))}
            {courseGlobalNotification?.map((elm) => (
              <div
                key={elm.id}
                style={{
                  backgroundColor: elm.bgColor,
                  color: elm.color,
                }}
                className="text-white w-full p-1 text-center flex items-center justify-center"
              >
                {elm.shortMessage}
                {elm.longMessage && (
                  <Tooltip
                    trigger={
                      <Info longMessage className="ml-2 h-[20px] w-[20px]" />
                    }
                    content={<div>
                      {elm.longMessage.split("\\n").map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>}
                  />
                )}
              </div>
            ))}
            {isSideBarOpen && (
              <div
                className={`fixed z-20 h-[100dvh] w-screen backdrop-blur ${isSideBarOpen ? "md:hidden" : ""
                  }`}
              >
                <div className="h-screen bg-[#00000099]" />
              </div>
            )}
          </div>

          <div className="relative min-h-[67px] flex w-full items-center justify-between border-b border-stroke-secondary bg-white p-4 md:justify-end md:p-6">
            <div className="flex items-center gap-4 md:hidden">
              {pathname !== "/" ? (
                <Hamburger
                  onClick={toggleSideBar}
                  className="h-[25px] w-[25px] cursor-pointer"
                  data-testid="hamburger-menu-id"
                />
              ) : (
                <div />
              )}
            </div>

            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform`}
            >
              {entity?.redirectToCourseFlag ? (
                <BlurImage
                  src={course?.logo ?? ""}
                  alt="course logo"
                  width={60}
                  height={100}
                  className="w-[50px] object-fit"
                  data-testid="course-logo-id"
                />
              ) : (
                <Link href="/" data-testid="course-logo-id">
                  <BlurImage
                    src={course?.logo ?? ""}
                    alt="course logo"
                    width={60}
                    height={100}
                    className="w-[50px] object-fit"
                  />
                </Link>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              {/* Mobile: Show PoweredBy on top */}
              <div className="md:hidden mb-2">
                <PoweredBy id="powered-by-sidebar" />
              </div>

              {/* Desktop: Show PoweredBy inline */}
              <div className="hidden md:block">
                <PoweredBy id="powered-by-sidebar" />
              </div>

              <div className="flex items-center gap-6">
                {user && session.status === "authenticated" ? (
                  <div className="flex items-center gap-4">
                    <UserInNav />
                  </div>
                ) : session.status === "loading" ? null : (
                  session.status !== "authenticated" &&
                  pathname !== `/${course?.id}/login` && (
                    <Link
                      href={
                        pathname === `/${course?.id}/login`
                          ? "#"
                          : `/${course?.id}/login`
                      }
                      onClick={(event) => {
                        if (pathname === `/${course?.id}/login`) {
                          event.preventDefault();
                        } else {
                          setPrevPath({
                            path: pathname,
                            createdAt: new Date().toISOString(),
                          });
                        }
                      }}
                    >
                      <FilledButton
                        className="hidden md:block"
                        data-testid="signin-button-id"
                      >
                        Log In
                      </FilledButton>
                    </Link>
                  )
                )}
              </div>
            </div>


          </div>
        </div>
        {!isMobile ?
          <div className={`w-full z-20 bg-white border-b border-stroke`}>
            <div className="flex w-full justify-center bg-white p-2 md:p-4">
              <div className="flex justify-between gap-4 md:gap-8">
                <NavItem
                  href={`/${courseId}`}
                  text="Find Times"
                  icon={<Search className="w-[16px]" />}
                  data-testid="tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-find-times"
                />
                {course?.supportsWaitlist ? (
                  <NavItem
                    href={`/${courseId}/notify-me`}
                    text="Waitlist"
                    icon={<Megaphone className="w-[16px]" />}
                    data-testid="notify-me-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-waitlist"
                  />
                ) : null}
                {course?.supportsGroupBooking ? (
                  <NavItem
                    href={`/${courseId}/group-booking`}
                    text="Group Booking"
                    icon={<Megaphone className="w-[16px]" />}
                    data-testid="group-booking-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="group-booking"
                  />
                ) : null}
                {course?.allowAuctions ? (
                  <NavItem
                    href={`/${courseId}/auctions`}
                    text="Auctions"
                    icon={<Auction className="w-[16px]" />}
                    data-testid="auction-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-auctions"
                  />
                ) : null}
                <NavItem
                  href={`/${courseId}/my-tee-box`}
                  text="Sell"
                  icon={<Marketplace className="w-[16px]" />}
                  data-testid="sell-your-tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-sell"
                />
                <NavItem
                  href={`/${courseId}/my-tee-box?section=owned`}
                  text="My Tee Box"
                  icon={<Calendar className="w-[16px]" />}
                  data-testid="sell-your-tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-my-tee-box"
                />

                {course?.supportsOffers ? (
                  <NavItem
                    href={
                      user
                        ? `/${courseId}/my-tee-box?section=offers-received`
                        : `/${course?.id}/login`
                    }
                    text="My Offers"
                    icon={
                      <div className="relative">
                        <MyOffers className="w-[20px]" />
                        {unreadOffers && unreadOffers > 0 ? (
                          <div className="absolute -right-3.5 -top-2 md:-right-2.5 md:-top-4 flex h-5 w-5 min-w-fit select-none items-center justify-center rounded-full border-2 border-white bg-alert-red p-1 text-[10px] font-semibold text-white">
                            {unreadOffers}
                          </div>
                        ) : null}
                      </div>
                    }
                    data-testid="my-offer-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-my-offers"
                  />
                ) : null}
              </div>
            </div>
          </div>
          : ""}
      </div>
      {isMobile &&
        <div className={`fixed bottom-0 w-full z-20 bg-white border-t border-[#c6c6c6] `} id="bottom-nav">
          <div className="flex w-full justify-center bg-white p-2 md:p-4">
            <div className={`flex w-full ${isNavExpanded ? "gap-4" : ""} flex-col`}>
              <div className="flex w-full justify-between gap-4">
                <NavItem
                  href={`/${courseId}`}
                  text="Find Times"
                  icon={<Search className="w-[16px]" />}
                  data-testid="tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-find-times"
                  className="max-w-[64px]"
                />
                <NavItem
                  href={`/${courseId}/my-tee-box`}
                  text="Sell"
                  icon={<Marketplace className="w-[16px]" />}
                  data-testid="sell-your-tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-sell"
                  className="max-w-[64px] ml-2"
                />
                {course?.supportsWaitlist ? (
                  <NavItem
                    href={`/${courseId}/notify-me`}
                    text="Waitlist"
                    icon={<Megaphone className="w-[22px]" />}
                    data-testid="notify-me-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-waitlist"
                    className="max-w-[64px] ml-2"
                  />
                ) : null}

                <NavItem
                  href={user && session.status === "authenticated" ? `/${courseId}/account-settings/${user?.id}` : `/${courseId}/login`}
                  text="Account"
                  icon={<UserProfile className="w-[20px] fill-[#353b3f]" />}
                  data-testid="account-settings-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-account-settings"
                  className="max-w-[64px]"
                />

                <NavItem
                  href=""
                  text=""
                  icon={isNavExpanded ?
                    <DownArrow className="w-[35px] cursor-pointer" /> :
                    <ThreeDots className="cursor-pointer" direction="vertical" />
                  }
                  className="flex !justify-center items-center w-[35px] max-w-[64px]"
                  onClick={toggleNavExpansion}
                  data-testid="sell-your-tee-time-id"
                />
              </div>
              <div
                ref={bottomNavRef}
                className={`flex w-full justify-between gap-4 transition-all duration-200 ease-in-out ${isNavExpanded
                  ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <NavItem
                  href={`/${courseId}/my-tee-box?section=owned`}
                  text={`My Tee Box`}
                  icon={<Calendar className="w-[20px]" />}
                  data-testid="sell-your-tee-time-id"
                  data-test={courseId}
                  onClick={handleResetFilters}
                  id="navbar-my-tee-box"
                  className="max-w-[64px]"
                />

                {course?.supportsGroupBooking ? (
                  <NavItem
                    href={`/${courseId}/group-booking`}
                    text="Group Booking"
                    icon={<Megaphone className="w-[20px]" />}
                    data-testid="group-booking-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    className="max-w-[64px]"
                  />
                ) : null}
                {course?.allowAuctions ? (
                  <NavItem
                    href={`/${courseId}/auctions`}
                    text="Auctions"
                    icon={<Auction className="w-[24px]" />}
                    data-testid="auction-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-auctions"
                    className="max-w-[64px]"
                  />
                ) : <NavItem
                  href=""
                  text="No Menu"
                  className="flex !justify-center items-center max-w-[64px] invisible"
                />}
                {course?.supportsOffers ? (
                  <NavItem
                    href={
                      user
                        ? `/${courseId}/my-tee-box?section=offers-received`
                        : `/${course?.id}/login`
                    }
                    text="My Offers"
                    icon={
                      <div className="relative">
                        <MyOffers className="w-[20px]" />
                        {unreadOffers && unreadOffers > 0 ? (
                          <div className="absolute -right-3.5 -top-2 md:-right-2.5 md:-top-4 flex h-5 w-5 min-w-fit select-none items-center justify-center rounded-full border-2 border-white bg-alert-red p-1 text-[10px] font-semibold text-white">
                            {unreadOffers}
                          </div>
                        ) : null}
                      </div>
                    }
                    data-testid="my-offer-id"
                    data-test={courseId}
                    onClick={handleResetFilters}
                    id="navbar-my-offers"
                    className="max-w-[64px]"
                  />
                ) : <NavItem
                  href=""
                  text="No Menu"
                  className="flex !justify-center items-center max-w-[64px] invisible"
                />}
                <NavItem
                  href=""
                  text="No Menu"
                  className="flex !justify-center items-center max-w-[64px] invisible"
                />
              </div>
            </div>

          </div>
        </div>
      }
      <SideBar
        isSideBarOpen={isSideBarOpen}
        setIsSideBarOpen={setIsSideBarOpen}
      />
    </>
  );
};
