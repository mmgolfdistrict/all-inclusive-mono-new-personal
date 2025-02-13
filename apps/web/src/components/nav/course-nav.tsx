"use client";

import { signOut, useSession } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { toast } from "react-toastify";
import "./courseNav.css";
import { ThreeDots } from "../icons/threedots";
import { UserProfile } from "../icons/user-profile";

export const CourseNav = () => {
  const { user } = useUserContext();
  const { entity, setPrevPath } = useAppContext();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const session = useSession();
  const { setDateType } = useFiltersContext();
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

  const { data: courseGlobalNotification } =
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


  const { data: walkthrough } =
    api.systemNotification.getWalkthroughSetting.useQuery({});
  const { data: walkthroughSections } =
    api.systemNotification.getGuidMeSetting.useQuery({});

  const handleGuideMe = () => {
    if (!walkthroughSections?.length || !walkthrough?.length) {
      console.warn("No walkthrough or walkthrough sections available.");
      return;
    }

    let internalNameToMatch;

    if (/^\/[^/]+$/.test(pathname)) {
      internalNameToMatch = "teeTime";
    } else {
      const matchedWalkthrough = walkthrough.find((wt) =>
        pathname.includes(wt.internalName)
      );
      if (!matchedWalkthrough) {
        toast.error("No help available.");
        return;
      }
      internalNameToMatch = matchedWalkthrough.internalName;
    }

    const selectedWalkthrough = walkthrough.find(
      (wt) => wt.internalName === internalNameToMatch
    );

    if (!selectedWalkthrough) {
      toast.error("No help available.");
      return;
    }

    const filteredSections = walkthroughSections.filter(
      (section) => section.walkthroughId === selectedWalkthrough.id
    );

    if (!filteredSections.length) {
      return;
    }

    // Shepherd Tour initialization
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        classes: "shadow-md bg-blue-dark mt-2.5",
        scrollTo: { behavior: "smooth", block: "center" },
      },
    });

    const removeHighlight = () => {
      document.querySelectorAll('[data-highlighted="true"]').forEach((el) => {
        const highlightedEl = el as HTMLElement;
        highlightedEl.style.border = "";
        highlightedEl.style.padding = "1px";
        highlightedEl.style.borderRadius = "";
        highlightedEl.removeAttribute("data-highlighted");
      });
    };
    filteredSections
      .sort((a, b) => (a?.displayOrder || 0) - (b?.displayOrder || 0))
      .forEach((section) => {
        const buttons = [
          {
            text: "Next",
            action: () => tour.next(),
            classes:
              "!bg-primary !rounded-xl !min-w-[110px] !border-2 !border-primary !px-5 !py-1.5 !text-white",
          },
        ];

        if (section.sectionId === "manage-teetime-button") {
          buttons.unshift({
            text: "Open",
            action: () => {
              const element = document.querySelector(`#${section.sectionId}`)!;
              if (element instanceof HTMLElement) {
                void tour.cancel();
                element.click();
                // handleGuideMe()
              }
            },
            classes: "!bg-secondary",
          });
        }

        tour.addStep({
          id: section.id,
          text: section.message,
          attachTo: { element: `#${section.sectionId}`, on: "bottom" },
          when: {
            "before-show": () => {
              removeHighlight();
              const element = document.querySelector(`#${section.sectionId}`)!;
              if (element instanceof HTMLElement) {
                element.style.padding = "10px";
                element.setAttribute("data-highlighted", "true");
              }
            },
            "after-hide": removeHighlight,
          },
          buttons,
          classes: "!rounded-xl",
          title: selectedWalkthrough?.name,
        });
      });
    tour.on("cancel", removeHighlight);
    tour.on("complete", removeHighlight);

    void tour.start();
  };

  return (
    <>

      <div className="fixed top-0 w-full z-20">
        <div id="notification-container">
          <div className="relative" id="notification-container">
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
                    content={elm.longMessage}
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
                    content={elm.longMessage}
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
            <div className="flex items-center gap-6 md:gap-4">
              <div className="hidden md:block">
                <PoweredBy id="powered-by-sidebar" />
              </div>

              {user && session.status === "authenticated" ? (
                <div className="flex items-center gap-4">
                  <UserInNav />
                </div>
              ) : session.status == "loading" ? null : (
                session.status != "authenticated" &&
                pathname != `/${course?.id}/login` && (
                  <Link
                    href={
                      pathname === `/${course?.id}/login`
                        ? "#"
                        : `/${course?.id}/login`
                    }
                    onClick={(
                      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
                    ) => {
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

                <NavItem
                  href=""
                  text="Guide Me"
                  icon={<Calendar className="w-[16px]" />}
                  data-testid="sell-your-tee-time-id"
                  data-test={courseId}
                  onClick={handleGuideMe}
                />
              </div>
            </div>
          </div>
          : ""}
      </div>
      {isMobile &&
        <div className={`fixed bottom-0 w-full z-20 bg-white border-b border-stroke`}>
          <div className="flex w-full justify-center bg-white p-2 md:p-4">
            <div className="flex w-full justify-evenly gap-4 md:gap-8">
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

              <NavItem
                href={`/${courseId}/my-tee-box?section=owned`}
                text="My Tee Box"
                icon={<Calendar className="w-[16px]" />}
                data-testid="sell-your-tee-time-id"
                data-test={courseId}
                onClick={handleResetFilters}
                id="navbar-my-tee-box"
              />

              <NavItem
                href={`/${courseId}/account-settings/${user?.id}`}
                text="Account"
                icon={<UserProfile className="w-[20px] fill-[#353b3f]"/>}
                data-testid="account-settings-id"
                data-test={courseId}
                onClick={handleResetFilters}
                id="navbar-account-settings"
              />

              <NavItem
                href=""
                text=""
                icon={<ThreeDots
                  className="cursor-pointer"
                />}
                className="flex !justify-center items-center"
                onClick={toggleSideBar}
              // data-testid="sell-your-tee-time-id"
              // data-test={courseId}
              // onClick={handleGuideMe}
              />

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
