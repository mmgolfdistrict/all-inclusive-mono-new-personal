"use client";

import { signOut, useSession } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { getBgColor } from "~/utils/formatters";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
import { Auction } from "../icons/auction";
import { Calendar } from "../icons/calendar";
import { Hamburger } from "../icons/hamburger";
import { Marketplace } from "../icons/marketplace";
import { Megaphone } from "../icons/megaphone";
import { MyOffers } from "../icons/my-offers";
import { Search } from "../icons/search";
import { BlurImage } from "../images/blur-image";
import { PoweredBy } from "../powered-by";
import { PathsThatNeedRedirectOnLogout, UserInNav } from "../user/user-in-nav";
import { NavItem } from "./nav-item";
import { SideBar } from "./side-bar";

export const CourseNav = () => {
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const { entity, setPrevPath } = useAppContext();
  const courseId = course?.id;
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const session = useSession();
  const router = useRouter();

  const { data: unreadOffers } = api.user.getUnreadOffersForCourse.useQuery(
    {
      courseId: courseId ?? "",
    },
    {
      enabled: courseId !== undefined && user?.id !== undefined,
    }
  );

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: isUserBlocked } = api.user.isUserBlocked.useQuery({
    userEmail: session?.data?.user.email ?? "",
  });

  const auditLog = api.webhooks.auditLog.useMutation();

  const logAudit = (func: () => any) => {
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

  // if (pathname.includes("/checkout")) return null;

  return (
    <div className="fixed top-0 w-full z-20">
      <div className="relative">
        {systemNotifications?.map((elm) => (
          <div
            key={elm.id}
            className={`bg-${getBgColor(
              elm.displayType
            )} text-white w-full p-1 text-center`}
          >
            {elm.shortMessage} : {elm.longMessage}
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
        <div className="flex items-center gap-6 md:gap-4">
          <div className="hidden md:block">
            <PoweredBy id="powered-by-sidebar" />
          </div>

          {user && session.status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <UserInNav />
            </div>
          ) : session.status == "loading" ? null : (
            session.status != "authenticated" && (
              <Link
                href={`/${course?.id}/login`}
                onClick={() => {
                  setPrevPath({
                    path: pathname,
                    createdAt: new Date().toISOString(),
                  });
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

      <div className={`w-full bg-white border-b border-stroke`}>
        <div className="flex w-full justify-center bg-white p-2 md:p-4">
          <div className="flex justify-between gap-4 md:gap-8">
            <NavItem
              href={`/${courseId}`}
              text="Find Times"
              icon={<Search className="w-[16px]" />}
              data-testid="tee-time-id"
              data-test={courseId}
            />
            {course?.supportsWaitlist ? (
              <NavItem
                href={`/${courseId}/notify-me`}
                text="Waitlist"
                icon={<Megaphone className="w-[16px]" />}
                data-testid="notify-me-id"
                data-test={courseId}
              />
            ) : null}
            {course?.allowAuctions ? (
              <NavItem
                href={`/${courseId}/auctions`}
                text="Auctions"
                icon={<Auction className="w-[16px]" />}
                data-testid="auction-id"
                data-test={courseId}
              />
            ) : null}
            <NavItem
              href={`/${courseId}/my-tee-box`}
              text="Sell"
              icon={<Marketplace className="w-[16px]" />}
              data-testid="sell-your-tee-time-id"
              data-test={courseId}
            />
            <NavItem
              href={`/${courseId}/my-tee-box?section=owned`}
              text="My Tee Box"
              icon={<Calendar className="w-[16px]" />}
              data-testid="sell-your-tee-time-id"
              data-test={courseId}
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
              />
            ) : null}
          </div>
        </div>
      </div>

      <SideBar
        isSideBarOpen={isSideBarOpen}
        setIsSideBarOpen={setIsSideBarOpen}
      />
    </div>
  );
};
