import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Players } from "../icons/players";
import Flyout from "../modal/flyout";
import { Modal } from "../modal/modal";
import { useMediaQuery } from "usehooks-ts";
import { useAppContext } from "~/contexts/AppContext";

type SideBarProps = {
  isCancelListingOpen: boolean;
  setIsCancelListingOpen: Dispatch<SetStateAction<boolean>>;
  courseName: string | undefined;
  courseLogo: string | undefined;
  date: string | undefined;
  golferCount: number | undefined;
  pricePerGolfer: number | undefined;
  listingId: string | undefined;
  isGroupBooking: boolean | undefined;
  groupBookingId: string | undefined;
  refetch?: () => Promise<unknown>;
  needRedirect?: boolean;
  allowSplit: boolean | undefined;
};

type CancelListingDetailProp = {
  setIsCancelListingOpen: Dispatch<SetStateAction<boolean>>;
  courseName: string | undefined;
  courseLogo: string | undefined;
  date: string | undefined;
  golferCount: number | undefined;
  pricePerGolfer: number | undefined;
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
  isGroupBooking,
  groupBookingId,
  refetch,
  needRedirect,
  allowSplit = false
}: SideBarProps) => {
  useSidebar({
    isOpen: isCancelListingOpen,
    setIsOpen: setIsCancelListingOpen,
  });

  const cancel = api.teeBox.cancelListing.useMutation();
  const cancelGroupListing = api.teeBox.cancelGroupListing.useMutation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { entity } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { course } = useCourseContext();
  const courseId = course?.id;
  const { user } = useUserContext();
  const auditLog = api.webhooks.auditLog.useMutation();

  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: "",
      bookingId: "",
      listingId: listingId ?? "",
      courseId,
      eventId: "TEE_TIME_CANCELLED",
      json: `TEE_TIME_CANCELLED`,
    });
  };

  const cancelListing = async () => {
    if (!listingId) {
      toast.error("Listed already cancelled");
      return;
    }
    setIsLoading(true);
    try {
      if (isGroupBooking) {
        await cancelGroupListing.mutateAsync({
          groupId: groupBookingId ?? "",
          color1: entity?.color1,
        })
      } else {
        await cancel.mutateAsync({
          listingId: listingId,
          color1: entity?.color1,
        });
      }
      await refetch?.();
      toast.success("Listing cancelled successfully");
      setIsCancelListingOpen(false);
      void logAudit();
      if (needRedirect) {
        router.push(`/${course?.id}/my-tee-box`);
      }
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error cancelling listing");
    } finally {
      setIsLoading(false);
    }
  };

  const CancelListingDetail = ({
    setIsCancelListingOpen,
    courseName,
    courseLogo,
    date,
    golferCount,
    pricePerGolfer,
  }: CancelListingDetailProp) => {
    return (
      <>
        {isLoading && <LoadingContainer isLoading={isLoading}>
          <div></div>
        </LoadingContainer>}
        <div className="flex flex-col gap-6 px-0 sm:px-4">
          <div>
            <div className="px-4 pb-4 text-justify text-2xl font-[300] md:text-3xl">
              Are you sure you want to cancel this listing?
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
              List price per golfer
            </div>
            <div className="text-lg md:text-2xl">
              {formatMoney(pricePerGolfer ?? 0)}
            </div>
            <div className="h-px w-full bg-stroke" />
            <div className="font-[300] text-primary-gray">
              Number of spots listed
            </div>
            <div className="text-lg md:text-2xl">{golferCount}</div>
            <div className="h-px w-full bg-stroke" />
            <div className="font-[300] text-primary-gray">
              List type
            </div>
            <div className="text-lg md:text-2xl">{
              allowSplit ? "Splits" : "Whole"
            }</div>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-col gap-2">
            <FilledButton
              className="w-full"
              onClick={cancelListing}
              data-testid="cancel-listing-button-id"
            >
              Cancel Listing
            </FilledButton>

            <OutlineButton
              onClick={() => setIsCancelListingOpen(false)}
              data-testid="cancel-button-id"
            >
              Cancel
            </OutlineButton>
          </div>
        </div>
      </>
    );
  };

  return isMobile ? (
    <Modal
      isOpen={isCancelListingOpen}
      title="Cancel Listing"
      onClose={() => setIsCancelListingOpen(false)}
    >
      <CancelListingDetail
        setIsCancelListingOpen={setIsCancelListingOpen}
        courseName={courseName}
        courseLogo={courseLogo}
        date={date}
        golferCount={golferCount}
        pricePerGolfer={pricePerGolfer}
      />
    </Modal>
  ) : (
    <Flyout
      isOpen={isCancelListingOpen}
      title="Cancel Listing"
      setIsOpen={() => setIsCancelListingOpen(false)}
    >
      <CancelListingDetail
        setIsCancelListingOpen={setIsCancelListingOpen}
        courseName={courseName}
        courseLogo={courseLogo}
        date={date}
        golferCount={golferCount}
        pricePerGolfer={pricePerGolfer}
      />
    </Flyout>
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
          <div className="whitespace-normal text-secondary-black overlow-y-auto">
            {courseName}
          </div>
          <div className="text-primary-gray">
            {formatTime(teeTimeDate, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="w-[2.5rem] ">
          <Players className="ml-auto w-[1.875rem]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
