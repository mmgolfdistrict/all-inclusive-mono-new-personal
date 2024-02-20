import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Players } from "../icons/players";

type SideBarProps = {
  isCancelListingOpen: boolean;
  setIsCancelListingOpen: Dispatch<SetStateAction<boolean>>;
  courseName: string | undefined;
  courseLogo: string | undefined;
  date: string | undefined;
  golferCount: number | undefined;
  pricePerGolfer: number | undefined;
  listingId: string | undefined;
  refetch?: () => Promise<unknown>;
  needRedirect?: boolean;
};

export const CancelListing = ({
  isCancelListingOpen,
  setIsCancelListingOpen,
  courseName,
  courseLogo,
  date,
  golferCount,
  pricePerGolfer,
  listingId,
  refetch,
  needRedirect,
}: SideBarProps) => {
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isCancelListingOpen,
    setIsOpen: setIsCancelListingOpen,
  });

  const cancel = api.teeBox.cancelListing.useMutation();

  const router = useRouter();

  const { course } = useCourseContext();

  const cancelListing = async () => {
    if (!listingId) {
      toast.error("Listed already cancelled");
      return;
    }
    try {
      await cancel.mutateAsync({
        listingId: listingId,
      });
      await refetch?.();
      toast.success("Listing cancelled successfully");
      setIsCancelListingOpen(false);
      if (needRedirect) {
        router.push(`/${course?.id}/my-tee-box`);
      }
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error cancelling listing");
    }
  };

  return (
    <>
      {isCancelListingOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCancelListingOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Cancel Listing</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCancelListingOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6 px-0 sm:px-4">
              <div>
                <div className="px-4 pb-4 text-center text-2xl font-[300] md:text-3xl">
                  Are you sure you would like to cancel this listing?
                </div>
                <TeeTimeItem
                  courseName={courseName ?? ""}
                  courseImage={courseLogo ?? ""}
                  teeTimeDate={date ?? ""}
                  golferCount={golferCount ?? 0}
                  timezoneCorrection={course?.timezoneCorrection}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">
                  Offer price per golfer
                </div>
                <div className="text-lg md:text-2xl">
                  {formatMoney(pricePerGolfer ?? 0)}
                </div>
                <div className="h-[1px] w-full bg-stroke" />
                <div className="font-[300] text-primary-gray">
                  Number of spots listed
                </div>
                <div className="text-lg md:text-2xl">{golferCount}</div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton className="w-full" onClick={cancelListing}>
                  Cancel Listing
                </FilledButton>

                <OutlineButton onClick={() => setIsCancelListingOpen(false)}>
                  Cancel
                </OutlineButton>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const TeeTimeItem = ({
  courseName,
  courseImage,
  teeTimeDate,
  golferCount,
  timezoneCorrection,
}: {
  courseName: string;
  courseImage: string;
  teeTimeDate: string;
  golferCount: number;
  timezoneCorrection: number | undefined;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={courseImage} />
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-secondary-black">
            {courseName}
          </div>
          <div className="text-primary-gray">
            {formatTime(teeTimeDate, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
