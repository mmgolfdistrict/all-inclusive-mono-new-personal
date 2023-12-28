import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney } from "~/utils/formatters";
import Link from "next/link";
import { type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Players } from "../icons/players";
import { type OfferSentType } from "./offers-sent";

type SideBarProps = {
  isCancelOfferOpen: boolean;
  setIsCancelOfferOpen: Dispatch<SetStateAction<boolean>>;
  selectedOffer: OfferSentType | undefined;
  refetch: () => Promise<unknown>;
};

export const CancelOffer = ({
  isCancelOfferOpen,
  setIsCancelOfferOpen,
  selectedOffer,
  refetch,
}: SideBarProps) => {
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isCancelOfferOpen,
    setIsOpen: setIsCancelOfferOpen,
  });
  const cancel = api.teeBox.cancelOffer.useMutation();
  const { course } = useCourseContext();

  const cancelOffer = async () => {
    const offerId = selectedOffer?.offer.offerId ?? "";
    if (!offerId) {
      toast.error("Invalid offerId");
      return;
    }
    if (cancel.isLoading) {
      return;
    }

    try {
      await cancel.mutateAsync({
        offerId: offerId,
      });

      await refetch();
      toast.success("Offer cancelled successfully");
      setIsCancelOfferOpen(false);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error cancelling offer");
      console.log(error);
    }
  };

  return (
    <>
      {isCancelOfferOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCancelOfferOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Cancel Offer</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCancelOfferOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6  px-0 sm:px-4">
              <div>
                <div className="px-4 pb-4 text-center text-2xl font-[300] md:text-3xl">
                  Are you sure you would like to cancel this offer?
                </div>
                <TeeTimeItem
                  courseImage={selectedOffer?.offer.details.courseImage ?? ""}
                  courseName={selectedOffer?.offer.details.courseName ?? ""}
                  ownedByImage={selectedOffer?.offer.offeredBy.image ?? ""}
                  ownedByName={
                    selectedOffer?.offer.offeredBy.name ??
                    selectedOffer?.offer.offeredBy.handle ??
                    ""
                  }
                  ownedById={selectedOffer?.offer.offeredBy.userId ?? ""}
                  golferCount={selectedOffer?.offer.golfers ?? 0}
                  courseId={course?.id ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">
                  Offer price per golfer
                </div>
                <div className="text-lg md:text-2xl">
                  {formatMoney(selectedOffer?.offer.offerAmount ?? 0)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className={`w-full ${
                    cancel.isLoading ? "animate-pulse" : ""
                  }`}
                  disabled={cancel.isLoading}
                  onClick={cancelOffer}
                >
                  {cancel.isLoading ? "Cancelling Offer" : "Cancel Offer"}
                </FilledButton>

                <OutlineButton onClick={() => setIsCancelOfferOpen(false)}>
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
  courseImage,
  courseName,
  ownedByImage,
  ownedByName,
  ownedById,
  golferCount,
  courseId,
}: {
  courseImage: string;
  courseName: string;
  ownedByImage: string;
  ownedByName: string;
  ownedById: string;
  golferCount: number;
  courseId: string;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={courseImage} />
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-secondary-black">
            {courseName}
          </div>
          <div className="text-primary-gray">{"Sun Aug 20, 2023 10:00 AM"}</div>
        </div>
      </div>
      <Link
        href={`/${courseId}/profile/${ownedById}`}
        target="_blank"
        rel={"noopenner noreferrer"}
        className="flex items-center gap-4"
      >
        <Avatar src={ownedByImage} />
        <div className="text-primary-gray">
          Owned by <span className="font-semibold">{ownedByName}</span>
        </div>
      </Link>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
    </div>
  );
};
