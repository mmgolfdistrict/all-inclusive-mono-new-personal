"use client";

// import { ConnectAccount } from "~/components/account-settings-page/connect-account";
import { useSession } from "@golf-district/auth/nextjs-exports";
import { AddCreditCard } from "~/components/account-settings-page/addCreditCard";
import { BalanceHistory } from "~/components/account-settings-page/balance-history";
import { EditProfileForm } from "~/components/account-settings-page/edit-profile-form";
import { NotificationSettings } from "~/components/account-settings-page/notification-settings";
import { PaymentInfoMangeProfile } from "~/components/account-settings-page/payment-info";
// import { SavedBankDetails } from "~/components/account-settings-page/savedBankDetails";
import { GoBack } from "~/components/buttons/go-back";
import { ProfileDetails } from "~/components/profile-page/profile-details";
import { useUser } from "~/hooks/useUser";
import { useRouter } from "next/navigation";
import { useAppContext } from "~/contexts/AppContext";

export default function ManangeProfile({
  params,
}: {
  params: { course: string; userId: string };
}) {
  const courseId = params.course;
  const userId = params.userId;
  const router = useRouter();
  const { status, data } = useSession();
  const { isLoading: isUserLoading, data: user } = useUser(userId);
  const { setActivePage } = useAppContext();
  setActivePage("account-settings")

  // const { data: systemNotifications } =
  //   api.systemNotification.getSystemNotification.useQuery({});

  // const { data: courseGlobalNotification } =
  //   api.systemNotification.getCourseGlobalNotification.useQuery({
  //     courseId: courseId ?? "",
  //   });

  // const notificationsCount =
  //   (systemNotifications ? systemNotifications.length : 0) +
  //   (courseGlobalNotification ? courseGlobalNotification.length : 0);

  // const marginTop =
  //   notificationsCount > 0 ? `mt-${notificationsCount * 6}` : "";

  if (
    status === "unauthenticated" ||
    (status !== "loading" && userId !== data?.user.id)
  ) {
    router.push(`/${courseId}`);
    return;
  }

  return (
    <main className={`bg-secondary-white py-4 md:py-6`}>
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[85rem] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[85rem] md:px-6">
        <ProfileDetails isThirdPartyProfile={false} />
        <div className="flex h-full flex-col gap-4 md:flex-row w-full">
          <div className="w-full md:w-[50%]  md:rounded-xl overflow-hidden">
            <BalanceHistory userId={userId} />
          </div>
          <div className="w-full md:w-[50%] h-inherit">
            {/* <PrivacySettings /> */}
            <NotificationSettings />
          </div>

          {/* <ConnectAccount userId={userId} /> */}
        </div>
        {/* <div className="flex h-full flex-col gap-4 md:flex-row">
          <PrivacySettings />
          <NotificationSettings />
        </div> */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-[50%]">
            <EditProfileForm />
          </div>
          <div className="flex flex-col gap-4 md:flex-col md:w-[50%]">
            <AddCreditCard />
            {!isUserLoading && user?.allowDeleteCreditCard ? (
              <PaymentInfoMangeProfile />
            ) : null}
            {/* <SavedBankDetails /> */}
          </div>
        </div>
      </section>
    </main>
  );
}
