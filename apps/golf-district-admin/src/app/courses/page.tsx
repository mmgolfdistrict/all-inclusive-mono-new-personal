"use client";

import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { CourseForm } from "~/components/forms/course-form";
import { Plus } from "~/components/icons/plus";
import { Courses } from "~/components/tables/courses";
import { useState } from "react";

export default function AdminCourses() {
  const [isNewCourseOpen, setIsNewCourseOpen] = useState<boolean>(false);

  const openNewCourse = () => {
    setIsNewCourseOpen(true);
  };

  const onCloseNewCourse = () => {
    setIsNewCourseOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Courses</h1>
        <div className="flex items-center gap-2">
          <NoOutlineButton>Edit Columns</NoOutlineButton>
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewCourse}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <Courses />
      </section>
      {isNewCourseOpen && (
        <CourseForm isEdit={false} onClose={onCloseNewCourse} />
      )}
    </main>
  );
}
