"use client";

import { GoBack } from "~/components/buttons/go-back";
import { api } from "~/utils/api";
import { LoadingContainer } from "../[course]/loader";

export default function TermsOfService({
  params,
}: {
  params: { course: string };
}) {
  const { data: termsOfServices, isLoading } =
    api.user.getS3HtmlContent.useQuery({ keyName: "termsofservice.html" });

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
    notificationsCount > 0 ? `${(notificationsCount * 30) + 125}px` : "125px";

  return (
    <>
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <div style={{ marginTop }} className="mx-auto flex items-center justify-between px-4 max-w-[1560px] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      {termsOfServices && (
        <main className="bg-secondary-white py-4 md:py-6 ">
          <section className="mx-auto flex w-full flex-col px-4 max-w-[1560px] md:gap-4 md:px-6">
            <div dangerouslySetInnerHTML={{ __html: termsOfServices }}></div>
          </section>
        </main>
      )}
    </>
  );
}
