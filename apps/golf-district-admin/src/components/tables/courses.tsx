import { useState } from "react";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";
import { CourseForm } from "../forms/course-form";
import { TableHeader } from "./table-header";

export const Courses = () => {
  const [isEditCourseOpen, setIsEditCourseOpen] = useState<boolean>(false);

  const openEditCourse = () => {
    setIsEditCourseOpen(true);
  };

  const closeEditCourse = () => {
    setIsEditCourseOpen(false);
  };

  return (
    <>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <TableHeader className="pr-2" text="Name" />
            <TableHeader className="pr-2" text="Address" />
            <TableHeader className="pr-2" text="Status" />
            <TableHeader text="" />
          </tr>
        </thead>
        <tbody>
          <TableRow
            courseImage="/defaults/course-icon.png"
            courseName="Encinitas Ranch"
            entityName="JC Resorts"
            courseAddress="1275 Quail Gardens Dr, Encinitas, CA 92024"
            status="Active"
            openEditCourse={openEditCourse}
          />
        </tbody>
      </table>
      {isEditCourseOpen && (
        <CourseForm isEdit={true} onClose={closeEditCourse} />
      )}
    </>
  );
};

const TableRow = ({
  courseImage,
  courseName,
  entityName,
  courseAddress,
  status,
  openEditCourse,
}: {
  courseImage: string;
  courseName: string;
  courseAddress: string;
  entityName: string;
  status: string;
  openEditCourse: () => void;
}) => {
  return (
    <tr className="border-b border-stroke text-[12px] h-[60px] whitespace-nowrap">
      <td className="pr-8">
        <div className="flex items-center gap-2">
          <Avatar src={courseImage} />
          <div>
            <p className="text-primary-gray">{entityName}</p>
            <p className="text-secondary-black">{courseName}</p>
          </div>
        </div>
      </td>
      <td className="pr-2 w-full">{courseAddress}</td>
      <td className="pr-2">{status}</td>
      <td className="min-w-[150px]">
        <div className="flex w-full justify-end gap-2">
          <OutlineButton
            className="py-[.05rem] px-[.5rem]"
            onClick={openEditCourse}
          >
            Edit
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
};
