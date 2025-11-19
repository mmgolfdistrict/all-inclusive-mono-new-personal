"use client";

import { GoBack } from "~/components/buttons/go-back";
import { api } from "~/utils/api";
import { LoadingContainer } from "../[course]/loader";

export default function PrivacyPolicy({
  params,
}: {
  params: { course: string };
}) {
  const { data: privacyPolicies, isLoading } =
    api.user.getS3HtmlContent.useQuery({ keyName: "privacypolicy.html" });

  const courseId = params.course;

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: courseId ?? "",
    });

  const notificationsCount =
    (systemNotifications ? systemNotifications.length : 0) +
    (courseGlobalNotification ? courseGlobalNotification.length : 0);

  const marginTop =
    notificationsCount > 0 ? `${(notificationsCount * 1.875) + 7.8125}rem` : "7.8125rem";

  return (
    <>
      <LoadingContainer data-testid="loading-container" isLoading={isLoading} loadingText="Loading...">
      </LoadingContainer>
      <div style={{ marginTop }} className="mx-auto flex items-center justify-between px-4 md:max-w-[100rem] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      {privacyPolicies && (
        <main className="bg-secondary-white py-4 md:py-6 ">
          <section className="mx-auto flex w-full flex-col pt-4 px-4 md:max-w-[100rem] md:gap-4 md:px-6">
            <div dangerouslySetInnerHTML={{ __html: privacyPolicies }}></div>
          </section>
        </main>
      )}
    </>
  );
}
