"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useState } from "react";
import { Check } from "../icons/check";
import { LeftChevron } from "../icons/left-chevron";
import { Leaflet } from "../modal/leaflet";

export const CourseTitle = ({
  courseName,
  description,
  className,
}: {
  courseName: string;
  description: string;
  className?: string;
}) => {
  const [show, setShow] = useState<boolean>(false);
  const { courses } = useAppContext();
  const { course: selectedCourse } = useCourseContext();
  const hasMoreThanOneCourse = courses && courses?.length > 1;

  const toggleLeaflet = () => {
    if (!hasMoreThanOneCourse) return;
    setShow(!show);
  };

  return (
    <>
      <div className={`flex flex-col ${className ?? ""}`}>
        <div className="hidden md:block">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="outline-none">
              <h1
                className={`flex ${
                  hasMoreThanOneCourse ? "cursor-pointer" : "cursor-default"
                } gap-2 text-[24px] text-secondary-black  md:text-[32px]`}
              >
                {courseName}
                {hasMoreThanOneCourse ? (
                  <LeftChevron
                    className="w-[14px] -rotate-90 md:w-[21px]"
                    data-testid="course-chevron-id"
                  />
                ) : null}
              </h1>
            </DropdownMenu.Trigger>
            {hasMoreThanOneCourse ? (
              <DropdownMenu.Portal>
                <DropdownMenu.Content className=" ml-6 hidden max-h-[300px] min-w-[375px] overflow-y-auto rounded-xl border border-stroke bg-white shadow-md md:block">
                  {courses?.map((course, idx) => (
                    <MenuItem
                      key={idx}
                      title={course.name}
                      isActive={course.id === selectedCourse?.id}
                    />
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            ) : null}
          </DropdownMenu.Root>
        </div>
        <button className="md:hidden" onClick={toggleLeaflet}>
          <h1
            className={`flex ${
              hasMoreThanOneCourse ? "cursor-pointer" : "cursor-default"
            } gap-2 text-[24px] text-secondary-black  md:text-[32px]`}
          >
            {courseName}
            {hasMoreThanOneCourse ? (
              <LeftChevron className="w-[14px] -rotate-90 md:w-[21px]" />
            ) : null}
          </h1>
        </button>
        <p className=" text-[14px] text-primary-gray md:text-[20px]">
          {description}
        </p>
      </div>
      {show && (
        <Leaflet setShow={setShow}>
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <MenuItemLeaflet
                key={i}
                title="Course Name"
                isActive={i === 0}
                onClick={toggleLeaflet}
              />
            ))}
        </Leaflet>
      )}
    </>
  );
};

const MenuItemLeaflet = ({
  title,
  isActive,
  onClick,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-between px-4 py-2 outline-none hover:bg-secondary-white"
      onClick={onClick}
    >
      <div>{title}</div>
      {isActive && <Check className="w-[14px]" />}
    </div>
  );
};

const MenuItem = ({
  title,
  isActive,
}: {
  title: string;
  isActive: boolean;
}) => {
  return (
    <DropdownMenu.Item
      data-testid="menu-item-id"
      data-qa={title}
      className="flex cursor-pointer items-center justify-between px-4 py-2 outline-none hover:bg-secondary-white"
    >
      <div>{title}</div>
      {isActive && <Check className="w-[14px]" />}
    </DropdownMenu.Item>
  );
};
