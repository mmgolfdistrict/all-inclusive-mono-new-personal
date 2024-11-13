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

type SideBarProps = {
  isSideBarOpen: boolean;
  setIsSideBarOpen: Dispatch<SetStateAction<boolean>>;
};

export const SideBar = ({ isSideBarOpen, setIsSideBarOpen }: SideBarProps) => {
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

  const logOutUser = () => {
    try {
      logAudit(async () => {
        localStorage.clear();
        sessionStorage.clear();
        session.data = null;
        session.status = "unauthenticated";
        await session.update(null);
        if (PathsThatNeedRedirectOnLogout.some((i) => pathname.includes(i))) {
          const data = await signOut({
            callbackUrl: `/${courseId}/login`,
            //callbackUrl:pathname,
            redirect: false,
          });
          router.push(data.url);
          return;
        }
        const data = await signOut({
          callbackUrl: `/${courseId}/login`,
          redirect: false,
        });
        router.push(data.url);
      });
      localStorage.removeItem("googlestate");
    } catch (error) {
      console.log(error);
    } finally {
      localStorage.removeItem("googlestate");
    }
  };
  return (
    <>
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed left-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[320px] md:-translate-x-[105%]  ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"
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
                  <FilledButton>Log In</FilledButton>
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
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col">
              <NavItem
                href={`/${courseId}`}
                text="Find"
                icon={<Search className="w-[16px]" />}
                className="border-t border-stroke-secondary p-2 md:p-4"
                onClick={toggleSidebar}
                data-testid="tee-time-course-id"
                data-test={courseId}
              />
              {course?.supportsWaitlist ? (
                <NavItem
                  href={`/${courseId}/notify-me`}
                  text="Waitlist"
                  icon={<Megaphone className="w-[16px]" />}
                  className="border-t border-stroke-secondary p-2 md:p-4"
                  onClick={toggleSidebar}
                  data-testid="notify-me-id"
                  data-test={courseId}
                />
              ) : null}
              {course?.allowAuctions ? (
                <NavItem
                  href={`/${courseId}/auctions`}
                  text="Auctions"
                  icon={<Auction className="w-[16px]" />}
                  className="border-t border-stroke-secondary p-2 md:p-4"
                  onClick={toggleSidebar}
                  data-testid="auction-id"
                  data-test={courseId}
                />
              ) : null}
              <NavItem
                href={`/${courseId}/my-tee-box`}
                text="Sell"
                icon={<Marketplace className="w-[16px]" />}
                className="border-t border-stroke-secondary p-2 md:p-4"
                onClick={toggleSidebar}
                data-testid="my-tee-box-id"
                data-test={courseId}
              />
              <NavItem
                href={`/${courseId}/my-tee-box?section=my-listed-tee-times`}
                text="My Tee Times"
                icon={<Calendar className="w-[16px]" />}
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
                  onClick={() => {
                    toggleSidebar();
                  }}
                  icon={
                    <div className="relative">
                      <MyOffers className="w-[20px]" />
                      {unreadOffers && unreadOffers > 0 ? (
                        <div className="absolute -right-3.5 -top-2 flex h-5 w-5 min-w-fit select-none items-center justify-center rounded-full border-2 border-white bg-alert-red p-1 text-[10px] font-semibold text-white">
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
                <NavItem
                  href={`/${courseId}/profile/${user?.id}`}
                  text={
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={imageUrl ?? "/defaults/default-profile.webp"}
                        name={user?.name}
                      />
                      <div className="flex flex-col">
                        <p className="font-bold">{user?.name}</p>
                        <p>{user?.email}</p>
                        <div className="text-primary-gray">@{user?.name}</div>
                      </div>
                    </div>
                  }
                  className="border-t border-stroke-secondary p-4"
                  onClick={toggleSidebar}
                  data-testid="user-name-id"
                  data-test={user?.id}
                />
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
                  href="/"
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
