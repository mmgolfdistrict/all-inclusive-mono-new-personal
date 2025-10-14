import { CourseNav } from "~/components/nav/course-nav";
import React, { type ReactNode } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {
  getCourseById,
  getCourseImages,
  getCourseSEOInfo,
} from "@golf-district/api";
import type { FullCourseType } from "@golf-district/shared";
import { CourseLayout } from "~/components/course-layout";
import { BookingSourceWrapper } from "~/contexts/BookingSourceContext";
import { CourseWrapper } from "~/contexts/CourseContext";
import { FiltersWrapper } from "~/contexts/FiltersContext";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: {
    course: string;
  };
}) {
  const courseId = params.course;

  const courseSEOInfo = await getCourseSEOInfo(courseId);
  const seoData = JSON.parse(courseSEOInfo?.seoJSON || "{}");

  return {
    ...seoData,
  } as Metadata;
}

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

  const courseData = (await getCourseById(courseId)) as FullCourseType;
  const courseImages = await getCourseImages(courseId);

  // const nicInfos = getNICDetails();

  return (
    <>
      {!courseData?.id ? (
        <div className="flex items-center flex-col justify-center mt-20">
          <h2>No Course Found</h2>
          <p>Could not find a course with ID: {courseId}</p>
          <Link href="/" className="underline" data-testid="return-home-id">
            Return Home
          </Link>
        </div>
      ) : (
        <CourseWrapper courseData={courseData} courseImages={courseImages}>
          <FiltersWrapper>
            <BookingSourceWrapper>
              <div className="flex w-full flex-col">
                <CourseNav />
                <CourseLayout>{children}</CourseLayout>
              </div>
            </BookingSourceWrapper>
          </FiltersWrapper>
        </CourseWrapper>
      )}
    </>
  );
}
