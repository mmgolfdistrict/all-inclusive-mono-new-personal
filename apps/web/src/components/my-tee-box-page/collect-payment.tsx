import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import {
  Fragment,
  useCallback,
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
import { Email } from "../icons/mail";
import { EmailOpen } from "../icons/mailOpen";
import { Pending } from "../icons/pending";
import { LinkExpired } from "../icons/link-expired";
import { OutlineButton } from "../buttons/outline-button";
import { SaleTypeOption, SaleTypeSelector } from "../input/sale-type-select";
import { isValidEmail } from "@golf-district/shared";
type PlayerType = "1" | "2" | "3" | "4";

const PlayerOptions = ["1", "2", "3", "4"];

type SideBarProps = {
  isCollectPaymentOpen: boolean;
  setIsCollectPaymentOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch?: () => Promise<unknown>;
  needsRedirect?: boolean;
  setIsSideBarClose: Dispatch<SetStateAction<boolean>>;
};
const SPLIT_TYPE_OPTIONS: SaleTypeOption[] = [
  {
    value: "equalSplit",
    caption: "Equally distributed among players (Recommended) ",
    description: "The amount is evenly split among 3 out of 4 players, with a 4.5% processing charge automatically added.",
    tooltip: "Equal Split",
  },
  {
    value: "customSplit",
    caption: "Custom amount for each player",
    description: "The amount requested from other players in a custom split includes a 4.5% processing charge, and the amount you receive will be after this charge is deducted from their contribution.",
    tooltip: "Custom Split",
  },
];
export const CollectPayment = ({
  isCollectPaymentOpen,
  setIsCollectPaymentOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
  setIsSideBarClose
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
    | { email: string; isPaid: number; isActive: number; amount: number; emailOpened: number, isLinkExpired: boolean | null }[]
    | undefined
  >(undefined);
  const [totalAmount, setTotalAmount] = useState<any>(0);
  const [commonSplitAmount, setCommonSplitAmount] = useState<number>(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState("equalSplit");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [players, setPlayers] = useState<string>(
    selectedTeeTime?.isGroupBooking
      ? "2"
      : selectedTeeTime?.selectedSlotsCount || availableSlots.toString()
  );
  const [refreshLoader, setRefreshLoader] = useState<boolean>(false);
  const [additionalMessage, setAddtionalMessage] = useState<string>("");
  const { toggleSidebar } = useSidebar({
    isOpen: isCollectPaymentOpen,
    setIsOpen: setIsCollectPaymentOpen,
    setClose: setIsSideBarClose
  });
  const { course } = useCourseContext();
  console.log(course?.logo);
  const handleEmailChange = (index: number, value: string) => {
    const updatedEmails = [...emails];
    updatedEmails[index] = value;
    setEmails(updatedEmails);
  };
  // const getTotal = (updatedAmount: any) => {
  //   if (selectedOption === "equalSplit") {
  //     return updatedAmount.reduce((acc: any, curr: any) => acc + (Number(curr || 0) + (Number(paymentProcessingCharge) / 100)), 0).toFixed(2);
  //   }
  //   if (selectedOption === "customSplit") {
  //     return updatedAmount.reduce((acc: any, curr: any) => acc + (Number(curr || 0)), 0).toFixed(2);
  //   }
  // }

  function checkIfAmountExccedThePurchasePrice(currentAmount: number) {

    const payoutAmount = totalAmount - (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
    if (payoutAmount > selectedTeeTime!?.purchasedFor) {
      return true;
    }
    return false;
  }
  const getTotal = (updatedAmount: any): string => {
    if (selectedOption === "equalSplit") {
      const total = updatedAmount.reduce((acc: number, curr: any) => {
        return acc + (Number(curr || 0) + Number(paymentProcessingCharge) / 100);
      }, 0) as number;

      return total.toFixed(2);
    }

    if (selectedOption === "customSplit") {
      const total = updatedAmount.reduce((acc: number, curr: any) => {
        return acc + Number(curr || 0);
      }, 0) as number;

      return total.toFixed(2);
    }

    return "0.00";
  };
  // const handleAmountChange = (index: number, value: string) => {
  //   // for this custom payment you just have add the value with amount
  //   const updatedAmount = [...amount];
  //   updatedAmount[index] = value;
  //   console.log(updatedAmount);
  //   setAmount(updatedAmount);
  //   const newTotal = getTotal(updatedAmount);

  //   setTotalAmount(Number(newTotal));
  // };

  const handleAmountChange = (index: number, value: string) => {
    setAmount((prev) => {
      const updated = [...prev];
      updated[index] = value;
      const emailUserAmounts = sendEmailedUsers?.map((item) => Number(item.amount)) ?? [];
      const combinedAmounts = [
        ...emailUserAmounts,
        ...updated.slice(emailUserAmounts.length)
      ];
      const newTotal = getTotal(combinedAmounts);
      console.log("newTotal", newTotal);
      setTotalAmount(Number(newTotal));
      return updated;
    });
  };


  console.log("currentAmountState", totalAmount, amount)

  const handleTotalAmountChange = (amountsArray: any) => {
    //const total = amountsArray.reduce((acc: any, curr: any) => acc + (Number(curr || 0)), 0).toFixed(2);
    if (!sendEmailedUsers) {
      const total = amountsArray.reduce((acc: number, curr) => {
        return acc + Number(curr || 0);
      }, 0);
      setTotalAmount(total.toFixed(2));
    } else {
      const total = sendEmailedUsers.reduce((acc: number, curr) => {
        return acc + Number(curr.amount || 0);
      }, 0);
      const totalPlayers = Number(selectedTeeTime?.golfers.length) - 1;

      const remainingPlayer = totalPlayers - sendEmailedUsers.length

      const finalTotal = Number(total + (commonSplitAmount * remainingPlayer));
      setTotalAmount(finalTotal.toFixed(2));
    }
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

        console.log("splitAmount", splitAmount);

        setCommonSplitAmount(splitAmount);
        const amountsArray = Array(totalPlayers - 1).fill(splitAmount);
        const remainingPlayer = totalPlayers - (sendEmailedUsers?.length ?? 0);
        const sendEmailUserAmount = sendEmailedUsers?.map((item) => item.amount);
        if (sendEmailUserAmount && sendEmailUserAmount?.length > 0) {
          const filledEmailUserAmount = [
            ...sendEmailUserAmount,
            ...Array(remainingPlayer).fill(commonSplitAmount)
          ];
          setAmount(filledEmailUserAmount);
        }
        setAmount(amountsArray);
        handleTotalAmountChange(amountsArray);
      }
    } else if (selectedOption === "customSplit") {
      // setAmount(Array.from({ length: Number(availableSlots - 1) }, () => ""));

    }
  };
  const refetchValues = async () => {
    if (refetch) {
      await refetch();
    }
  };
  useEffect(() => {
    handlePriceChange();
  }, [selectedOption, sendTrigger, sendEmailedUsers]);

  useEffect(() => {
    setRefreshLoader(true);
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

    }).finally(() => setRefreshLoader(false));
  }, [sendTrigger, isCollectPaymentOpen]);

  useEffect(() => {
    if (sendEmailedUsers && Array.isArray(sendEmailedUsers)) {
      const totalPaidAmount = sendEmailedUsers.reduce((acc: number, curr) => {
        if (curr.isPaid === 1) {
          return acc + (curr.amount || 0);
        }
        return acc;
      }, 0);
      setPaidAmount(totalPaidAmount);
    } else {
      setPaidAmount(0);
    }
  }, [sendTrigger, sendEmailedUsers])

  // useEffect(() => {
  //   if (sendEmailedUsers && sendEmailedUsers.length > 0) {
  //     const amountsArray = sendEmailedUsers.map(user => user.amount.toFixed(2));
  //     setAmount(amountsArray);
  //   }
  // }, [sendEmailedUsers, selectedOption]);
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
        setRefreshLoader(false);
        return;
      }
      setEmailedUsers(data?.data?.map(user => ({
        ...user,
        amount: (user.totalPayoutAmount / 100),
      })));
      setRefreshLoader(false);
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

      const isCollectAmountExceed = checkIfAmountExccedThePurchasePrice(Number(amount[index]));

      if (isCollectAmountExceed) {
        toast.error("The amount you are collecting is exceeding the purchase price");
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
        return;
      }
      const result = await paymentLinkResult.mutateAsync({
        amount: Number(amount[index]) || 0,
        email: emails[index] ?? "",
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
        origin: origin,
        totalPayoutAmount: Number(amount[index]),
        collectPaymentProcessorCharge: Number(paymentProcessingCharge),
        courseLogo: `${course?.logo}`,
        additionalMessage: additionalMessage
      });
      if (result?.error) {
        toast.error(`${result.message}`);
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
    } catch (error: any) {
      toast.error(`${error.message}`);
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
      setAddtionalMessage("");
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
        collectPaymentProcessorCharge: Number(paymentProcessingCharge),
        courseLogo: `${course?.logo}`,
        additionalMessage: additionalMessage,
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
      setAddtionalMessage("");
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
        //w-[80vw]
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex w-full  h-[90dvh]  -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[600px] md:h-[100dvh] ${isCollectPaymentOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative flex h-full flex-col overflow-y-auto ">
          <div className="flex flex-col items-start justify-between p-4">
            <div className="flex justify-between w-full" >
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
            <div className="flex flex-col gap-6 px-0 pt w-full mt-2">
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
          </div>
          <div className="flex flex-col gap-3 px-0 py-1 sm:px-4">
            <div className=" flex flex-col w-full gap-4">
              <div className="flex items-center justify-between">
                <div className=" w-full flex justify-start items-center gap-5">
                  <SaleTypeSelector
                    className="flex flex-col w-full"
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                    saleTypeOptions={SPLIT_TYPE_OPTIONS}
                    defaultValue={selectedOption}
                  />
                  {/* <div className="flex items-center">
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
                  </div> */}
                </div>
              </div>
            </div>
            {/* <div className="flex justify-between items-center w-full">
            
            </div> */}
            <div className="flex flex-col justify-between w-full px-3 mt-[25px]">
              <div>
                <p className="text-red text-[12px] pt-4 pb-4">
                  *Payment processor charges of {Number(paymentProcessingCharge || 0) / 100}% will be applicable.
                </p>
              </div>
              <div className="flex justify-between">
                <h4 className="text-primary-gray" >
                  Send Payment Link
                </h4>
                <Refresh
                  onClick={() => setSendTrigger((prev) => prev + 1)}
                  width={20}
                  height={20}
                  className={`cursor-pointer ${refreshLoader ? "animate-spin" : ""} `}
                />
              </div>
            </div>
            <div className="flex flex-col w-full gap-3 ">
              {Array.from({ length: Number(availableSlots - 1) }).map(
                (_, index) => (
                  <div key={index} className="flex w-full gap-x-3 justify-center items-center">
                    <div className="w-full flex flex-col">
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
                      <div className="h-2 mb-1">
                        {emails[index] && !isValidEmail(emails[index]) && (
                          <span className="text-red text-[12px]">Invalid email address</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-gray-700 font-medium">$</span>
                      {selectedOption === "equalSplit" ? <p> {(sendEmailedUsers?.[index]?.amount ?? amount[index] ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      </p> : (
                        <input
                          className=" bg-secondary-white outline-none focus:outline-white px-3 py-1 rounded-md w-20 "
                          type="text"
                          placeholder="Amt"
                          // value={
                          //   sendEmailedUsers && sendEmailedUsers[index]?.amount
                          //     ? sendEmailedUsers[index]?.amount / 100
                          //     : amount[index]
                          // }
                          //value={sendEmailedUsers?.[index]?.amount ?? amount[index]}
                          value={sendEmailedUsers?.[index]?.isPaid === 1
                            ? sendEmailedUsers?.[index]?.amount
                            : amount[index] ?? sendEmailedUsers?.[index]?.amount}
                          // value={amount[index]}
                          onChange={(e) => {
                            //+paymentProcessingCharge
                            const addedValue = e.target.value
                            handleAmountChange(index, addedValue);
                          }
                          }
                          // disabled={selectedOption === "equalSplit"}
                          disabled={sendEmailedUsers?.[index]?.isPaid === 1}
                        />
                      )}
                    </div>

                    {sendEmailedUsers?.[index] ? (
                      sendEmailedUsers[index]?.isPaid === 1 ? (
                        <Fragment>
                          <div className="flex gap-2 px-5 py-1.5 justify-center items-center" style={{ paddingRight: "87px" }}>
                            <CheckedIcon color="green" />
                            <p>Paid</p>
                          </div>
                        </Fragment>
                      ) : sendEmailedUsers[index]?.isPaid === 0 &&
                        sendEmailedUsers[index]?.isActive === 1 ? (
                        <div className="flex justify-center items-center">
                          <FilledButton
                            onClick={() =>
                              resendHyperSwitchPaymentLinkOnEmail(index)
                            }
                            className={`text-sm flex justify-center items-center ${!sendEmailedUsers[index]?.isLinkExpired ? " text-white/50 cursor-not-allowed" : "text-white"}`}
                            disabled={loadingStates[index] || !sendEmailedUsers[index]?.isLinkExpired}
                          >
                            {loadingStates[index] ? (
                              <Loader size={20} color="fill-white-600" />
                            ) : (
                              "Resend"
                            )}
                          </FilledButton>
                          {/* {!sendEmailedUsers?.[index]?.isLinkExpired ? (
                      <div className="flex justify-center items-start gap-1">
                        <Tooltip
                          trigger={<Pending width={30} height={30} />}
                          content="Payment is pending"
                        />
                      </div>
                    ):(
                      <div>
                         <Tooltip
                          trigger={<LinkExpired width={30} height={30} color="red"/>}
                          content="Payment link is expired"
                        />
                      </div>
                    )} */}
                        </div>
                      ) : (
                        <FilledButton
                          onClick={() =>
                            handleEmailSendOnHyperSwitchPaymentLink(index)
                          }
                          className={`text-sm flex justify-center items-center text-black ${!isValidEmail(emails[index] ?? "") ? "text-white/50 cursor-not-allowed" : "text-white"} `}
                          disabled={loadingStates[index] || !isValidEmail(emails[index] ?? "")}
                        >
                          {loadingStates[index] ? (
                            <Loader size={20} color="fill-white-600" />
                          ) : (
                            "Send"
                          )}
                        </FilledButton>
                      )
                    ) : (
                      <div style={{ paddingRight: "62px" }}>
                        <FilledButton
                          onClick={() =>
                            handleEmailSendOnHyperSwitchPaymentLink(index)
                          }
                          className={`text-sm flex justify-center items-center text-black ${!isValidEmail(emails[index] ?? "") ? "text-white/50 cursor-not-allowed" : "text-white"} `}
                          disabled={loadingStates[index] || !isValidEmail(emails[index] ?? "")}
                        >
                          {loadingStates[index] ? (
                            <Loader size={20} color="fill-white-600" />
                          ) : (
                            "Send"
                          )}
                        </FilledButton>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {sendEmailedUsers?.[index] && sendEmailedUsers[index]?.isActive === 1 && sendEmailedUsers[index]?.isPaid === 0 && !sendEmailedUsers?.[index]?.isLinkExpired ? (
                        <div className="flex justify-center items-start gap-1">
                          <Tooltip
                            trigger={<Pending width={30} height={30} />}
                            content="Payment is pending"
                          />
                        </div>
                      ) : (sendEmailedUsers?.[index]?.isLinkExpired && sendEmailedUsers?.[index]?.isPaid === 0) ? (
                        <div>
                          <Tooltip
                            trigger={<LinkExpired width={30} height={30} color="#D22B2B" />}
                            content="Payment link is expired"
                          />
                        </div>
                      ) : null}
                      <div>
                        {sendEmailedUsers?.[index]?.emailOpened === 1 ? (
                          <div className="flex justify-center items-start gap-1" >
                            <Tooltip
                              trigger={<EmailOpen width={30} height={30} color="green" />}
                              content="Email opened and read"
                            />
                          </div>
                        ) : (sendEmailedUsers?.[index]?.emailOpened === 0 && sendEmailedUsers?.[index]?.isPaid === 0) ? (
                          <div className="flex justify-center items-start gap-1">
                            <Tooltip
                              trigger={<Email width={30} height={30} />}
                              content="Email has not been read"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="w-full">
              <label htmlFor="message" className="block text-primary-gray font-medium mb-1">
                Additional Message
              </label>
              <textarea
                id="message"
                placeholder="Addtional message"
                className="w-full h-32 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                onChange={(e) => setAddtionalMessage(e.target.value)}
                value={additionalMessage}
              ></textarea>
            </div>
            <div className="flex flex-col w-full gap-3">
              <div className="w-full flex justify-between px-3 pt-5">
                <div className="text-[16px] flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray">Total Amount Paid</h4>
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="The total for the number of people who have paid"
                  />
                </div>
                <div>
                  <p className="text-[16px] font-[500] text-primary-gray">${Number(paidAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-5">
                <div className="text-[16px] flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray">Total Amount</h4>
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This is total amount Including payment processing charges"
                  />
                </div>
                <div>
                  <p className="text-[16px] font-[500] text-primary-gray">${Number(totalAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3" >
                <div className="text-[16px] flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray" >Payment Processor Charges</h4>
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="Payment processing fee"
                  />
                </div>
                <div>
                  <p className="text-primary-gray">
                    ${(
                      (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3">
                <div className=" text-[16px] flex justify-start gap-2 font-[500]">
                  <h4 className="text-primary-gray" >Your Payout</h4>
                  <Tooltip
                    trigger={<Info className="h-[14px] w-[14px]" />}
                    content="This Amount you will received in Cashout"
                  />
                </div>
                <div>
                  <p className="text-[16px] font-[500] text-primary-gray">
                    {(
                      totalAmount - (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full justify-center items-center">
              <OutlineButton
                onClick={() => setIsCollectPaymentOpen(false)}
                data-testid="cancel-button-id"
                className="w-full"
              >
                Cancel
              </OutlineButton>
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
