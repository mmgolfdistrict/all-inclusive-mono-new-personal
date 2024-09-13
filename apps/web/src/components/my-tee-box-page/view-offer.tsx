import { useCourseContext } from "~/contexts/CourseContext";
import { useExpiration } from "~/hooks/useExpiration";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import { type OfferType } from "./offers-received";

type SideBarProps = {
  isViewOfferOpen: boolean;
  setIsViewOfferOpen: Dispatch<SetStateAction<boolean>>;
  selectedOffer: OfferType | undefined;
  openCounteroffer: () => void;
  refetch: () => Promise<unknown>;
};

export const ViewOffer = ({
  isViewOfferOpen,
  setIsViewOfferOpen,
  selectedOffer,
  openCounteroffer,
  refetch,
}: SideBarProps) => {
  const { toggleSidebar } = useSidebar({
    isOpen: isViewOfferOpen,
    setIsOpen: setIsViewOfferOpen,
  });
  const { timeTillEnd, count } = useExpiration({
    expirationDate: Math.floor(
      new Date(selectedOffer?.offer?.expiresAt ?? "").getTime() / 1000
    ).toString(),
    intervalMs: 60000,
  });

  const accept = api.teeBox.acceptOffer.useMutation();
  const reject = api.teeBox.rejectOffer.useMutation();
  const { course } = useCourseContext();

  const acceptOffer = async () => {
    const offerId = selectedOffer?.offer.offerId ?? "";
    if (!offerId) {
      toast.error("Invalid offerId");
      return;
    }
    if (accept.isLoading) {
      return;
    }

    try {
      const res = await accept.mutateAsync({
        offerId: offerId,
      });
      if (res.success) {
        await refetch();
        toast.success("Offer accepted successfully");
        setIsViewOfferOpen(false);
      } else {
        toast.error(res?.message ?? "Error accepting offer");
      }
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error accepting offer");
    }
  };

  const rejectOffer = async () => {
    const offerId = selectedOffer?.offer.offerId ?? "";
    if (!offerId) {
      toast.error("Invalid offerId");
      return;
    }
    if (reject.isLoading) {
      return;
    }

    try {
      const res = await reject.mutateAsync({
        offerId: offerId,
      });
      if (res.success) {
        await refetch();
        toast.success("Offer declined successfully");
        setIsViewOfferOpen(false);
      } else {
        toast.error(res?.message ?? "Error declining offer");
      }
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error declining offer");
    }
  };

  const teeTimePrice = useMemo(() => {
    if (!selectedOffer) return 0;

    return (
      selectedOffer?.offer.amountOffered * (selectedOffer?.offer?.golfers ?? 0)
    );
  }, [selectedOffer]);

  const difference = useMemo(() => {
    if (!selectedOffer) return 0;

    return (
      (selectedOffer?.offer.amountOffered ?? 0) -
      (selectedOffer?.offer?.originalPrice ?? 0)
    );
  }, [selectedOffer]);

  return (
    <>
      {isViewOfferOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isViewOfferOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">View Offer</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isViewOfferOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-6 px-0 sm:px-4">
              <div>
                <div className="px-4 pb-4 text-center text-2xl font-[300] text-secondary-black md:text-3xl">
                  You&apos;ve received an offer!
                </div>
                <div className="flex flex-col px-4 pb-4 text-center text-[18px] font-[300] text-secondary-black md:text-[20px]">
                  <div>Offer expires in</div>
                  {count <= 0 ? (
                    <div className="text-primary-gray">Expired</div>
                  ) : (
                    <div className="flex justify-center gap-1">
                      <div>{timeTillEnd.days} days</div>
                      <div>{timeTillEnd.hours} hrs</div>
                      <div>{timeTillEnd.minutes} mins</div>
                    </div>
                  )}
                </div>
                <TeeTimeItem
                  courseImage={selectedOffer?.offer.details.courseImage ?? ""}
                  courseName={selectedOffer?.offer.details.courseName ?? ""}
                  offeredByName={
                    selectedOffer?.offer.offeredBy.name ??
                    selectedOffer?.offer.offeredBy.handle ??
                    ""
                  }
                  offeredByImage={selectedOffer?.offer.offeredBy.image ?? ""}
                  offeredById={selectedOffer?.offer.offeredBy.userId ?? ""}
                  courseId={selectedOffer?.offer?.courseId ?? ""}
                  date={selectedOffer?.offer.details.teeTimeDate ?? ""}
                  timezoneCorrection={course?.timezoneCorrection}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">
                  Offer price per golfer
                </div>
                <div className="text-lg md:text-2xl">
                  {formatMoney(selectedOffer?.offer.amountOffered ?? 0)}
                </div>
                <div className="font-[300] text-primary-gray text-[14px]">
                  Original price{" "}
                  {formatMoney(selectedOffer?.offer.originalPrice ?? 0)} (
                  {difference > 0 ? "+" : ""}
                  {formatMoney(difference)})
                </div>
                <div className="h-[1px] w-full bg-stroke" />
                <div className="font-[300] text-primary-gray">
                  Number of spots desired
                </div>
                <div className="text-lg md:text-2xl">
                  {selectedOffer?.offer.golfers}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Your Listing Price
                </div>
                <div className="text-secondary-black">
                  {formatMoney(teeTimePrice)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking tee times"
                  />
                </div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  You Receive after Sale
                </div>
                <div className="text-secondary-black">
                  {formatMoney(Math.abs(teeTimePrice - 45))}
                </div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className={`w-full ${
                    accept.isLoading ? "animate-pulse" : ""
                  }`}
                  disabled={accept.isLoading}
                  onClick={acceptOffer}
                  data-testid="accept-button-id"
                >
                  {accept.isLoading ? "Accepting" : "Accept"}
                </FilledButton>

                <OutlineButton
                  onClick={openCounteroffer}
                  data-testid="counter-offer-button-id"
                >
                  Counteroffer
                </OutlineButton>
                <OutlineButton
                  onClick={rejectOffer}
                  className={`${reject.isLoading ? "animate-pulse" : ""}`}
                  data-testid="decline-button-id"
                >
                  {reject.isLoading ? "Declining" : "Decline"}
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
  date,
  offeredByName,
  offeredByImage,
  offeredById,
  courseId,
  timezoneCorrection,
}: {
  courseImage: string;
  courseName: string;
  offeredByName: string;
  offeredByImage: string;
  offeredById: string;
  courseId: string;
  date: string;
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
            {formatTime(date, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <Link
        href={`/${courseId}/profile/${offeredById}`}
        target="_blank"
        rel="noopenner noreferrer"
        className="flex items-center gap-4"
        data-testid="course-offer-id"
        data-test={offeredById}
        data-qa={courseId}
      >
        <Avatar src={offeredByImage} />
        <div className="text-primary-gray">
          Offered by{" "}
          <span className="font-semibold underline">{offeredByName}</span>
        </div>
      </Link>
    </div>
  );
};
