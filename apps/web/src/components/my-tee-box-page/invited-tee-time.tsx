import { useSession } from "@golf-district/auth/nextjs-exports";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import React from "react";
import { Avatar } from "../avatar";

const InvitedTeeTime = () => {
  const { course } = useCourseContext();
  const { data: session } = useSession();
  const { data, isLoading } = api.user.getInvitedUsers.useQuery({
    emailOrPhoneNumber: session?.user?.email ?? "",
  });

  return (
    <>
      {!isLoading && (
        <div className="relative flex max-w-full flex-col gap-4  overflow-auto pb-2  text-[14px] md:pb-3">
          <table className="w-full table-auto  overflow-auto">
            <thead className="top-0 table-header-group">
              <tr className="text-left">
                <TableHeader text="Course Name" />
                <TableHeader text="Tee Time Schedule" />
              </tr>
            </thead>
            <tbody className={`max-h-[300px] w-full flex-col overflow-scroll`}>
              <tr className="w-full border-b border-stroke text-primary-gray">
                <td className="flex items-center gap-2 px-4 py-3">
                  <Avatar src={course?.logo} />
                  <div className="whitespace-nowrap underline text-secondary-black">
                    {data?.courseName}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 unmask-players">
                  {formatTime(
                    data?.date ?? "",
                    false,
                    data?.timezoneCorrection ?? 0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

const TableHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
      {text}
    </th>
  );
};

export default InvitedTeeTime;
