import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney } from "~/utils/formatters";
import Link from "next/link";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";

type SideBarProps = {
  isPlaceBidOpen: boolean;
  setIsPlaceBidOpen: Dispatch<SetStateAction<boolean>>;
  bid: number;
  clearBid: () => void;
  refetch: () => Promise<unknown>;
};

export const PlaceBid = ({
  isPlaceBidOpen,
  setIsPlaceBidOpen,
  bid,
  clearBid,
  refetch,
}: SideBarProps) => {
  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isPlaceBidOpen,
    setIsOpen: setIsPlaceBidOpen,
  });
  const { user } = useUserContext();
  const { cards } = usePaymentMethods();
  const { course } = useCourseContext();
  const courseId = course?.id;
  const placeBidMethod = api.auction.placeBid.useMutation();

  const placeBid = async () => {
    if (!user) return;
    try {
      await placeBidMethod.mutateAsync({
        auctionId: "72673ea0-7e91-444c-a76a-824d518362e8",
        bid: bid,
        paymentMethodId: cards?.[0]?.id,
      });
      await refetch();
      toast.success(`Bid for ${bid} placed successfully!`);
      clearBid();
      setIsPlaceBidOpen(false);
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Error placing bid");
    }
  };

  const isPlaceBidDisabled = useMemo(() => {
    if (!cards || cards?.length === 0 || !user) {
      return true;
    }
    return false;
  }, [cards, user]);

  return (
    <>
      {isPlaceBidOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isPlaceBidOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Place bid</div>

            <button
              ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isPlaceBidOpen}
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
                  Please confirm your bid
                </div>
                <TeeTimeItem />
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5 text-center">
                <div className="font-[300] text-primary-gray">Bid price</div>
                <div className="text-xl font-[300] md:text-3xl">
                  {formatMoney(bid)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Bid</div>
                <div className="text-secondary-black">{formatMoney(bid)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Service fee description."
                  />
                </div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Taxes</div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total</div>
                <div className="text-secondary-black">{`${formatMoney(
                  bid + 90
                )}`}</div>
              </div>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                {isPlaceBidDisabled ? (
                  <Link
                    href={
                      user
                        ? `/${courseId}/account-settings/${user?.id}#payment-method`
                        : `/${courseId}/login`
                    }
                    onClick={() => setIsPlaceBidOpen(false)}
                  >
                    <FilledButton className={`w-full`}>
                      Add Payment Method
                    </FilledButton>
                  </Link>
                ) : null}
                <FilledButton
                  className={`w-full ${isPlaceBidDisabled ? "opacity-50" : ""}`}
                  disabled={isPlaceBidDisabled}
                  onClick={() => void placeBid()}
                >
                  Place Bid
                </FilledButton>
                <OutlineButton onClick={() => setIsPlaceBidOpen(false)}>
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

const TeeTimeItem = () => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={placeholderIcon.src} />
        <div className="flex flex-col">
          <div className="whitespace-nowrap text-secondary-black">
            {"Encinitas Ranch"}
          </div>
          <div className="text-primary-gray">{"Sun Aug 20, 2023 10:00 AM"}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Avatar />
        <div className="text-primary-gray">
          Offered by <span className="font-semibold">mmackinney</span>
        </div>
      </div>
    </div>
  );
};
