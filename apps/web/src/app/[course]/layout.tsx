import { CourseNav } from "~/components/nav/course-nav";
import { type ReactNode } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { getCourseById, getCourseImages } from "@golf-district/api";
import { CourseLayout } from "~/components/course-layout";
import { CourseWrapper } from "~/contexts/CourseContext";
import { FiltersWrapper } from "~/contexts/FiltersContext";
import { notFound } from "next/navigation";

export default async function CoursePageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: {
    course: string;
  };
}) {
  const courseId = params.course;

  const courseData = await getCourseById(courseId);

  const courseImages = await getCourseImages(courseId);

  if (!courseData) {
    notFound();
  }

  return (
    <CourseWrapper courseData={courseData} courseImages={courseImages}>
      <FiltersWrapper>
        <div className="flex w-full flex-col">
          <CourseNav />
          <CourseLayout>{children}</CourseLayout>
        </div>
      </FiltersWrapper>
    </CourseWrapper>
  );
}
