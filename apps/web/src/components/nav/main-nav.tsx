"use client";

import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMessage } from "~/utils/NotificationFormatter";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { Info } from "../icons/info";
import { BlurImage } from "../images/blur-image";
import { PoweredBy } from "../powered-by";
import { Tooltip } from "../tooltip";

export const MainNav = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { entity, setmainHeaderHeight } = useAppContext();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const entityId = entity?.id;

  const { data: systemNotifications, isLoading: loadingSystemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const {
    data: courseGlobalNotification,
    isLoading: loadingCourseGlobalNotification,
  } = api.systemNotification.getCourseGlobalNotification.useQuery({
    courseId: courseId ?? "",
  });

  const {
    data: entityGlobalNotification,
    isLoading: loadingEntityGlobalNotification,
  } = api.systemNotification.getEntityGlobalNotification.useQuery({
    entityId: entityId ?? "",
  });

  const divHeight =
    !loadingCourseGlobalNotification ||
      !loadingSystemNotifications ||
      !loadingEntityGlobalNotification
      ? document?.getElementById("main-header")?.offsetHeight || 0
      : 0;
  setmainHeaderHeight(divHeight);

  console.log("isMobile", isMobile);
  return (
    <div>
      <div
        className={`fixed z-10 w-full bg-white transition-all top-0`}
        id="main-header"
      >
        {systemNotifications?.map((elm) => (
          <div
            key={elm.id}
            style={{
              backgroundColor: elm.bgColor,
              color: elm.color,
            }}
            className="text-white w-full p-1 text-center flex items-center justify-center"
          >
            {formatMessage(elm.shortMessage)}
            {elm.longMessage && (
              <Tooltip
                trigger={
                  <Info longMessage className="ml-2 h-5 w-5" />
                }
                content={<div>{formatMessage(elm.longMessage)}</div>}
              />
            )}
          </div>
        ))}
        {entityGlobalNotification?.map((elm) => (
          <div
            key={elm.id}
            style={{
              backgroundColor: elm.bgColor,
              color: elm.color,
            }}
            className="text-white w-full p-1 text-center flex items-center justify-center"
          >
            {formatMessage(elm.shortMessage)}
            {elm.longMessage && (
              <Tooltip
                trigger={
                  <Info longMessage className="ml-2 h-5 w-5" />
                }
                content={<div>{formatMessage(elm.longMessage)}</div>}
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
            {formatMessage(elm.shortMessage)}
            {elm.longMessage && (
              <Tooltip
                trigger={
                  <Info longMessage className="ml-2 h-5 w-5" />
                }
                content={<div>{formatMessage(elm.longMessage)}</div>}
              />
            )}
          </div>
        ))}

        <div className="relative z-10 min-h-[4.6875rem] md:min-h-[5.9375rem] flex w-full items-center justify-end border-b border-stroke-secondary bg-white p-4 md:p-6">
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform`}
          >
            <Link href="/" data-testid="resort-logo-id">
              {isMobile ? (
                <BlurImage
                  src={entity?.logo ?? ""}
                  alt={entity?.name ?? "resort logo"}
                  width={60}
                  height={100}
                  className="w-[4.6875rem] object-fit"
                />
              ) : (
                <BlurImage
                  src={entity?.logo ?? ""}
                  alt={entity?.name ?? "resort logo"}
                  width={90}
                  height={150}
                  className="w-[4.6875rem] object-fit"
                />
              )}
            </Link>
          </div>
          <div className="flex items-center align-end gap-6 md:gap-4">
            <div>
              <PoweredBy id="powered-by-sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
