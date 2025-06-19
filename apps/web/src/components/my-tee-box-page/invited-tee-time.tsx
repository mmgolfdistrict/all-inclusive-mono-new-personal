import { useSession } from "@golf-district/auth/nextjs-exports";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import React from "react";
import { Avatar } from "../avatar";

const InvitedTeeTime = () => {
  const { course } = useCourseContext();
  const { data: session } = useSession();
  const { data, isLoading, isError, error } = api.user.getInvitedUsers.useQuery(
    {
      emailOrPhoneNumber: session?.user?.email ?? "",
    }
  );

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching invited tee times"}
      </div>
    );
  }

  if ((!data || data.length === 0) && !isLoading && !isError && !error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center">
        Invited tee times not available
      </div>
    );
  }

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
              {data?.map((item, index) => {
                return (
                  <tr
                    key={index}
                    className="w-full border-b border-stroke text-primary-gray"
                  >
                    <td className="flex items-center gap-2 px-4 py-3">
                      <Avatar src={course?.logo} />
                      <div className="whitespace-nowrap text-secondary-black">
                        {item?.courseName}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 unmask-players">
                      {formatTime(
                        item?.date ?? "",
                        false,
                        item?.timezoneCorrection ?? 0
                      )}
                    </td>
                  </tr>
                );
              })}
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
