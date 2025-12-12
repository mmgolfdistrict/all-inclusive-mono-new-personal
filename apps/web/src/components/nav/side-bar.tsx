import { signOut, useSession } from "@golf-district/auth/nextjs-exports";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { Auction } from "../icons/auction";
import { Calendar } from "../icons/calendar";
import { Close } from "../icons/close";
import { Marketplace } from "../icons/marketplace";
import { Megaphone } from "../icons/megaphone";
import { MyOffers } from "../icons/my-offers";
import { Search } from "../icons/search";
import { PoweredBy } from "../powered-by";
import { PathsThatNeedRedirectOnLogout } from "../user/user-in-nav";
import { NavItem } from "./nav-item";
import { GroupBooking } from "../icons/group-booking";

type SideBarProps = {
  isSideBarOpen: boolean;
  setIsSideBarOpen: Dispatch<SetStateAction<boolean>>;
};

export const SideBar = ({ isSideBarOpen, setIsSideBarOpen }: SideBarProps) =>
{
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const { data: unreadOffers } = api.user.getUnreadOffersForCourse.useQuery(
    {
      courseId: courseId ?? "",
    },
    {
      enabled: user?.id !== undefined && courseId !== undefined,
    }
  );

  const { data: imageUrl } = api.image.getAssetUrl.useQuery(
    { assetId: user?.image ?? "" },
    {
      enabled: !!user?.image,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const { toggleSidebar } = useSidebar({
    isOpen: isSideBarOpen,
    setIsOpen: setIsSideBarOpen,
  });

  const auditLog = api.webhooks.auditLog.useMutation();

  const logAudit = (func: () => unknown) =>
  {
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
      .then((res) =>
      {
        if (res)
        {
          func();
        }
      })
      .catch((err) =>
      {
        console.log("error", err);
      });
  };

  const logOutUser = () =>
  {
    try
    {
      logAudit(async () =>
      {
        localStorage.clear();
        sessionStorage.clear();
        try
        {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          console.log("All caches cleared.");
        } catch (error)
        {
          console.error("Error clearing caches:", error);
        }
        if (document.cookie)
        {
          document.cookie.split(";").forEach((cookie) =>
          {
            const cookieName = cookie.split("=")[0]?.trim();
            if (cookieName)
            {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            }
          });
        }
        if (PathsThatNeedRedirectOnLogout.some((i) => pathname.includes(i)))
        {
          const data = await signOut({
            callbackUrl: `/${courseId}`,
            redirect: false,
          });
          router.push(data.url);
          return;
        } else
        {
          await signOut();
        }
      });
      localStorage.removeItem("googlestate");
      localStorage.removeItem("linkedinstate");
    } catch (error)
    {
      console.log(error);
    } finally
    {
      localStorage.removeItem("googlestate");
      toggleSidebar();
    }
  };
  return (
    <>
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed left-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[20rem] md:-translate-x-[105%]  ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex  items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              {session.status === "loading" ? null : user &&
                session.status === "authenticated" ? null : (
                <Link
                  href={`/${courseId}/login`}
                  onClick={toggleSidebar}
                  data-testid="login-button-id"
                >
                  <FilledButton>Login</FilledButton>
                </Link>
              )}
            </div>
            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isSideBarOpen}
              className="z-[2] p-4"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[1.5625rem] w-[1.5625rem]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col">
              <NavItem
                href={`/${courseId}`}
                text="Find"
                icon={<Search className="w-4" />}
                className="border-t border-stroke-secondary p-2 md:p-4"
                onClick={toggleSidebar}
                data-testid="tee-time-course-id"
                data-test={courseId}
              />
              {course?.supportsWaitlist ? (
                <NavItem
                  href={`/${courseId}/notify-me`}
                  text="Waitlist"
                  icon={<Megaphone className="w-4" />}
                  className="border-t border-stroke-secondary p-2 md:p-4"
                  onClick={toggleSidebar}
                  data-testid="notify-me-id"
                  data-test={courseId}
                />
              ) : null}
              {course?.supportsGroupBooking ? (
                <NavItem
                  href={`/${courseId}/group-booking`}
                  text="Group Booking"
                  icon={<GroupBooking className="w-4" />}
                  className="border-t border-stroke-secondary p-2 md:p-4"
                  data-testid="group-booking-id"
                  data-test={courseId}
                  onClick={toggleSidebar}
                />
              ) : null}
              {course?.allowAuctions ? (
                <NavItem
                  href={`/${courseId}/auctions`}
                  text="Auctions"
                  icon={<Auction className="w-4" />}
                  className="border-t border-stroke-secondary p-2 md:p-4"
                  onClick={toggleSidebar}
                  data-testid="auction-id"
                  data-test={courseId}
                />
              ) : null}
              <NavItem
                href={`/${courseId}/my-tee-box`}
                text="Sell"
                icon={<Marketplace className="w-4" />}
                className="border-t border-stroke-secondary p-2 md:p-4"
                onClick={toggleSidebar}
                data-testid="my-tee-box-id"
                data-test={courseId}
              />
              <NavItem
                href={`/${courseId}/my-tee-box?section=my-listed-tee-times`}
                text="My Tee Times"
                icon={<Calendar className="w-4" />}
                className="border-t border-stroke-secondary p-2 md:p-4"
                onClick={toggleSidebar}
                data-testid="my-tee-box-id"
                data-test={courseId}
              />

              {course?.supportsOffers ? (
                <NavItem
                  href={
                    user && session.status === "authenticated"
                      ? `/${courseId}/my-tee-box?section=offers-received`
                      : `/${courseId}/login`
                  }
                  text="My Offers"
                  onClick={() =>
                  {
                    toggleSidebar();
                  }}
                  icon={
                    <div className="relative">
                      <MyOffers className="w-5" />
                      {unreadOffers && unreadOffers > 0 ? (
                        <div className="absolute -right-3.5 -top-2 flex h-5 w-5 min-w-fit select-none items-center justify-center rounded-full border-2 border-white bg-alert-red p-1 text-[0.625rem] font-semibold text-white">
                          {unreadOffers}
                        </div>
                      ) : null}
                    </div>
                  }
                  className="border-b border-t border-stroke-secondary p-2 md:p-4"
                  data-testid="my-offer-id"
                  data-test={courseId}
                />
              ) : null}
            </div>
            {user && session.status === "authenticated" ? (
              <div className="flex flex-col">
                <div
                  className="border-t border-stroke-secondary p-4 cursor-default"
                  data-testid="user-name-id"
                  data-test={user?.id}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={imageUrl ?? "/defaults/default-profile.webp"}
                      name={user?.name}
                    />
                    <div className="flex flex-col text-xs">
                      <p className="font-bold text-center">{user?.name}</p>
                      <p className="text-center">{user?.email}</p>
                      <div className="text-primary-gray text-center">@{user?.name}</div>
                    </div>
                  </div>
                </div>
                <NavItem
                  href={`/${courseId}/account-settings/${user?.id}`}
                  text="Account Settings"
                  className="border-t border-stroke-secondary p-4"
                  onClick={toggleSidebar}
                  data-testid="account-setting-id"
                  data-test={user?.id}
                />
                <NavItem
                  href={`/${courseId}/my-tee-box`}
                  text="My Tee Box"
                  className="border-t border-stroke-secondary p-4"
                  onClick={toggleSidebar}
                  data-testid="my-tee-box-id"
                  data-test={courseId}
                />
                <NavItem
                  href={`/${courseId}/watchlist`}
                  text="Watchlist"
                  className="border-t border-stroke-secondary p-4"
                  onClick={toggleSidebar}
                  data-testid="watch-list-id"
                  data-test={courseId}
                />
                <NavItem
                  text="Log Out"
                  className="border-b border-t border-stroke-secondary p-4"
                  onClick={logOutUser}
                  data-testid="logout-id"
                />
              </div>
            ) : null}
            <div className="p-4 w-full flex justify-center">
              <PoweredBy />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
