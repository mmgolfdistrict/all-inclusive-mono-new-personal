/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { getErrorMessageById } from "@golf-district/shared/src/hyperSwitchErrorCodes";
import {
  UnifiedCheckout,
  useHyper,
  useWidgets,
} from "@juspay-tech/react-hyper-js";
import { LoadingContainer } from "~/app/[course]/loader";
import { useBookingSourceContext } from "~/contexts/BookingSourceContext";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import type { CartProduct } from "~/utils/types";
import { useParams, useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { useMediaQuery } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
import { Switch } from "../buttons/switch";
import { Info } from "../icons/info";
import { CharitySelect } from "../input/charity-select";
import { Input } from "../input/input";
import Skeleton from "../skeleton/skeleton";
import { Tooltip } from "../tooltip";
import { CheckoutAccordionRoot } from "./checkout-accordian";
import CheckoutItemAccordion from "./checkout-item-accordian";
import styles from "./checkout.module.css";
import type { NextAction } from "./hyper-switch";

type charityData = {
  charityDescription: string | undefined;
  charityName: string | undefined;
  charityId: string | undefined;
  charityLogo: string | undefined;
};
export const CheckoutForm = ({
  isBuyNowAuction,
  teeTimeId,
  cartData,
  cartId,
  teeTimeDate,
  listingId,
  nextAction,
  callingRef,
  playerCount,
  roundOffStatus,
  setRoundOffStatus,
}: {
  isBuyNowAuction: boolean;
  teeTimeId: string;
  cartData: CartProduct[];
  cartId: string;
  teeTimeDate: string | undefined;
  listingId: string;
  nextAction?: NextAction;
  callingRef?: boolean;
  playerCount: string | undefined;
  roundOffStatus: string | undefined;
  setRoundOffStatus: Dispatch<SetStateAction<string>>;
}) => {
  console.log("cart-data", cartData);
  const MAX_CHARITY_AMOUNT = 1000;
  const { course } = useCourseContext();
  const { shouldAddSensible, validatePlayers, handleShouldAddSensible } =
    useCheckoutContext();
  const params = useParams();
  const courseId = course?.id;
  const roundUpCharityId = course?.roundUpCharityId;
  const [isExpanded, setIsExpanded] = useState(false);
  const [TotalAmount, setTotalAmount] = useState("");
  const [isLoadingTotalAmount, setIsLoadingTotalAmount] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [needRentals, setNeedRentals] = useState(false);
  const cartDataRef = useRef(cartData);
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const { user } = useUserContext();
  const { bookingSource, setBookingSource } = useBookingSourceContext();
  const auditLog = api.webhooks.auditLog.useMutation();
  const sendEmailForFailedPayment =
    api.webhooks.sendEmailForFailedPayment.useMutation();

  const sendEmailForBookingFailedByTimeout =
    api.webhooks.sendEmailForBookingFailedByTimeout.useMutation();

  const { refetch: refetchCheckTeeTime } =
    api.teeBox.checkIfTeeTimeStillListedByListingId.useQuery(
      {
        listingId: listingId,
      },
      {
        enabled: false,
      }
    );

  const { refetch: refetchGetSupportedCharities } =
    api.course.getSupportedCharitiesForCourseId.useQuery(
      {
        courseId: course?.id ?? "",
      },
      {
        enabled: false,
      }
    );

  const checkIfTeeTimeAvailableOnProvider =
    api.teeBox.checkIfTeeTimeAvailableOnProvider.useMutation();

  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: teeTimeId,
      bookingId: "",
      listingId: listingId,
      courseId,
      eventId: "TEE_TIME_PAY_NOW_CLICKED",
      json: `TEE_TIME_PAY_NOW_CLICKED`,
    });
  };

  let primaryGreenFeeCharge = 0;

  const isFirstHand = cartData?.filter(
    ({ product_data }) => product_data.metadata.type === "first_hand"
  );
  if (isFirstHand.length) {
    primaryGreenFeeCharge =
      isFirstHand?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    console.log("primaryGreenFeeCharge ---", primaryGreenFeeCharge);
  } else {
    primaryGreenFeeCharge =
      cartData
        ?.filter(
          ({ product_data }) => product_data.metadata.type === "second_hand"
        )
        ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  }

  // const secondaryGreenFeeCharge = cartData?.filter(({ product_data }) => product_data.metadata.type === "second_hand")?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const convenienceCharge =
    cartData
      ?.filter(
        ({ product_data }) => product_data.metadata.type === "convenience_fee"
      )
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  let taxCharge =
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type === "taxes")
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

  const sensibleCharge =
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type === "sensible")
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

  const charityCharge =
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type === "charity")
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const cartFeeCharge =
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type === "cart_fee")
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

  const greenFeeTaxPercent =
    cartData
      ?.filter(
        ({ product_data }) =>
          product_data.metadata.type === "greenFeeTaxPercent"
      )
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const cartFeeTaxPercent =
    cartData
      ?.filter(
        ({ product_data }) => product_data.metadata.type === "cartFeeTaxPercent"
      )
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const weatherGuaranteeTaxPercent =
    cartData
      ?.filter(
        ({ product_data }) =>
          product_data.metadata.type === "weatherGuaranteeTaxPercent"
      )
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const markupFee =
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type === "markup")
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

  const markupTaxPercent =
    cartData
      ?.filter(
        ({ product_data }) => product_data.metadata.type === "markupTaxPercent"
      )
      ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

  // const cartFeeCharge =
  //   cartData
  //     ?.filter(({ product_data }) => product_data.metadata.type === "cart_fee");

  const unifiedCheckoutOptions = {
    wallets: {
      walletReturnUrl: isBuyNowAuction
        ? `${window.location.origin}/${course?.id}/auctions/confirmation`
        : `${window.location.origin}/${course?.id}/checkout/processing?teeTimeId=${teeTimeId}&cart_id=${cartId}&listing_id=${listingId}&need_rentals=${needRentals}`,
      applePay: "auto",
      googlePay: "auto",
    },
    paymentMethodOrder: ["card", "google_pay", "apple_pay"],
    billingAddress: {
      isUseBillingAddress: true,
      usePrefilledValues: "never", // or "auto",
    },
    branding: "never",
    hideExpiredPaymentMethods: true,
    displaySavedPaymentMethodsCheckbox: false,
  };
  const hyper = useHyper();
  const widgets = useWidgets();

  const router = useRouter();
  const [donateValue, setDonateValue] = useState(5);
  const [roundOffClick, setRoundOffClick] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showTextField, setShowTextField] = useState(false);
  const [donateError, setDonateError] = useState(false);
  const [otherDonateValue, setOtherDonateValue] = useState(5);
  // const [noThanks, setNoThanks] = useState(false);
  const [charityData, setCharityData] = useState<charityData | undefined>({
    charityDescription: "",
    charityId: "",
    charityLogo: "",
    charityName: "",
  });
  // const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [charityAmountError, setCharityAmountError] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");

  // const [customerID, setCustomerID] = useState("");
  const {
    promoCode,
    handlePromoCode,
    selectedCharity,
    selectedCharityAmount,
    handleSelectedCharity,
    handleSelectedCharityAmount,
    handleRemoveSelectedCharity,
    setReservationData,
    sensibleData,
    amountOfPlayers,
  } = useCheckoutContext();

  const reserveBookingApi = api.teeBox.reserveBooking.useMutation();
  const reserveSecondHandBookingApi =
    api.teeBox.reserveSecondHandBooking.useMutation();
  const { data: checkIsBookingDisabled } = api.course.getCourseById.useQuery({
    courseId: (params?.course as string) ?? "",
  });
  const { data: multipleTransaction } =
    api.checkout.checkMultipleTeeTimeTransactionByUser.useQuery({});
  console.log("multipleTransaction", multipleTransaction);
  const { refetch: createCustomerInHyperSwitchHandler } =
    api.checkout.createCustomerForHyperSwitch.useQuery(
      {},
      {
        enabled: false,
      }
    );
  const { refetch: retrieveCustomerHandler } =
    api.checkout.retrieveCustomerDataByCustomer_ID.useQuery(
      {},
      {
        enabled: false,
      }
    );
  const fetchData = async () => {
    try {
      const retrieveCustomerResponse = await retrieveCustomerHandler();
      if (retrieveCustomerResponse.data?.error) {
        const createCustomerResponse =
          await createCustomerInHyperSwitchHandler();

        if (createCustomerResponse.data?.error) {
          console.log(
            createCustomerResponse.data?.message,
            "createCustomerForHyperSwitch"
          );
        }
      }
      console.log(
        retrieveCustomerResponse.data?.data,
        "created customer created"
      );
      // setCustomerID(retrieveCustomerResponse.data?.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    void fetchData();
  }, []);

  const handlePaymentStatus = (status: string) => {
    switch (status) {
      case "succeeded":
        setMessage("Successful");
        break;
      case "processing":
        setMessage("Your payment is processing.");
        break;
      case "requires_payment_method":
        setMessage("Your payment was not successful, please try again.");
        break;
      case "":
        break;
      default:
        setMessage("Something went wrong.");
        break;
    }
  };

  useEffect(() => {
    if (!hyper) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    hyper.retrievePaymentIntent(clientSecret).then((resp) => {
      const status = resp?.paymentIntent?.status;
      if (status) {
        handlePaymentStatus(resp?.paymentIntent?.status as string);
      }
    });
  });
  // useEffect(() => {
  //   if (checkIsBookingDisabled?.isBookingDisabled == 1) {
  //     setIsBookingCoursesDisabled(true);
  //     toast.error(
  //       "Due some issue currently Booking are unavailable for this course"
  //     );
  //   }
  // }, []);
  const CharityData = async () => {
    const result = await refetchGetSupportedCharities();
    const charities = result.data;
    if (Array.isArray(charities)) {
      const Charity = charities?.find(
        (charity) => charity?.charityId === roundUpCharityId
      );
      setCharityData(Charity as charityData);
      handleSelectedCharity(Charity?.charityId ?? "");
    }
  };

  useEffect(() => {
    void CharityData();
    const timer = setTimeout(function () {
      router.push(`/${courseId}`);
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, []);

  const { data: maxReservation } =
    api.checkout.checkMaxReservationsAndMaxRounds.useQuery({
      roundsToBook: amountOfPlayers,
      courseId: courseId ? courseId : "",
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    if (checkIsBookingDisabled?.isBookingDisabled == 1) {
      e.preventDefault();
      toast.error(
        "Due some issue currently Booking are unavailable for this course"
      );
      return;
    }
    googleAnalyticsEvent({
      action: `PAY NOW CLICKED`,
      category: "TEE TIME PURCHASE",
      label: "User clicked on pay now to do payment",
      value: "",
    });
    e.preventDefault();
    void logAudit();
    setIsLoading(true);
    if (!maxReservation?.success) {
      // toast.error(maxReservation?.message);
      setIsLoading(false);
      setMessage(maxReservation?.message ?? "");
      return;
    }

    if (listingId.length) {
      const isTeeTimeAvailable = await refetchCheckTeeTime();
      if (!isTeeTimeAvailable.data) {
        toast.error("Oops! Tee time is not available anymore");
        setIsLoading(false);
        return;
      }
    } else {
      const resp = await checkIfTeeTimeAvailableOnProvider.mutateAsync({
        teeTimeId,
        golfersCount: Number(playerCount ?? 0),
      });

      if (!resp) {
        toast.error("Oops! Tee time is not available anymore");
        setIsLoading(false);
        return;
      }
    }

    if (message === "Payment Successful") {
      setIsLoading(false);
      return;
    }
    e.preventDefault();
    if (
      selectedCharity &&
      !roundUpCharityId &&
      (!selectedCharityAmount || selectedCharityAmount === 0)
    ) {
      setCharityAmountError("Charity amount cannot be empty or zero");
      setIsLoading(false);
      return;
    }
    if (selectedCharityAmount && selectedCharityAmount > MAX_CHARITY_AMOUNT) {
      setIsLoading(false);
      return;
    }
    setCharityAmountError("");

    const response = await hyper.confirmPayment({
      widgets,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: isBuyNowAuction
          ? `${window.location.origin}/${course?.id}/auctions/confirmation`
          : `${window.location.origin}/${course?.id}/checkout/processing?teeTimeId=${teeTimeId}&cart_id=${cartId}&listing_id=${listingId}&need_rentals=${needRentals}`,
      },
      redirect: "if_required",
    });

    try {
      if (response) {
        if (response.status === "processing") {
          void sendEmailForFailedPayment.mutateAsync({
            paymentId: response?.payment_id as string,
            teeTimeId: teeTimeId,
            cartId: cartId,
            userId: user?.id,
            email: user?.email,
            listingId: listingId,
            courseId: courseId!,
          });
          setMessage(
            getErrorMessageById((response?.error_code ?? "") as string)
          );
          setIsLoading(false);
        } else if (response.status === "succeeded") {
          let bookingResponse = {
            bookingId: "",
            providerBookingId: "",
            status: "",
            isEmailSend: false,
          };

          if (isFirstHand.length) {
            try {
              bookingResponse = await reserveBookingFirstHand(
                cartId,
                response?.payment_id as string,
                sensibleData?.id ?? ""
              );
              setReservationData({
                golfReservationId: bookingResponse.bookingId,
                providerReservationId: bookingResponse.providerBookingId,
                playTime: teeTimeDate || "",
              });
            } catch (error) {
              if (
                error?.meta?.response &&
                !Object.keys(error.meta.response).length &&
                error.name === "TRPCClientError"
              ) {
                void sendEmailForBookingFailedByTimeout.mutateAsync({
                  paymentId: response?.payment_id as string,
                  teeTimeId: teeTimeId,
                  cartId: cartId,
                  userId: user?.id ?? "",
                  courseId: courseId!,
                  sensibleQuoteId: sensibleData?.id ?? "",
                });

                await auditLog.mutateAsync({
                  userId: user?.id ?? "",
                  teeTimeId: teeTimeId,
                  bookingId: "",
                  listingId: listingId,
                  courseId,
                  eventId: "Vercel function timedout",
                  json: `Vercel function timedout`,
                });
              }

              setMessage(
                "Error reserving first hand booking: " + error.message
              );
              setIsLoading(false);
              return;
            }
          } else {
            try {
              bookingResponse = await reserveSecondHandBooking(
                cartId,
                listingId,
                response?.payment_id as string
              );
            } catch (error) {
              setMessage(
                "Error reserving second hand booking: " + error.message
              );
              setIsLoading(false);
              return;
            }
          }

          setMessage("Payment Successful");
          setBookingSource("");
          sessionStorage.removeItem("source");
          if (isBuyNowAuction) {
            router.push(`/${course?.id}/auctions/confirmation`);
          } else {
            router.push(
              `/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}&isEmailSend=${bookingResponse.isEmailSend}`
            );
          }
        } else if (response.status === "failed") {
          setMessage(
            getErrorMessageById((response?.error_code ?? "") as string)
          );
          setIsLoading(false);
        } else {
          setMessage(
            getErrorMessageById((response?.error_code ?? "") as string)
          );
        }
      }
    } catch (error) {
      setMessage("An unexpected error occurred: " + error.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const reserveBookingFirstHand = async (
    cartId: string,
    payment_id: string,
    sensibleQuoteId: string
  ) => {
    const href = window.location.href;
    const redirectHref = href.split("/checkout")[0] || "";

    const bookingResponse = await reserveBookingApi.mutateAsync({
      cartId,
      payment_id,
      sensibleQuoteId,
      source: bookingSource ? bookingSource : sessionStorage.getItem("source") ?? "",
      additionalNoteFromUser: validatePlayers[0]?.courseMemberShipId
        ? `There are ${validatePlayers.length} players participating in membership program \n Total Amount Paid:$${TotalAmt} \n with courseMembershipID:${validatePlayers[0]?.courseMemberShipId}`
        : additionalNote,
      needRentals,
      redirectHref,
      courseMembershipId: validatePlayers[0]?.courseMemberShipId ?? "",
      playerCountForMemberShip: playerCount ?? "",
      providerCourseMembershipId: validatePlayers[0]?.providerCourseMembershipId ?? "",
    });
    return bookingResponse;
  };

  const reserveSecondHandBooking = async (
    cartId: string,
    listingId: string,
    payment_id: string
  ) => {
    const href = window.location.href;
    const redirectHref = href.split("/checkout")[0] || "";

    const bookingResponse = await reserveSecondHandBookingApi.mutateAsync({
      cartId,
      listingId,
      payment_id,
      source: bookingSource
        ? bookingSource
        : sessionStorage.getItem("source") ?? "",
      additionalNoteFromUser: additionalNote,
      needRentals,
      redirectHref,
    });
    return bookingResponse;
  };

  const handleDonateChange = (event) => {
    const value = event.target.value.trim() as string;
    const numericValue = parseFloat(value);
    // setNoThanks(false);
    // const numericValue = value.length > 0 ? parseFloat(value) : 0;
    if (!numericValue || numericValue === 0) {
      setOtherDonateValue(event?.target?.value as number);
      setDonateError(true);
    } else if (numericValue < 1) {
      setDonateError(true);
    } else {
      setDonateError(false);
      setOtherDonateValue(numericValue);
      handleSelectedCharityAmount(Number(numericValue));
    }
    setDonateValue(numericValue);
  };

  const playersInNumber = Number(amountOfPlayers - validatePlayers.length || 0);
  const greenFeeChargePerPlayer =
    playersInNumber && playersInNumber > 0
      ? primaryGreenFeeCharge / playersInNumber - cartFeeCharge - markupFee
      : 0;
  const greenFeeTaxAmount =
    greenFeeChargePerPlayer * greenFeeTaxPercent * playersInNumber;
  const cartFeeTaxAmount = cartFeeCharge * cartFeeTaxPercent * playersInNumber;
  const markupFeesTaxAmount = markupFee * markupTaxPercent * playersInNumber;
  const weatherGuaranteeTaxAmount = sensibleCharge * weatherGuaranteeTaxPercent;

  const additionalTaxes =
    (greenFeeTaxAmount +
      markupFeesTaxAmount +
      weatherGuaranteeTaxAmount +
      cartFeeTaxAmount) /
    100;
  taxCharge += additionalTaxes;
  const Total =
    primaryGreenFeeCharge +
    taxCharge +
    sensibleCharge +
    (!roundUpCharityId ? charityCharge : 0) +
    convenienceCharge +
    (!roundUpCharityId ? 0 : Number(donateValue));

  const TotalAmt = Total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /**==============UI CALCULATION Variables==================== */
  const totalGreenFeesPerPlayer =
    (greenFeeChargePerPlayer + markupFee) * playersInNumber;
  const totalCartFeePerPlayer = cartFeeCharge * playersInNumber;
  /**================================== */
  const TaxCharge =
    taxCharge +
    sensibleCharge +
    (!roundUpCharityId ? charityCharge : 0) +
    convenienceCharge;
  const totalBeforeRoundOff = primaryGreenFeeCharge + TaxCharge;
  const decimalPart = totalBeforeRoundOff % 1;
  const [hasUserSelectedDonation, setHasUserSelectedDonation] = useState(false);

  const roundOff =
    decimalPart === 0 || decimalPart.toFixed(2) === "0.00"
      ? Math.ceil(totalBeforeRoundOff) + 1
      : Math.ceil(totalBeforeRoundOff);

  useEffect(() => {
    let donation;
    if (decimalPart === 0) {
      donation = 1;
    } else if (decimalPart.toFixed(2) === "0.00") {
      donation = 1;
    } else if (roundOffStatus === "nothanks") {
      donation = 0;
    } else if (roundOffStatus === "other") {
      donation = otherDonateValue;
    } else {
      donation = parseFloat(
        (Math.ceil(totalBeforeRoundOff) - totalBeforeRoundOff).toFixed(2)
      );
    }
    setDonateValue(donation);
  }, [Total, primaryGreenFeeCharge, totalBeforeRoundOff]);

  const handleRoundOff = (value: any, status: any) => {
    let donation;
    switch (status) {
      case "roundup":
        setShowTextField(false);
        setRoundOffStatus("roundup");
        donation =
          decimalPart === 0
            ? 1
            : parseFloat(
              (Math.ceil(totalBeforeRoundOff) - totalBeforeRoundOff).toFixed(
                2
              )
            );
        break;

      case "other":
        setShowTextField(true);
        donation = value;
        break;

      default:
        setShowTextField(false);
        donation = value;
        break;
    }
    setDonateValue(donation);
    setRoundOffStatus(status);
    handleSelectedCharityAmount(Number(donation));
  };

  useEffect(() => {
    if (roundUpCharityId) handleRoundOff(donateValue, roundOffStatus);
  }, [TaxCharge, roundUpCharityId, roundOffStatus]);

  useEffect(() => {
    if (!hasUserSelectedDonation) {
      if (primaryGreenFeeCharge <= 200) {
        // setDonateValue(
        //   Math.ceil(primaryGreenFeeCharge) - primaryGreenFeeCharge
        // );
        let donation;
        if (decimalPart === 0) {
          donation = 1;
        } else if (decimalPart.toFixed(2) === "0.00") {
          donation = 1;
        } else {
          donation = parseFloat(
            (Math.ceil(primaryGreenFeeCharge) - primaryGreenFeeCharge).toFixed(
              2
            )
          );
        }

        setDonateValue(donation);
        setRoundOffStatus("roundup");
      } else if (primaryGreenFeeCharge >= 201 && primaryGreenFeeCharge <= 500) {
        console.log("donation 1");
        setDonateValue(2);
        setRoundOffStatus("twoDollars");
      } else {
        console.log("donation 2");
        setDonateValue(5);
        setRoundOffStatus("fiveDollars");
      }
    }
  }, [totalBeforeRoundOff]);
  useEffect(() => {
    setIsLoadingTotalAmount(true);
    setTimeout(() => {
      setIsLoadingTotalAmount(false);
    }, 700);
  }, [TotalAmt]);
  // useEffect(() => {
  //   if (Number(TotalAmt) == 0.01) {
  //     handleShouldAddSensible(false);
  //   }
  // }, [TotalAmt]);

  return (
    <form onSubmit={handleSubmit} className="">
      <UnifiedCheckout id="unified-checkout" options={unifiedCheckoutOptions} />
      <div className="flex w-full flex-col gap-2 bg-white p-4 rounded-lg my-2">
        {course?.supportCharity && !roundUpCharityId ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div>Charitable Donations</div>
              {selectedCharity ? (
                <button
                  onClick={handleRemoveSelectedCharity}
                  className="text-[12px] self-end p-1 border rounded-md w-fit bg-error-stroke text-white"
                >
                  Remove Charitable Donation
                </button>
              ) : null}
            </div>
            <CharitySelect
              value={selectedCharity}
              values={course?.supportedCharities}
              setValue={handleSelectedCharity}
            />
            {selectedCharity ? (
              <div className="relative">
                <div className="text-gray-500 text-[14px] absolute left-[.35rem] top-[2.3rem]">
                  $
                </div>
                <Input
                  label="Donation Amount"
                  type="number"
                  value={String(selectedCharityAmount)}
                  name="donation-amount"
                  onChange={(e) => {
                    setCharityAmountError("");
                    const value = e.target.value
                      .replace(/\$/g, "")
                      .replace(/,/g, "");

                    if (Number(value) < 0) return;

                    // const decimals = value.split(".")[1];
                    // if (decimals) return;

                    if (Number(value) > MAX_CHARITY_AMOUNT) {
                      setCharityAmountError(
                        "Donation amount exceeds limit of $1000"
                      );
                      if (value.length > MAX_CHARITY_AMOUNT.toString().length)
                        return;
                    }

                    const strippedLeadingZeros = value.replace(/^0+/, "");

                    handleSelectedCharityAmount(Number(strippedLeadingZeros));
                  }}
                  placeholder="Enter charitable donation amount."
                  register={() => undefined}
                  error={charityAmountError}
                  data-testid="donation-amount-id"
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {isBuyNowAuction ? null : course?.supportsPromocode ? (
          <div className={`flex flex-col gap-1`}>
            <label
              className="text-[14px] text-primary-gray"
              htmlFor={"promo-code"}
            >
              Promo code
            </label>
            <input
              id="promo-code"
              className="rounded-lg bg-secondary-white px-4 py-3 text-[14px] text-gray-500 outline-none"
              value={promoCode}
              onChange={(e) => handlePromoCode(e.target.value)}
              placeholder="Enter promo code"
              data-testid="promo-code-input-id"
            />
          </div>
        ) : null}
        <Input
          label="Any Special Requests?"
          register={() => null}
          name="notes"
          maxLength={200}
          placeholder="Message"
          value={additionalNote}
          onChange={(e) => setAdditionalNote(e.target.value)}
        />
        <div className="flex flex-row items-center gap-2">
          <Switch
            value={needRentals}
            setValue={setNeedRentals}
            id="need-rentals"
          />
          <label
            className="text-primary-gray text-[14px] cursor-pointer select-none"
            htmlFor="need-rentals"
          >
            Need Rentals?
          </label>
        </div>
        {checkIsBookingDisabled &&
          checkIsBookingDisabled?.showPricingBreakdown === 0 ? (
          <Fragment>
            <div className="flex justify-between">
              <div>
                Subtotal
                {/* {isBuyNowAuction ? null : ` (1 item)`} */}
              </div>

              <div className="unmask-price">
                $
                {primaryGreenFeeCharge.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="flex justify-between">
              {isLoadingTotalAmount ? (
                <Fragment>
                  <Skeleton />
                </Fragment>
              ) : (
                <Fragment>
                  <div>Taxes & Others</div>
                  <div className="unmask-price">
                    $
                    {(TaxCharge + (donateValue || 0)).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </Fragment>
              )}
            </div>
            <div className="flex justify-between">
              {isLoadingTotalAmount ? (
                <Fragment>
                  <Skeleton />
                </Fragment>
              ) : (
                <Fragment>
                  <div>Total</div>
                  <div className="unmask-price">
                    $
                    {(TotalAmt || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </Fragment>
              )}
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <CheckoutAccordionRoot defaultValue={[]}>
              <CheckoutItemAccordion
                title="Subtotal"
                value="item-1"
                position="left"
                amountValues={`$${primaryGreenFeeCharge.toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}`}
              >
                <div className=" flex flex-col gap-2">
                  <div className="flex justify-between">
                    <div className="px-8">
                      Green Fees{" "}
                      {`($${(
                        greenFeeChargePerPlayer + markupFee
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} * ${playersInNumber})`}{" "}
                    </div>
                    <div className="unmask-price">
                      $
                      {totalGreenFeesPerPlayer.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="px-8">
                      Cart Fees{" "}
                      {`($${cartFeeCharge.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} * ${playersInNumber})`}
                    </div>
                    <div className="unmask-price">
                      $
                      {totalCartFeePerPlayer.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                    </div>
                  </div>
                </div>
              </CheckoutItemAccordion>
              {isLoadingTotalAmount ? (
                <Fragment>
                  <Skeleton />
                </Fragment>
              ) : (
                <CheckoutItemAccordion
                  title="Taxes and Others"
                  value="item-2"
                  position="left"
                  amountValues={`$${TaxCharge.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                >
                  <div className=" flex flex-col gap-1">
                    <div className="flex justify-between">
                      <div className="px-8">
                        Green Fee Tax{" "}
                        {`($${(
                          greenFeeChargePerPlayer + markupFee
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} @ ${greenFeeTaxPercent}% * ${playersInNumber})`}
                      </div>
                      <div className="unmask-price">
                        ${" "}
                        {(
                          (greenFeeTaxAmount + markupFeesTaxAmount) /
                          100
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="px-8">
                        Cart Fee Tax &nbsp;
                        {`($${cartFeeCharge.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} @  ${cartFeeTaxPercent}% * ${playersInNumber})`}
                      </div>
                      <div className="unmask-price">
                        ${" "}
                        {(cartFeeTaxAmount / 100).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    {roundUpCharityId && roundOffStatus !== "nothanks" ? (
                      <div className="flex justify-between">
                        <div className="px-8">Charity Donations</div>
                        <div className="unmask-price">
                          ${" "}
                          {donateValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ) : null}
                    {shouldAddSensible ? (
                      <div className="flex justify-between">
                        <div className="px-8">
                          Sensible {`($${sensibleCharge})`}
                        </div>
                        <div className="unmask-price">
                          ${" "}
                          {sensibleCharge.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ) : null}
                    {shouldAddSensible ? (
                      <div className="flex justify-between">
                        <div className="px-8">
                          Sensible Tax
                          {`($${sensibleCharge.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} @ ${weatherGuaranteeTaxPercent}%)`}
                        </div>
                        <div className="unmask-price">
                          ${" "}
                          {(weatherGuaranteeTaxAmount / 100).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CheckoutItemAccordion>
              )}
              {isLoadingTotalAmount ? (
                <Fragment>
                  <Skeleton />
                </Fragment>
              ) : (
                <Fragment>
                  <div className="flex justify-between px-2">
                    <div className="px-10">Total</div>
                    <div className="unmask-price">
                      $
                      {(
                        (roundUpCharityId
                          ? roundOffClick
                            ? roundOff
                            : Number(TotalAmt)
                          : TotalAmt) || 0
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </Fragment>
              )}
            </CheckoutAccordionRoot>
          </Fragment>
        )}
      </div>
      {roundUpCharityId && (
        <div className="flex w-full flex-col gap-2 bg-white p-4 rounded-lg my-2 border border-primary">
          <div className="flex items-top">
            {charityData?.charityLogo && (
              // eslint-disable-next-line  @next/next/no-img-element
              <img
                src={`${charityData?.charityLogo}`}
                alt={`${charityData.charityName} logo`}
                className="w-16 h-16 mr-4 rounded-md mt-2"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                {charityData?.charityName}
                <Tooltip
                  trigger={<Info className="ml-1 h-[20px] w-[20px]" />}
                  content="Course operator pays a card processing fee and the remaining goes to the course."
                />
              </h2>

              <p className="text-sm text-gray-600">
                {isMobile && !isExpanded
                  ? `${charityData?.charityDescription?.slice(0, 50)}...`
                  : charityData?.charityDescription}
                {isMobile && (
                  <span
                    className="text-xs text-primary cursor-pointer ml-2"
                    onClick={handleToggle}
                  >
                    {isExpanded ? "...Read Less" : "Read More..."}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-5 ml-1 mb-4 items-center">
            <button
              type="button"
              className={`flex w-32 items-center justify-center rounded-md p-2 ${roundOffStatus === "roundup"
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-primary border-2"
                }`}
              onClick={() => {
                handleRoundOff(0, "roundup");
                setHasUserSelectedDonation(true);
              }}
            >
              Round Up
            </button>

            <button
              type="button"
              className={`flex w-20 items-center justify-center rounded-md p-2 ${roundOffStatus === "twoDollars"
                ? "bg-primary text-white"
                : "bg-white text-primary border-primary border-2"
                }`}
              onClick={() => {
                handleRoundOff(2, "twoDollars");
                setHasUserSelectedDonation(true);
              }}
            >
              $2.00
            </button>

            <button
              type="button"
              className={`flex w-20 items-center justify-center rounded-md p-2 ${roundOffStatus === "fiveDollars"
                ? "bg-primary text-white"
                : "bg-white text-primary border-primary border-2"
                }`}
              onClick={() => {
                handleRoundOff(5, "fiveDollars");
                setHasUserSelectedDonation(true);
              }}
            >
              $5.00
            </button>

            <button
              type="button"
              className={`flex w-32 items-center justify-center rounded-md p-2 ${roundOffStatus === "other"
                ? "bg-primary text-white"
                : "bg-white text-primary border-primary border-2"
                }`}
              onClick={() => {
                handleRoundOff(5, "other");
                setHasUserSelectedDonation(true);
              }}
            >
              Other
            </button>

            <div className="flex-1 flex justify-end">
              <button
                type="button"
                className={`text-primary text-xs underline ${roundOffStatus === "nothanks" ? "font-semibold" : ""
                  }`}
                onClick={() => {
                  setRoundOffStatus("nothanks");
                  setDonateValue(0);
                  setShowTextField(false);
                  setHasUserSelectedDonation(true);
                }}
              >
                No Thanks
              </button>
            </div>
          </div>

          {showTextField && (
            <div className="flex flex-col">
              <input
                type="number"
                placeholder="Enter Donation Amount"
                value={donateValue}
                onChange={handleDonateChange}
                className={`p-2 border rounded-md ${donateError ? "border-red" : "border-primary"
                  }`}
                min="1"
                step="1"
              />
              {donateError && (
                <div className="mt-1 text-sm text-red">
                  Donation amount must be more than 0.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!maxReservation?.success && (
        <div className="md:hidden bg-alert-red text-white p-1 pl-2 my-2  w-full rounded">
          {maxReservation?.message}
        </div>
      )}
      {multipleTransaction &&
        (multipleTransaction.data > 1 ? (
          <Fragment>
            <div className="w-full flex text-left p-[5px]">
              <span className="text-sm text-yellow-600">
                We noticed that you have already bought tee times today. Card
                issuers typically flag multiple transactions as suspicious.
                Please consider using a different card if these problems
                persists.
              </span>
            </div>
          </Fragment>
        ) : (
          ""
        ))}
      {nextAction?.type === "redirect_to_url" ? (
        <Fragment>
          <FilledButton
            className={`w-full rounded-full disabled:opacity-60`}
            disabled={!hyper || !widgets || callingRef}
            onClick={() => {
              if (nextAction?.redirect_to_url) {
                window.location.href = nextAction?.redirect_to_url;
              }
            }}
            type="button"
          >
            {isLoading ? "Loading..." : <>Pay Now</>}
          </FilledButton>
        </Fragment>
      ) : (
        <FilledButton
          type="submit"
          className={`w-full rounded-full disabled:opacity-60`}
          disabled={
            isLoading || !hyper || !widgets || message === "Payment Successful"
          }
          data-testid="pay-now-id"
        >
          {isLoading ? "Processing..." : <>Pay Now</>}
        </FilledButton>
      )}
      <LoadingContainer
        isLoading={isLoading}
        title={"Please wait while we process your order."}
        subtitle="Do not close or refresh your browser as this may take up to 60 seconds."
      >
        <div></div>
      </LoadingContainer>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={styles.paymentMessage}>
          {message === "Payment Successful" ? (
            <span>Payment Successful</span>
          ) : (
            <span className="!text-red">{message}</span>
          )}
        </div>
      )}
    </form>
  );
};
