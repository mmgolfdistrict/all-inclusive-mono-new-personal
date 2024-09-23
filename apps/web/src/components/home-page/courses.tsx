"use client";

import { LoadingContainer } from "~/app/[course]/loader";
import { useAppContext } from "~/contexts/AppContext";
import { api } from "~/utils/api";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Course } from "../cards/course";

export const Courses = () => {
  const { entity } = useAppContext();
  const entityId = entity?.id;
  const router = useRouter();

  const { data, isLoading, isError, error } =
    api.entity.getCoursesByEntityId.useQuery(
      { entityId: entityId! },
      { enabled: entityId !== undefined }
    );


  if (entity?.redirectToCourseFlag && data?.length) {
    router.push(`/${data[0]?.id}`);
  }

  const gridClass = useMemo(() => {
    if (data?.length === 1) return "grid-cols-1";
    if (data?.length === 2) return "grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
  }, [data]);
  return (
    <>
      {entity?.redirectToCourseFlag ? (
        <LoadingContainer
          isLoading={true}
          loadingText="Please wait while we redirect to your course"
        >
          <div></div>
        </LoadingContainer>
      ) : isLoading ? (
        <div className="mx-auto grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array(3)
            .fill(null)
            .map((_, idx) => (
              <SkeletonCourse key={idx} />
            ))}
        </div>
      ) : isError && error ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">Error: {error?.message}</div>
        </div>
      ) : !data || data?.length === 0 ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            No courses found{entity?.name ? ` for ${entity?.name}` : null}.
          </div>
        </div>
      ) : (
        <div className={`mx-auto grid justify-center gap-6 ${gridClass}`}>
          {data?.map((course, idx: number) => (
            <Course
              image={course?.images?.[0] ?? ""}
              courseName={course?.name}
              location={course?.address ?? ""}
              description={course.description ?? ""}
              courseId={course?.id ?? ""}
              key={idx}
            />
          ))}
        </div>
      )}
    </>
  );
};

const SkeletonCourse = () => (
  <div className="flex w-full flex-col items-center gap-4 h-[400px]">
    <div className="animate-pulse max-h-[288px] flex flex-1 h-full w-full max-w-[440px] bg-gray-200 rounded-md" />
    <div className="flex flex-col gap-1 w-full">
      <div className="animate-pulse h-6 w-[60%] bg-gray-200 rounded-md " />
      <div className="animate-pulse h-6 w-full bg-gray-200 rounded-md " />
      <div className="flex flex-col gap-2 mt-2">
        <div className="animate-pulse h-4 w-full bg-gray-200 rounded-md " />
        <div className="animate-pulse h-4 w-full bg-gray-200 rounded-md " />
        <div className="animate-pulse h-4 w-full bg-gray-200 rounded-md " />
        <div className="animate-pulse h-4 w-[75%] bg-gray-200 rounded-md " />
      </div>
    </div>
  </div>
);
