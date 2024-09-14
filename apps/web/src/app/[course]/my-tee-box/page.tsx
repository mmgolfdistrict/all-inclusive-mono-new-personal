import { GoBack } from "~/components/buttons/go-back";
import { DownChevron } from "~/components/icons/down-chevron";
import { TableView } from "~/components/my-tee-box-page/table-view";
import { OpenSection } from "~/utils/tee-box-helper";

type OpenSectionDescriptionType = Record<string, string>;

const OpenSectionDescription: OpenSectionDescriptionType = {
  owned: "View, sell, and manage tee times you own.",
  "my-listed-tee-times": "Manage your tee time listings below.",
  "offers-sent": "View and manage sent offers below.",
  "offers-received": "View and manage received offers below.",
  "transaction-history": "View all tee times sold and purchased below.",
};

export default function MyTeeBox({
  searchParams,
  params,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  params: { course: string };
}) {
  const section = (
    OpenSection.includes(searchParams?.section as string)
      ? searchParams.section
      : "owned"
  ) as string;
  const courseId = params.course;

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href={`/${courseId}`} text={`Back to tee times`} />
      </div>
      <section className="mx-auto flex w-full flex-col gap-4 pt-4 md:max-w-[1360px] md:px-6">
        <div className="flex flex-col gap-4 px-4 md:px-0">
          <div>
            <h1 className="flex items-center gap-2 text-[20px] capitalize text-secondary-black md:text-[32px]">
              My Tee Box{" "}
              <DownChevron className="w-[12px] -rotate-90" fill={"353B3F"} />
              {section.replaceAll("-", " ")}
            </h1>
            <p className=" text-[14px] text-primary-gray md:text-[20px]">
              {OpenSectionDescription[section]}
            </p>
            <p className="mt-4 mb-2 text-[14px] text-primary-gray md:text-[16px] font-semibold text-left">
      Tip: If you know you can’t make your time, the earlier you can list, the greater the chance it sells.
    </p>    
          </div>
        </div>

        <TableView />
      </section>
    </main>
  );
}
