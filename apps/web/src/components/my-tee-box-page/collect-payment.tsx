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
import { CheckedIcon } from "../icons/checked";
import { Close } from "../icons/close";
import { Players } from "../icons/players";
import { Refresh } from "../icons/refresh";
import { Input } from "../input/input";
import { SingleSlider } from "../input/single-slider";
import { Loader } from "../loading/spinner";
import { type OwnedTeeTime } from "./owned";
import { Tooltip } from "../tooltip";
import { Info } from "../icons/info";

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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { data: paymentProcessingCharge } = api.checkout.collectPaymentProcessorPercent.useQuery({})
  const paymentLinkResult =
    api.checkout.createHyperSwitchPaymentLink.useMutation();
  const resendHyperSwitchPaymentLink =
    api.checkout.resendHyperSwitchPaymentLink.useMutation();
  const { data: emailedUsers, refetch: refetchEmailedUsers } =
    api.checkout.checkEmailedUserPaidTheAmount.useQuery(
      {
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
      },
      { enabled: false }
    );
  const availableSlots = selectedTeeTime?.golfers.length || 0;
  const [sendTrigger, setSendTrigger] = useState(0);
  const [emails, setEmails] = useState(
    Array.from({ length: Number(availableSlots - 1) }, () => "")
  );
  const [amount, setAmount] = useState(
    Array.from({ length: Number(availableSlots - 1) }, () => "")
  );
  const [sendEmailedUsers, setEmailedUsers] = useState<
    | { email: string; isPaid: number; isActive: number; amount: number }[]
    | undefined
  >(undefined);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState("equalSplit");
  const [isLoading, setIsLoading] = useState<boolean>(false);
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


const getTotal = (updatedAmount) =>{
  if(selectedOption === "equalSplit"){
    return updatedAmount.reduce((acc, curr) => acc + (Number(curr || 0) + (Number(paymentProcessingCharge) / 100)), 0).toFixed(2);
  }
  if(selectedOption === "customSplit"){
    return updatedAmount.reduce((acc, curr) => acc + (Number(curr || 0) ), 0).toFixed(2);
  }
}
  const handleAmountChange = (index: number, value: string) => {
    // for this custom payment you just have add the value with amount
    const updatedAmount = [...amount];
    updatedAmount[index] = value;
    console.log(updatedAmount);
    setAmount(updatedAmount);
    const newTotal = getTotal(updatedAmount);
    
    setTotalAmount(Number(newTotal));
  };

  const handleTotalAmountChange = (amountsArray: any) => {
    const total = amountsArray.reduce((acc, curr) => acc + curr, 0).toFixed(2);
    setTotalAmount(total);
  }



  const handlePriceChange = () => {
    if (selectedOption === "equalSplit") {
      const totalBookingPrice = Number(selectedTeeTime?.purchasedFor);
      const totalPlayers = Number(selectedTeeTime?.golfers.length);
      if (totalPlayers > 0) {
        const processingChargeFees = (Number(paymentProcessingCharge) / 100);
        console.log("processing fee charge", processingChargeFees)
        const splitAmount = parseFloat(
          (totalBookingPrice / totalPlayers).toFixed(2)
        ) + processingChargeFees;
        const amountsArray = Array(totalPlayers-1).fill(splitAmount);
        setAmount(amountsArray);
        handleTotalAmountChange(amountsArray);
      }
    } else if (selectedOption === "customSplit") {
      // setAmount(Array.from({ length: Number(availableSlots - 1) }, () => ""));
    }
    // if (selectedOption === "equalSplit") {
    //   setAmount(0);
    //   const totalBookingPrice = Number(selectedTeeTime?.purchasedFor);
    //   const totalPlayers = Number(selectedTeeTime?.golfers.length);
    //   if (totalPlayers > 0) {
    //     const splitAmount = parseFloat(
    //       (totalBookingPrice / totalPlayers).toFixed(2)
    //     );
    //     setAmount(splitAmount);
    //   } else {
    //     setAmount(null);
    //   }
    // } else if (selectedOption === "customSplit") {
    //   setAmount(0);
    // }
  };
  const refetchValues = async () => {
    if (refetch) {
      await refetch();
    }
  };
  useEffect(() => {
    handlePriceChange();
  }, [selectedOption]);

  useEffect(() => {
    void refetchEmailedUsers().then((data) => {
      console.log("data", data.data);
      if (data?.data?.length == 0) {
        setEmailedUsers(undefined);
        return;
      }
      setEmailedUsers(data?.data?.map(user => ({
        ...user,
        amount: (user.totalPayoutAmount / 100),
      })));
    });
  }, [sendTrigger]);

  useEffect(() => {
    console.log("isCollectPaymentOpen changed:", isCollectPaymentOpen);

    if (!isCollectPaymentOpen) {
      setSelectedOption("equalSplit");
      setAmount(Array.from({ length: Number(availableSlots - 1) }, () => ""));
      setEmails(Array.from({ length: Number(availableSlots - 1) }, () => ""));
      setEmailedUsers(undefined);
      void refetchValues();
    }
    if (selectedOption === "equalSplit") {
      handlePriceChange();
    }
    void refetchEmailedUsers().then((data) => {
      console.log("data", data.data);
      if (data?.data?.length == 0) {
        setEmailedUsers(undefined);
        return;
      }
      setEmailedUsers(data?.data?.map(user => ({
        ...user,
        amount: (user.totalPayoutAmount / 100),
      })));
    });
    console.log("selectedOptions", selectedOption);
  }, [isCollectPaymentOpen, availableSlots]);

  const handleEmailSendOnHyperSwitchPaymentLink = async (index: number) => {
    try {
      console.log("hyperSwitchEmailSend", emails[index], amount);
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = true;
        return newLoadingStates;
      });
      const result = await paymentLinkResult.mutateAsync({
        amount: Number(amount[index]) || 0,
        email: emails[index] ?? "",
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
        origin: origin,
        totalPayoutAmount: Number(amount[index]),
        collectPaymentProcessorCharge: Number(paymentProcessingCharge)
      });
      if (result?.error) {
        toast.error("Error Creating Payment link");
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
      } else {
        toast.success(result?.message);
        setSendTrigger((prev) => prev + 1);
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
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

  const resendHyperSwitchPaymentLinkOnEmail = async (index: number) => {
    try {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = true;
        return newLoadingStates;
      });
      console.log("hyperSwitchEmailSend", sendEmailedUsers, amount);
      const result = await resendHyperSwitchPaymentLink.mutateAsync({
        amount: Number(amount[index]),
        // amount != null && amount > 0
        //   ? amount
        //   : sendEmailedUsers?.[index]?.amount ?? 0,
        email: sendEmailedUsers?.[index]?.email ?? "",
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
        isActive: Number(sendEmailedUsers?.[index]?.isActive),
        origin: origin,
        totalPayoutAmount: Number(amount[index]),
        collectPaymentProcessorCharge: Number(paymentProcessingCharge)
      });
      if (result?.error) {
        toast.error("Error Creating Payment link");
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
      } else {
        toast.success(result?.message);
        setSendTrigger((prev) => prev + 1);
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
      }
    } catch (error) {
      toast.error("Error Creating Payment link");
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false;
        return newLoadingStates;
      });
    } finally {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false;
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
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[600px] md:h-[100dvh] ${isCollectPaymentOpen ? "translate-x-0" : "translate-x-full"
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
              purchasedFor={selectedTeeTime?.purchasedFor ?? 0}
              weatherGuaranteeAmount={
                selectedTeeTime?.weatherGuaranteeAmount ?? 0
              }
            />
          </div>
          <div className="flex flex-col gap-3 px-0 py-1 sm:px-4">
            <div className=" flex flex-col w-full gap-4">
              <div className="flex items-center justify-between">
                <div className=" w-full flex justify-start items-center gap-5">
                  <div className="flex items-center">
                    <input
                      id="option1"
                      type="radio"
                      name="options"
                      className="w-4 h-4 text-blue-600 bg-gray-400 outline-none focus:ring-blue-500"
                      value="equalSplit"
                      checked={selectedOption === "equalSplit"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    <label
                      className="ml-2 text-[18px] font-medium text-gray-900"
                      htmlFor="option1"
                    >
                      Equal Split
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="option2"
                      type="radio"
                      name="options"
                      className="w-4 h-4 text-blue-600 bg-gray-400 outline-none focus:ring-blue-500"
                      value="customSplit"
                      checked={selectedOption === "customSplit"}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    <label
                      className="ml-2 text-[18px] font-medium text-gray-900"
                      htmlFor="option2"
                    >
                      Custom Split
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="flex justify-between items-center w-full">
            
            </div> */}
            <div className="flex justify-between items-center w-full px-3">
              <div className="flex flex-col justify-start">
                <p className="text-red text-[12px] pt-4 pb-4">
                  *Payment processor charges of {Number(paymentProcessingCharge || 0) / 100}% will be applicable.
                </p>
                <div>Send Payment Link</div>
              </div>
              <Refresh
                onClick={() => setSendTrigger((prev) => prev + 1)}
                width={20}
                height={20}
                className="cursor-pointer"
              />
            </div>
            <div className="flex flex-col w-full  gap-3">
              {Array.from({ length: Number(availableSlots - 1) }).map(
                (_, index) => (
                  <div key={index} className="flex w-full gap-x-3 justify-center items-center">
                    <input
                      className="outline-none bg-secondary-white focus:outline-white px-3 py-1 rounded-md w-full "
                      type="text"
                      placeholder="Enter the email"
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      // value={
                      //   sendEmailedUsers && sendEmailedUsers[index]?.email
                      //     ? sendEmailedUsers[index]?.email
                      //     : emails[index]
                      // }
                      value={sendEmailedUsers?.[index]?.email ?? emails[index]}
                    />
                    <div className="flex items-center justify-center">
                      <span className="text-gray-700 font-medium">$</span>
                      <input
                        className=" bg-secondary-white outline-none focus:outline-white px-3 py-1 rounded-md w-20 "
                        type="text"
                        placeholder="Amt"
                        // value={
                        //   sendEmailedUsers && sendEmailedUsers[index]?.amount
                        //     ? sendEmailedUsers[index]?.amount / 100
                        //     : amount[index]
                        // }
                        value={sendEmailedUsers?.[index]?.amount ?? amount[index]}
                        onChange={(e) =>{
                          const addedValue = Number(e.target.value+paymentProcessingCharge) 
                          handleAmountChange(index, e.target.value)
                         }
                        }
                        disabled={selectedOption === "equalSplit"}
                      />
                    </div>

                    {sendEmailedUsers?.[index] ? (
                      sendEmailedUsers[index]?.isPaid === 1 ? (
                        <Fragment>
                          <div className="flex gap-2 px-5 py-1.5 justify-center items-center">
                            <CheckedIcon color="green" />
                            <p>Paid</p>
                          </div>
                        </Fragment>
                      ) : sendEmailedUsers[index]?.isPaid === 0 &&
                        sendEmailedUsers[index]?.isActive === 1 ? (
                        <FilledButton
                          onClick={() =>
                            resendHyperSwitchPaymentLinkOnEmail(index)
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
                          className="text-sm flex justify-center items-center text-black"
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
                        className="text-sm flex justify-center items-center text-black"
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
            <div className="flex flex-col w-full gap-3">
              <div className="w-full flex justify-between px-3 pt-5">
                <div className="text-[14px] flex justify-start gap-2 font-[300] text-primary-gray ">
                  Total Amount
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This is total amount Including payment processing charges"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-[300] text-primary-gray">${totalAmount}</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3" >
                <div className="text-[14px] flex justify-start gap-2 font-[300] text-primary-gray">
                 Payment Processor Charges
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Payment processing fee"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-[300] text-primary-gray">${(Number(paymentProcessingCharge) / 100) * (Number(availableSlots - 1))}</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3">
                <div className=" text-[14px] flex justify-start gap-2 font-[300] text-primary-gray">
                  Your Payout
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This Amount you will received in Cashout"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-[300] text-primary-gray">${(totalAmount - (Number(paymentProcessingCharge) / 100) * (Number(availableSlots - 1)))}</p>
                </div>
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
  courseDate,
  golferCount,
  timezoneCorrection,
  purchasedFor,
  weatherGuaranteeAmount,
}: {
  courseImage: string;
  courseName: string;
  courseDate: string;
  golferCount: number;
  timezoneCorrection: number | undefined;
  purchasedFor: number | undefined;
  weatherGuaranteeAmount: number | undefined;
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
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px]" />
        <div>
          <p className="font-light">
            You purchased for{" "}
            <span className="font-semibold">${purchasedFor}</span>
          </p>
          <p className="font-light">
            {" "}
            Weather guarantee purchased At{" "}
            <span className="font-semibold">
              ${(weatherGuaranteeAmount ?? 0) / 100}
            </span>{" "}
          </p>
        </div>
      </div>
    </div>
  );
};
