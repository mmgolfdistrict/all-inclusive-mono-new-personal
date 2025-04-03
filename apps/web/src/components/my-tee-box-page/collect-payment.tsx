import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { Close } from "../icons/close";
import { Players } from "../icons/players";
import { Input } from "../input/input";
import { SingleSlider } from "../input/single-slider";
import { Loader } from "../loading/spinner";
import { type OwnedTeeTime } from "./owned";

type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isCollectPaymentOpen: boolean;
  setIsCollectPaymentOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch?: () => Promise<unknown>;
  needsRedirect?: boolean;
};

export const CollectPayment = ({
  isCollectPaymentOpen,
  setIsCollectPaymentOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
}: SideBarProps) => {
  const paymentLinkResult =
    api.checkout.getHyperSwitchPaymentLink.useMutation();
  const { data: emailedUsers, refetch: refetchEmailedUsers } =
    api.checkout.checkEmailedUserPaidTheAmount.useQuery(
      {
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
      },
      { enabled: false }
    );
  const availableSlots = selectedTeeTime?.golfers.length || 0;
  const [emails, setEmails] = useState(
    Array.from({ length: Number(availableSlots - 1) }, () => "")
  );
  const [sendEmailedUsers, setEmailedUsers] = useState<
    { email: string; isPaid: number; isActive: number }[] | undefined
  >(undefined);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [players, setPlayers] = useState<string>(
    selectedTeeTime?.isGroupBooking
      ? "2"
      : selectedTeeTime?.selectedSlotsCount || availableSlots.toString()
  );
  const { toggleSidebar } = useSidebar({
    isOpen: isCollectPaymentOpen,
    setIsOpen: setIsCollectPaymentOpen,
  });
  const { course } = useCourseContext();
  const handleEmailChange = (index: number, value: string) => {
    const updatedEmails = [...emails];
    updatedEmails[index] = value;
    setEmails(updatedEmails);
  };

  const handlePriceChange = () => {
    if (selectedOption === "equalSplit") {
      const totalBookingPrice = Number(selectedTeeTime?.purchasedFor);
      const totalPlayers = Number(selectedTeeTime?.golfers.length);
      if (totalPlayers > 0) {
        const splitAmount = parseFloat(
          (totalBookingPrice / totalPlayers).toFixed(2)
        );
        setAmount(splitAmount);
      } else {
        setAmount(0);
      }
    }
  };

  useEffect(() => {
    handlePriceChange();
  }, [selectedOption]);

  useEffect(() => {
    console.log("isCollectPaymentOpen changed:", isCollectPaymentOpen);
    if (!isCollectPaymentOpen) {
      setSelectedOption("");
      setAmount(0);
    }
    refetchEmailedUsers().then((data) => {
      console.log("data", data.data);
      setEmailedUsers(data?.data);
    });
  }, [isCollectPaymentOpen]);

  const handleEmailSendOnHyperSwitchPaymentLink = async (index: number) => {
    try {
      console.log("hyperSwitchEmailSend", emails[index], amount);
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = true;
        return newLoadingStates;
      });
      const result = await paymentLinkResult.mutateAsync({
        amount: amount,
        email: emails[index] ?? "",
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
      });
      if (result?.error) {
        toast.error("Error Creating Payment link");
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false; // Reset loading state after operation
          return newLoadingStates;
        });
      } else {
        toast.success(result?.message);
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false; // Reset loading state after operation
          return newLoadingStates;
        });
      }
    } catch (error) {
      toast.error("Error Creating Payment link");
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false; // Reset loading state after operation
        return newLoadingStates;
      });
    } finally {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false; // Reset loading state after operation
        return newLoadingStates;
      });
    }
  };

  return (
    <>
      {isCollectPaymentOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isCollectPaymentOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Collect Payment</div>
            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isCollectPaymentOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex flex-col gap-6 px-0 sm:px-4">
            <TeeTimeItem
              courseImage={selectedTeeTime?.courseLogo ?? ""}
              courseName={selectedTeeTime?.courseName ?? ""}
              courseDate={selectedTeeTime?.date ?? ""}
              golferCount={selectedTeeTime?.golfers.length ?? 0}
              timezoneCorrection={course?.timezoneCorrection}
            />
          </div>
          <div className="flex flex-col gap-6 px-0 py-3 sm:px-4">
            <div className=" flex flex-col w-full gap-4">
              <p className="flex justify-between items-center pl-0 pr-2">
                Total amount of booking{" "}
                <span>${selectedTeeTime?.purchasedFor}</span>
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="option1"
                    type="radio"
                    name="options"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    value="equalSplit"
                    checked={selectedOption === "equalSplit"}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label
                    htmlFor="option1"
                    className="ml-2 text-sm font-medium text-gray-900"
                  >
                    Equal Split
                  </label>
                </div>
                <p className="text-sm">Split Amount : ${amount} </p>
              </div>
            </div>
            <div>Send Payment Link</div>
            <div className="flex flex-col w-full  gap-3">
              {Array.from({ length: Number(availableSlots - 1) }).map(
                (_, index) => (
                  <div key={index} className="flex w-full gap-x-3">
                    <input
                      className="outline outline-2 outline-gray-300 focus:outline-blue-500 px-3 py-1 rounded-md w-full"
                      type="text"
                      placeholder="Enter the email"
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      value={
                        sendEmailedUsers
                          ? sendEmailedUsers[index]?.email
                          : emails[index]
                      }
                    />
                    {sendEmailedUsers && sendEmailedUsers[index] ? (
                      sendEmailedUsers[index]?.isPaid === 1 ? (
                        <FilledButton
                          className="text-sm flex justify-center border-white items-center bg-white text-black"
                          disabled
                        >
                          Paid
                        </FilledButton>
                      ) : sendEmailedUsers[index]?.isPaid === 0 &&
                        sendEmailedUsers[index]?.isActive === 1 ? (
                        <FilledButton
                          onClick={() =>
                            handleEmailSendOnHyperSwitchPaymentLink(index)
                          }
                          className="text-sm flex justify-center items-center"
                          disabled={loadingStates[index]}
                        >
                          {loadingStates[index] ? (
                            <Loader size={20} color="fill-white-600" />
                          ) : (
                            "Resend"
                          )}
                        </FilledButton>
                      ) : (
                        <FilledButton
                          onClick={() =>
                            handleEmailSendOnHyperSwitchPaymentLink(index)
                          }
                          className="text-sm flex justify-center items-center"
                          disabled={loadingStates[index]}
                        >
                          {loadingStates[index] ? (
                            <Loader size={20} color="fill-white-600" />
                          ) : (
                            "Send"
                          )}
                        </FilledButton>
                      )
                    ) : (
                      <FilledButton
                        onClick={() =>
                          handleEmailSendOnHyperSwitchPaymentLink(index)
                        }
                        className="text-sm flex justify-center items-center"
                        disabled={loadingStates[index]}
                      >
                        {loadingStates[index] ? (
                          <Loader size={20} color="fill-white-600" />
                        ) : (
                          "Send"
                        )}
                      </FilledButton>
                    )}
                  </div>
                )
              )}
            </div>
            <div className="flex flex-col w-full gap-3"></div>
          </div>
        </div>
      </aside>
    </>
  );
};
const TeeTimeItem = ({
  courseImage,
  courseName,
  courseDate,
  golferCount,
  timezoneCorrection,
}: {
  courseImage: string;
  courseName: string;
  courseDate: string;
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
            {formatTime(courseDate, false, timezoneCorrection)}
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
