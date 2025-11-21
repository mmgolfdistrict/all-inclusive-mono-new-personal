import { useSession } from "@golf-district/auth/nextjs-exports";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import React from "react";
import { Avatar } from "../../avatar";

const MobileInvitedTeeTime = () => {
  const { course } = useCourseContext();
  const { data: session } = useSession();
  const { data, isLoading, isError, error } = api.user.getInvitedUsers.useQuery(
    {
      emailOrPhoneNumber: session?.user?.email ?? "",
    }
  );

  if (isError && error) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        {error?.message ?? "An error occurred fetching invited tee times"}
      </div>
    );
  }

  if ((!data || data.length === 0) && !isLoading && !isError && !error) {
    return (
      <div className="text-center h-[12.5rem] flex items-center justify-center">
        Invited tee times not available
      </div>
    );
  }

  return (
    <div className="relative flex max-w-full flex-col overflow-auto text-sm m-2 px-1">
      {!isLoading && data?.map((item, index) => {
        return (
          <div
            className="card w-full border border-gray-300 rounded-lg shadow-md my-2 py-2"
            key={index}
          >
            <div className="card-body">
              <table className="w-full text-sm text-left text-gray-500">
                <tbody className="text-xs text-gray-700 bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th scope="col" className="px-2 py-1">Course</th>
                    <td>
                      <div className="flex items-center">
                        <Avatar src={course?.logo} />
                        <div className="flex flex-col">
                          <div className="whitespace-normal overflow-y-auto text-secondary-black">
                            {item?.courseName}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1">Tee Time</th>
                    <td className="whitespace-nowrap text-secondary-black">
                      {formatTime(
                        item?.date ?? "",
                        false,
                        item?.timezoneCorrection ?? 0
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        );
      })}
    </div>
  );
};

export default MobileInvitedTeeTime;
