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
import type { SaleTypeOption } from "../input/sale-type-select";
import { SaleTypeSelector } from "../input/sale-type-select";
import { isValidEmail } from "@golf-district/shared";
import { useMediaQuery } from "usehooks-ts";
import { useAppContext } from "~/contexts/AppContext";
type CollectInputs = {
  index?: number;
  email?: string;
  amount?: string;
  isActive?: number;
  isPaid?: number;
  isLinkExpired?: boolean;
  emailOpened?: number;
  paymentId?: string;
};



type SideBarProps = {
  isCollectPaymentOpen: boolean;
  setIsCollectPaymentOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch?: () => Promise<unknown>;
  needsRedirect?: boolean;
  setIsSideBarClose: Dispatch<SetStateAction<boolean>>;
};

export const CollectPayment = ({
  isCollectPaymentOpen,
  setIsCollectPaymentOpen,
  selectedTeeTime,
  refetch,
  needsRedirect,
  setIsSideBarClose
}: SideBarProps) => {

  const SPLIT_TYPE_OPTIONS: SaleTypeOption[] = [
    {
      value: "equalSplit",
      caption: "Equally Distributed to All (Recommended) ",
      description: "The amount is evenly split among 3 out of 4 players.",
      tooltip: `The amount you paid is equally distributed to all the players including you. You will be able to collect money from the remaining ${(selectedTeeTime?.golfers?.length ?? 0) - 1} ${(selectedTeeTime?.golfers?.length ?? 0) > 1 ? "players" : "player"}.`,
    },
    {
      value: "customSplit",
      caption: "Custom Amount",
      description: "You decide the amount you want to collect from other players. This gives you the flexibility on who and how much you want to collect from.",
      tooltip: "You will be able to collect a different amount from each player not exceeding the total amount. This gives you the flexibility to pay of your friends event like their birthdays.",
    },
  ];
  const { entity } = useAppContext();
  const isMobile = useMediaQuery("(max-width: 768px)");
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

  const [collectPaymentInputs, setCollectPaymentInput] = useState<CollectInputs[]>([]);
  const [totalAmount, setTotalAmount] = useState<any>(0);
  const [commonSplitAmount, setCommonSplitAmount] = useState<number>(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState("equalSplit");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paidAmount, setTotalPaidAmount] = useState<number>(0);
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
  const [validationMsg, setValidationMsg] = useState<string>("");



  const { course } = useCourseContext();
  console.log(course?.logo);

  const handleEmailChange = (index: number, value: string) => {
    setCollectPaymentInput((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          email: value,
        };
      } else {
        // If it doesn't exist yet, initialize it fully
        updated[index] = {
          index: index,
          email: value,
          amount: "",
          isActive: 0,
          isPaid: 0,
          isLinkExpired: false,
          emailOpened: 0,
          paymentId: ""
        };
      }
      return updated;
    });
  };

  function checkIfAmountExccedThePurchasePrice() {
    if (!selectedTeeTime?.purchasedFor) return false;
    const payoutAmount = totalAmount - (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
    if (payoutAmount > selectedTeeTime?.purchasedFor) {
      return true;
    }
    return false;
  }
  const handleAmountChange = (index: number, value: string) => {
    setCollectPaymentInput((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          amount: value,
        };
      } else {
        // If it doesn't exist yet, initialize it fully
        updated[index] = {
          index: index,
          email: "",
          amount: value,
          isActive: 0,
          isPaid: 0,
          isLinkExpired: false,
          emailOpened: 0,
          paymentId: ""
        };
      }
      const total = updated.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      setTotalAmount(total);
      return updated;
    });
  }
  const handleTotalAmountChange = (amountsArray: any) => {
    //const total = amountsArray.reduce((acc: any, curr: any) => acc + (Number(curr || 0)), 0).toFixed(2);
    // if (!sendEmailedUsers) {
    //   const total = amountsArray.reduce((acc: number, curr) => {
    //     return acc + Number(curr || 0);
    //   }, 0);
    //   setTotalAmount(total.toFixed(2));
    // } else {
    //   const total = sendEmailedUsers.reduce((acc: number, curr) => {
    //     return acc + Number(curr.amount || 0);
    //   }, 0);
    //   const totalPlayers = Number(selectedTeeTime?.golfers.length) - 1;

    //   const remainingPlayer = totalPlayers - sendEmailedUsers.length

    //   const finalTotal = Number(total + (commonSplitAmount * remainingPlayer));
    //   setTotalAmount(finalTotal.toFixed(2));
    // }
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
  const isAdditionalMessageExceedingLimit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const maxLength = 127;
    const value = e.target.value;
    setAddtionalMessage(value);
    if (value.length > maxLength) {
      setValidationMsg(`Character limit exceeded! Maximum allowed is ${maxLength} characters.`);
    } else {
      setValidationMsg(`Characters remaining: ${maxLength - value.length}`);
    }
  }
  const checkDuplicateEmail = (email: string, index: number): boolean => {
    return collectPaymentInputs.some(
      (input, i) => input.email?.toLowerCase() === email.toLowerCase() && i !== index
    );
  };
  const handleEmailSendOnHyperSwitchPaymentLink = async (index: number) => {

    try {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = true;
        return newLoadingStates;
      });

      const currentPlayer = collectPaymentInputs.find((p) => p.index === index);
      if (!currentPlayer) {
        toast.error("Player data not found for this slot");
        return;
      }
      const { email, amount } = currentPlayer;
      if (!email || !isValidEmail(email)) {
        toast.error("Please enter a valid email before sending the link");
        return;
      }
      const isDuplicateCheck = checkDuplicateEmail(email, index);
      if (isDuplicateCheck) {
        toast.error(`The email ${email} is already used.`);
        return;
      }
      const isCollectAmountExceed = checkIfAmountExccedThePurchasePrice();
      if (isCollectAmountExceed) {
        toast.error("The amount is exceeding the purchase price");
        return;
      }
      console.log("Sending payment link for", email, "with amount", amount);
      const result = await paymentLinkResult.mutateAsync({
        amount: Number(amount),
        email: email,
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
        origin: origin,
        totalPayoutAmount: Number(amount),
        collectPaymentProcessorCharge: Number(paymentProcessingCharge),
        courseLogo: `${course?.logo}`,
        additionalMessage: additionalMessage,
        index: index,
        color1: entity?.color1 ?? "#000000"
      });
      if (result?.error) {
        toast.error(result?.message);
        setCollectPaymentInput((prevInputs) =>
          prevInputs.map((input) =>
            input.index === index
              ? { ...input, email: "" }
              : input
          )
        );
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
      } else {
        toast.success(result?.message, {
          progressStyle: {
            background: entity?.color1,
          },
        });
        setCollectPaymentInput((prevInputs) =>
          prevInputs.map((input) =>
            input.index === index
              ? { ...input, isActive: 1 }
              : input
          )
        );
        setSendTrigger((prev) => prev + 1);
      }
    } catch (error: any) {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false;
        return newLoadingStates;
      });
      setAddtionalMessage("");
    } finally {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = false;
        return newLoadingStates;
      });
      setAddtionalMessage("");
    }
  }
  const resendHyperSwitchPaymentLinkOnEmail = async (index: number) => {
    try {
      setLoadingStates((prev) => {
        const newLoadingStates = [...prev];
        newLoadingStates[index] = true;
        return newLoadingStates;
      });
      const currentPlayer = collectPaymentInputs.find((p) => p.index === index);
      if (!currentPlayer) {
        toast.error("Player data not found for this slot");
        return;
      }
      const { email, amount, isActive, paymentId } = currentPlayer;
      // console.log("hyperSwitchEmailSend", sendEmailedUsers, amount);
      const result = await resendHyperSwitchPaymentLink.mutateAsync({
        amount: Number(amount),
        email: email || "",
        bookingId: selectedTeeTime?.bookingIds[0] ?? "",
        isActive: isActive || 1,
        origin: origin,
        totalPayoutAmount: Number(amount),
        collectPaymentProcessorCharge: Number(paymentProcessingCharge),
        courseLogo: `${course?.logo}`,
        additionalMessage: additionalMessage,
        index: index,
        paymentId: paymentId || ""
      });
      if (result?.error) {
        toast.error(result?.message);
        setCollectPaymentInput((prevInputs) =>
          prevInputs.map((input) =>
            input.index === index
              ? { ...input, email: "" }
              : input
          )
        );
        setLoadingStates((prev) => {
          const newLoadingStates = [...prev];
          newLoadingStates[index] = false;
          return newLoadingStates;
        });
      } else {
        toast.success(result?.message, {
          progressStyle: {
            background: entity?.color1,
          },
        });
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
  useEffect(() => {
    if (selectedOption === "equalSplit" || selectedOption === "customSplit") {
      const totalBookingPrice = Number(selectedTeeTime?.purchasedFor);
      const totalPlayers = Number(selectedTeeTime?.golfers.length);
      if (totalPlayers > 0) {
        const processingChargeFees = (Number(paymentProcessingCharge) / 100);
        console.log("processing fee charge", processingChargeFees)
        const splitAmount = parseFloat(
          (totalBookingPrice / totalPlayers).toFixed(2)
        ) + processingChargeFees;
        const arr = Array.from({ length: Number(availableSlots - 1) }, (_, i) => ({
          index: i,
          email: "",
          amount: splitAmount.toFixed(2),
          isActive: 0,
          isPaid: 0,
          isLinkExpired: false,
          emailOpened: 0,
          paymentId: ""
        }));
        setCollectPaymentInput(arr);
        setSendTrigger((prev) => prev + 1);
      }
    }
    //setLoadingStates(Array(availableSlots - 1).fill(false)); 
  }, [selectedTeeTime]);
  useEffect(() => {
    setRefreshLoader(true);
    void refetchEmailedUsers()
      .then((data) => {
        const fetchedUsers = data?.data ?? [];

        if (fetchedUsers.length === 0) return;

        const updatedInputs = collectPaymentInputs.map((input, index) => {
          const matchedUser = fetchedUsers.find(
            (user) => user.index === input.index
          );
          return matchedUser
            ? {
              ...input,
              email: matchedUser.email,
              amount: (matchedUser.totalPayoutAmount / 100).toFixed(2),
              isPaid: matchedUser.isPaid,
              isActive: matchedUser.isActive,
              emailOpened: matchedUser.emailOpened,
              isLinkExpired: Boolean(matchedUser.isLinkExpired),
              paymentId: matchedUser.paymentId,
              // expireTime: matchedUser.expireTime,
            }
            : input;
        });
        setCollectPaymentInput(updatedInputs);
        setRefreshLoader(false);
      }).finally(() => setRefreshLoader(false));
  }, [sendTrigger]);
  useEffect(() => {
    if (collectPaymentInputs.length > 0) {
      const totalAmount = collectPaymentInputs.reduce((acc, input) => {
        const amount = parseFloat(input?.amount ?? "0");
        return isNaN(amount) ? acc : acc + amount;
      }, 0);
      const totalPaidAmount = collectPaymentInputs.reduce((acc, input) => {
        if (input.isPaid === 1 && input.amount != undefined) {
          console.log("paidamount", input.amount);
          const amount = parseFloat(input.amount);
          return isNaN(amount) ? acc : acc + amount;
        }
        return acc
      }, 0)
      console.log("paidamount", totalPaidAmount);
      setTotalPaidAmount(totalPaidAmount || 0);
      setTotalAmount(totalAmount);
    }
  }, [collectPaymentInputs, sendTrigger]);

  useEffect(() => {
    if (
      selectedOption === "equalSplit" &&
      collectPaymentInputs.length > 0
    ) {
      const totalBookingPrice = Number(selectedTeeTime?.purchasedFor);
      const totalPlayers = Number(selectedTeeTime?.golfers.length);
      if (totalPlayers > 0) {
        const processingChargeFees = (Number(paymentProcessingCharge) / 100);
        const splitAmount = parseFloat(
          (totalBookingPrice / totalPlayers).toFixed(2)
        ) + processingChargeFees;

        const updatedInputs = collectPaymentInputs.map((input) => ({
          ...input,
          amount: splitAmount.toString(),
        }));

        setCollectPaymentInput(updatedInputs);
      }
    }
  }, [selectedOption]);

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
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex w-full  h-[90vh]  -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:max-w-[40.625rem] md:h-screen ${isCollectPaymentOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative flex h-full flex-col overflow-y-auto ">
          <div className="flex flex-col items-start justify-between p-4">
            <div className="flex justify-between w-full" >
              <div className="text-lg">Request Payment</div>
              <button
                // ref={trigger}
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={isCollectPaymentOpen}
                className="z-[2]"
                aria-label="sidebarToggle"
                data-testid="close-button-id"
              >
                <Close className="h-[1.5625rem] w-[1.5625rem]" />
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
          <div className="flex flex-col gap-3 px-2 py-1 sm:px-4">
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
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between w-full px-1 mt-[1.5625rem]">
              {/* <div>
                <p className="text-red text-xs pt-4 pb-4">
                  *Payment processor charges of {Number(paymentProcessingCharge || 0) / 100}% will be applicable.
                </p>
              </div> */}
              <div className="w-full mb-2">
                <label htmlFor="message" className="block text-primary-gray font-medium mb-1">
                  <div>
                    <span>Additional Message</span>
                    <span className="ml-4 text-sm text-blue-500" >{validationMsg}</span>
                  </div>
                </label>
                <textarea
                  id="message"
                  placeholder="Addtional message"
                  className="w-full h-25 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  onChange={(e) => isAdditionalMessageExceedingLimit(e)}
                  value={additionalMessage}
                  maxLength={127}
                ></textarea>
              </div>
              <div className="flex justify-between">
                <h4 className="text-primary-gray" >
                  Enter Recipient Information
                </h4>
                <Refresh
                  onClick={() => setSendTrigger((prev) => prev + 1)}
                  width={20}
                  height={20}
                  color={entity?.color1}
                  className={`cursor-pointer ${refreshLoader ? "animate-spin" : ""} `}
                />
              </div>
            </div>
            <div className="flex flex-col w-full gap-3 ">

              {collectPaymentInputs.map((player, index) => (
                <div
                  key={index}
                  className={`flex w-full ${isMobile ? "flex-col gap-y-2 items-start" : "gap-x-3 justify-center items-center"}`}
                >
                  {/* Row 1: Email + Amount */}
                  <div className={`w-full flex ${isMobile ? "flex-row gap-2 items-center" : "flex-row gap-2 items-center"}`}>
                    {(player.isPaid === 1) ? (
                      <input
                        className="outline-none bg-secondary-white px-3 py-1 rounded-md cursor-default text-black w-[17rem]"
                        name={`player-${index}-email`}
                        id={`player-${index}-email`}
                        autoComplete={`section-player-${index} email`}
                        type="email"
                        value={player.email}
                        readOnly
                        disabled // optional if you want to gray it out
                        title={player.email}
                      />
                    ) : (
                      <input
                        className="outline-none bg-secondary-white focus:outline-white px-3 py-1 rounded-md w-[17rem]"
                        name={`player-${index}-email`}
                        id={`player-${index}-email`}
                        autoComplete={`section-player-${index} email`}
                        type="email"
                        placeholder="Enter the email"
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        value={player.email}
                      />
                    )}

                    {(selectedOption === "equalSplit" || player.isPaid === 1) ? (
                      <p className="px-2 min-w-[80px] text-center">
                        ${(Number(player.amount) || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    ) : (
                      <div className="flex items-center">
                        <span className="px-1 text-sm text-black">$</span>
                        <input
                          className="bg-secondary-white outline-none focus:outline-white px-2 py-1 rounded-md w-20 text-center"
                          type="text"
                          placeholder="Enter the Amount"
                          value={player.amount}
                          onChange={(e) => {
                            const addedValue = e.target.value;
                            handleAmountChange(index, addedValue);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 2: Button + Paid/Icons */}
                  <div className={`w-full flex ${isMobile ? "flex-row justify-between items-center" : "items-center"} gap-2 mt-1`}>
                    {player.isPaid === 1 ? (
                      <div className="flex items-center gap-2" style={{
                        marginLeft: isMobile ? "2.188rem" : "2.188rem"
                      }}>
                        <p>Paid</p>
                        <CheckedIcon color="green" />
                      </div>
                    ) : player.isPaid === 0 && player.isActive === 1 ? (
                      <FilledButton
                        onClick={() => resendHyperSwitchPaymentLinkOnEmail(index)}
                        className={`text-sm flex justify-center items-center ${!player.isLinkExpired ? "text-white/50 cursor-not-allowed" : "text-white"}`}
                        disabled={loadingStates[index] || !player.isLinkExpired}
                      >
                        {loadingStates[index] ? (
                          <Loader size={20} color="fill-white-600" />
                        ) : (
                          "Resend"
                        )}
                      </FilledButton>
                    ) : (
                      <FilledButton
                        onClick={() => handleEmailSendOnHyperSwitchPaymentLink(index)}
                        className={`text-sm flex justify-center items-center ${isValidEmail(player.email ?? "") && player.isActive !== 1 ? "text-white" : "text-white/50 cursor-not-allowed"} ${isMobile ? "" : "mr-16"}`}
                        disabled={loadingStates[index] || !isValidEmail(player.email ?? "")}
                      >
                        {loadingStates[index] ? (
                          <Loader size={20} color="fill-white-600" />
                        ) : (
                          "Send"
                        )}
                      </FilledButton>
                    )}

                    {/* Payment Status Icons */}
                    <div className="flex gap-2 items-center w-full justify-end">
                      {player && player.isActive === 1 && player.isPaid === 0 && !player.isLinkExpired ? (
                        <Tooltip
                          trigger={<Pending width={"1.875rem"} height={"1.875rem"} />}
                          content="Payment is pending"
                        />
                      ) : player?.isLinkExpired && player?.isPaid === 0 ? (
                        <Tooltip
                          trigger={<LinkExpired width={"1.875rem"} height={"1.875rem"} color="#D22B2B" />}
                          content="Payment link is expired"
                        />
                      ) : null}

                      {player?.emailOpened === 1 ? (
                        <Tooltip
                          trigger={<EmailOpen width={"1.875rem"} height={"1.875rem"} color="green" />}
                          content="Email opened and read"
                        />
                      ) : player?.emailOpened === 0 && player?.isActive === 1 && player.isPaid === 0 ? (
                        <Tooltip
                          trigger={<Email width={"1.875rem"} height={"1.875rem"} />}
                          content="Email has not been read"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3">
              <div className="w-full flex justify-between px-3 pt-5">
                <div className="text-base flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray">Total Amount Requested</h4>
                  <Tooltip
                    trigger={<Info className="h-[0.875rem] w-[0.875rem]" />}
                    content={<div className="max-w-[18.75rem] text-sm break-words">The total amount you will be requesting when you click the Send button.</div>}
                  />
                </div>
                <div>
                  <p className="text-base font-[500] text-primary-gray">${Number(totalAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3" >
                <div className="text-base flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray" >Payment Processor Fees</h4>
                  <Tooltip
                    trigger={<Info className="h-[0.875rem] w-[0.875rem]" />}
                    content={<div className="max-w-[18.75rem] text-sm break-words">This is the approximate amount our payment processor collects to facilitate this transaction.</div>}
                  />
                </div>
                <div>
                  <p className="text-primary-gray">
                    {`($${(
                      (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })})`}
                  </p>
                </div>
              </div>
              <div className="w-full flex justify-between px-3 pt-3">
                <div className="text-base flex justify-start gap-2 font-[500] text-black">
                  <h4 className="text-primary-gray">Total Amount Received</h4>
                  <Tooltip
                    trigger={<Info className="h-[0.875rem] w-[0.875rem]" />}
                    content={<div className="max-w-[18.75rem] text-sm break-words">The total amount that you have received so far. This amount should be available for you to withdraw. Go to Account Settings to withdraw this amount if you haven’t withdrawn.</div>}
                  />
                </div>
                <div>
                  <p className="text-base font-[500] text-primary-gray">${paidAmount}</p>
                </div>
              </div>

              <div className="w-full flex justify-between px-3 pt-3">
                <div className=" text-base flex justify-start gap-2 font-[500]">
                  <h4 className="text-primary-gray" >Your Payout</h4>
                  <Tooltip
                    trigger={<Info className="h-[0.875rem] w-[0.875rem]" />}
                    content={<div className="max-w-[18.75rem] text-sm break-words">The amount you will receive from your players after fees.</div>}
                  />
                </div>
                <div>
                  <p className="text-base font-[500] text-primary-gray">
                    ${(
                      totalAmount - (Number(paymentProcessingCharge) / 100) * (Number(availableSlots) - 1)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              {/* 

             */}
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
      <div className="flex gap-4 text-sm">
        <div className="w-[2.5rem] ">
          <Players className="ml-auto w-[1.875rem]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
      <div className="flex gap-4 text-sm">
        <div className="w-[2.5rem]" />
        <div>
          <p className="font-light">
            You purchased for{" "}
            <span className="font-semibold">{formatMoney(purchasedFor ?? 0)}</span>
          </p>
          {/* <p className="font-light">
            {" "}
            Weather guarantee purchased At{" "}
            <span className="font-semibold">
              ${(weatherGuaranteeAmount ?? 0) / 100}
            </span>{" "}
          </p> */}
        </div>
      </div>
    </div>
  );
};





