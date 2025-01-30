"use client";

import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";

export const Title = () => {
  const { entity } = useAppContext();
  const { course } = useCourseContext();
  const courseId = course?.id;

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
    notificationsCount > 0 ? `${notificationsCount * 27}px` : "0";
  return (
    <>
      {!entity?.name ? (
        <div className="animate-pulse h-12 w-[50%] md:w-[35%] bg-gray-200 mx-auto md:mx-0 rounded-md mb-4 md:mb-6" />
      ) : (
        <h1
          className={`pb-4 text-center text-[24px] md:pb-6 md:text-left md:text-[32px]`}
          style={{ marginTop }}
        >
          Welcome to {entity?.name}
        </h1>
      )}
    </>
  );
};
