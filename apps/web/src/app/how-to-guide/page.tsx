"use client";
import { GoBack } from "~/components/buttons/go-back";
import { api } from "~/utils/api";

export default function HowToGuide({
  params,
}: {
  params: { course: string };
}) {

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
    notificationsCount > 0 ? `${notificationsCount * 45}px` : "0";

  return (
    <main className="bg-secondary-white py-4 md:py-6 mt-20">
      <div style={{ marginTop }} className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[1360px] md:gap-4 md:px-6">
        <h1 className="pb-4 text-center text-2xl text-secondary-black md:pb-0 md:text-3xl">
          How to Guide
        </h1>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <iframe
            src="https://scribehow.com/page/Golf_District__How_to_Guide__Kg_zsvNST2C3xhJXdbeyog"
            title="Golf District How to Guide"
            className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]"
            style={{ height: "100vh" }}
          ></iframe>
        </section>
      </section>
    </main>
  );
}
