import { signOut } from "@golf-district/auth/nextjs-exports";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "../avatar";
import { DownChevron } from "../icons/down-chevron";
import { useAppContext } from "~/contexts/AppContext";

export const PathsThatNeedRedirectOnLogout = [
  "/account-settings",
  "/profile",
  "/my-tee-box",
  "/watchlist",
  "/checkout",
];

export const UserInNav = ({ alwaysShow }: { alwaysShow?: boolean }) => {
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const { entity } = useAppContext();
  const courseId = course?.id;
  const pathname = usePathname();
  const router = useRouter();
  // const addUserSession = api.user.addUserSession.useMutation();
  const { data: imageUrl } = api.image.getAssetUrl.useQuery(
    { assetId: user?.image ?? "" },
    {
      enabled: !!user?.image,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

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

  const logOutUser = () => {
    logAudit(async () => {
      localStorage.clear();
      sessionStorage.clear();
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        console.log("All caches cleared.");
      } catch (error) {
        console.error("Error clearing caches:", error);
      }
      if (document.cookie) {
        document.cookie.split(";").forEach((cookie) => {
          const cookieName = cookie.split("=")[0]?.trim();
          if (cookieName) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          }
        });
      }
      if (PathsThatNeedRedirectOnLogout.some((i) => pathname.includes(i))) {
        const data = await signOut({
          callbackUrl: `/${courseId}`,
          redirect: false,
        });
        router.push(data.url);
        return;
      } else {
        await signOut();
      }
    });
    localStorage.removeItem("googlestate");
    localStorage.removeItem("linkedinstate");
  };

  return (
    <div className={`${alwaysShow ? "block" : "hidden md:block"}`}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="outline-none"
          data-testid="user-profile-id"
        >
          <div className="flex gap-1">
            <Avatar
              src={
                user?.image?.includes("https://")
                  ? user?.image
                  : imageUrl ?? "/defaults/default-profile.webp"
              }
              name={user?.name}
            />
            <DownChevron className="w-[12px]" fill={entity?.color1} />
          </div>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={5}
            className={`z-20 mr-5 min-w-[300px] overflow-y-auto rounded-xl border border-stroke bg-white shadow-md ${alwaysShow ? "block" : "hidden md:block"
              }`}
          >
            <div className="flex items-center flex-col px-4 py-3 border-b border-stroke">
              <p className="text-sm unmask-userdetails">{user?.email}</p>
              <div className="py-3">
                <Avatar
                  src={
                    user?.image?.includes("https://")
                      ? user?.image
                      : imageUrl ?? "/defaults/default-profile.webp"
                  }
                  name={user?.name}
                />
              </div>
              <p className="text-lg font-medium">Welcome, {user?.name}!</p>
            </div>
            {/* <Link href={`/${courseId}/profile/${user?.id}`}>
              <MenuItem title="Profile" />
            </Link> */}
            <Link href={`/${courseId}/account-settings/${user?.id}`}>
              <MenuItem title="Account Settings" />
            </Link>
            <Link href={`/${courseId}/my-tee-box`}>
              <MenuItem title="My Tee Box" />
            </Link>
            {course?.supportsWatchlist ? (
              <Link href={`/${courseId}/watchlist`}>
                <MenuItem title="Watchlist" />
              </Link>
            ) : null}

            <MenuItem title="Log Out" handleClick={() => void logOutUser()} />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

const MenuItem = ({
  title,
  handleClick,
}: {
  title: string;
  handleClick?: () => void;
}) => {
  return (
    <DropdownMenu.Item
      onClick={handleClick}
      className="flex cursor-pointer items-center justify-between px-4 py-2 outline-none hover:bg-secondary-white"
      data-testid="user-menu-item-id"
      data-qa={title}
    >
      <div>{title}</div>
    </DropdownMenu.Item>
  );
};
