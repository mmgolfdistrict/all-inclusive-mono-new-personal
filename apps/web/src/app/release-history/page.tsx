"use client";

import { AccordionRoot } from "~/components/accordion/accordion";
import { AccordionItem } from "~/components/accordion/accordion-item";
import { GoBack } from "~/components/buttons/go-back";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function ReleaseHistory({
  params,
}: {
  params: { course: string };
}) {
  const { data } = api.releaseHistory.getReleaseHistory.useQuery({});

  const courseId = params.course;

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: courseId ?? "",
    });

  const notificationsCount =
    (systemNotifications ? systemNotifications.length : 0) +
    (courseGlobalNotification ? courseGlobalNotification.length : 0);

  const marginTop =
    notificationsCount > 0 ? `${(notificationsCount * 1.875) + 6.25}rem` : "0";

  const groupedData = data?.reduce((acc, item) => {
    const date = dayjs(item.releaseDateTime).format("DD-MMM-YYYY");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div
        style={{ marginTop }}
        className={`mx-auto flex items-center justify-between px-4 md:max-w-[85rem] md:px-6 `}
      >
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[85rem] md:gap-4 md:px-6">
        <h1 className="pb-4 text-left text-2xl text-center text-secondary-black md:pb-0 md:text-3xl">
          Release History
        </h1>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[73.375rem]">
          {groupedData &&
            Object.keys(groupedData).map((date, index) => (
              <AccordionRoot key={index} defaultValue={`item-${index}`}>
                <AccordionItem title={date} value={`item-${index}`}>
                  <div className="mt-4">
                    <table className="min-w-full table-auto">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2">Feature</th>
                          <th className="border px-4 py-2">Description</th>
                          <th className="border px-4 py-2">Engineer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedData[date].map((item, idx) => (
                          <tr key={idx}>
                            <td className="border px-4 py-2">{item.name}</td>
                            <td className="border px-4 py-2">
                              {item.description}
                            </td>
                            <td className="border px-4 py-2">
                              {item.engineerName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionItem>
              </AccordionRoot>
            ))}
        </section>
      </section>
    </main>
  );
}
