"use client";

import type {
  Course,
  CourseImagesType,
  FullCourseType,
} from "@golf-district/shared";
import { createContext, useContext, useMemo, type ReactNode } from "react";

interface CourseContextType {
  course: Course | undefined;
}

const CourseContext = createContext<CourseContextType>({
  course: undefined,
});

export const CourseWrapper = ({
  children,
  courseData,
  courseImages,
}: {
  children: ReactNode;
  courseData: FullCourseType | undefined;
  courseImages: CourseImagesType | undefined;
}) => {
  const course = useMemo(() => {
    if (!courseData || !courseImages) return undefined;
    return {
      ...courseData,
      ...courseImages,
    };
  }, [courseData, courseImages]);

  const settings = {
    course,
  };

  return (
    <CourseContext.Provider value={settings}>{children}</CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  return useContext(CourseContext);
};
