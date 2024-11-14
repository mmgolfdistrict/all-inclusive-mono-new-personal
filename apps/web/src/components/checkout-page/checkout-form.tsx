/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { getErrorMessageById } from "@golf-district/shared/src/hyperSwitchErrorCodes";
import {
  UnifiedCheckout,
  useHyper,
  useWidgets,
} from "@juspay-tech/react-hyper-js";
import { LoadingContainer } from "~/app/[course]/loader";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import type { CartProduct, MaxReservationResponse } from "~/utils/types";
import { useParams, useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { number } from "zod";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { CharitySelect } from "../input/charity-select";
import { Input } from "../input/input";
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
  const MAX_CHARITY_AMOUNT = 1000;
  const { course } = useCourseContext();
  const params = useParams();
  const courseId = course?.id;
  const roundUpCharityId = course?.roundUpCharityId;

  const { user } = useUserContext();
  const auditLog = api.webhooks.auditLog.useMutation();
  const sendEmailForFailedPayment =
    api.webhooks.sendEmailForFailedPayment.useMutation();

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
  const taxCharge =
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

  const unifiedCheckoutOptions = {
    wallets: {
      walletReturnUrl: isBuyNowAuction
        ? `${window.location.origin}/${course?.id}/auctions/confirmation`
        : `${window.location.origin}/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}`,
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
  const [noThanks, setNoThanks] = useState(false);
  const [isBookingCoursesDisabled, setIsBookingCoursesDisabled] =
    useState(false);
  const [charityData, setCharityData] = useState<charityData | undefined>({
    charityDescription: "",
    charityId: "",
    charityLogo: "",
    charityName: "",
  });
  // const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [charityAmountError, setCharityAmountError] = useState("");
  const [customerID, setCustomerID] = useState("");
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
    courseId: params?.course as string ?? "",
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
          console.log(
            createCustomerResponse.data?.data,
            "New customer created"
          );
        }
        console.log(
          retrieveCustomerResponse.data?.data,
          "created customer created"
        );
        setCustomerID(retrieveCustomerResponse.data?.data);
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
    if(checkIsBookingDisabled?.isBookingDisabled == 1){
      e.preventDefault();
      toast.error("Due some issue currently Booking are unavailable for this course");
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
          : `${window.location.origin}/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}`,
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
      redirectHref,
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
      redirectHref,
    });
    return bookingResponse;
  };

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

  const handleDonateChange = (event) => {
    const value = event.target.value.trim() as string;
    const numericValue = value.length > 0 ? parseFloat(value) : 0;
    setNoThanks(false);

    if (!numericValue || numericValue === 0) {
      setDonateValue(event?.target?.value as number);
      setDonateError(true);
    } else if (numericValue < 1) {
      setDonateError(true);
    } else {
      setDonateError(false);
      setDonateValue(numericValue);
      handleSelectedCharityAmount(Number(numericValue));
    }
  };

  const TaxCharge =
    taxCharge +
    sensibleCharge +
    (!roundUpCharityId ? charityCharge : 0) +
    convenienceCharge;

  const roundOff = Math.ceil(primaryGreenFeeCharge + TaxCharge);
  const handleRoundOff = () => {
    setShowTextField(false);
    setNoThanks(false);
    // setRoundOffClick(true);
    const donation = parseFloat(
      (roundOff - (primaryGreenFeeCharge + TaxCharge)).toFixed(2)
    );
    setDonateValue(donation);
    handleSelectedCharityAmount(Number(donation));
  };

  useEffect(() => {
    if (roundUpCharityId && roundOffStatus === "roundup") {
      handleRoundOff();
    }
  }, [TaxCharge]);

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
        <div className="flex justify-between">
          <div>
            Subtotal
            {/* {isBuyNowAuction ? null : ` (1 item)`} */}
          </div>

          <div>
            $
            {primaryGreenFeeCharge.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <div>Taxes & Others</div>
          <div>
            $
            {TaxCharge.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        {roundUpCharityId && (
          <div className="flex justify-between">
            <div>Charitable Donation</div>
            <div>
              $
              {(donateValue || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        )}
        <div className="flex justify-between">
          <div>Total</div>
          <div>
            $
            {(
              (roundUpCharityId
                ? roundOffClick
                  ? roundOff
                  : TotalAmt
                : TotalAmt) || 0
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
      {roundUpCharityId && (
        <div className="flex w-full flex-col gap-2 bg-white p-4 rounded-lg my-2 border border-primary">
          <div className="flex items-top">
            {charityData?.charityLogo && (
              <img
                src={`${charityData?.charityLogo}`}
                alt={`${charityData.charityName} logo`}
                className="w-16 h-16 mr-4 rounded-md mt-2"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {charityData?.charityName}
              </h2>
              <p className="text-sm text-gray-600">
                {charityData?.charityDescription}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-5 ml-3 mb-4">
            <button
              type="button"
              className={`flex w-32 items-center justify-center rounded-md p-2 ${
                roundOffStatus === "roundup"
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-primary border-2"
              }`}
              onClick={() => {
                setRoundOffStatus("roundup");
                handleRoundOff();
              }}
            >
              Round Up
            </button>

            <button
              type="button"
              className={`flex w-32 items-center justify-center rounded-md p-2 ${
                roundOffStatus === "other"
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-primary border-2"
              }`}
              onClick={() => {
                setRoundOffClick(false);
                setShowTextField(true);
                setDonateValue(5);
                handleSelectedCharityAmount(5);
                setRoundOffStatus("other");
              }}
            >
              Other
            </button>

            <button
              type="button"
              className={`flex w-32 items-center justify-center rounded-md p-2 ${
                roundOffStatus === "nothanks"
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-primary border-2"
              }`}
              onClick={() => {
                setRoundOffClick(false);
                setShowTextField(false);
                setDonateValue(0);
                handleSelectedCharityAmount(0);
                setNoThanks(true);
                setRoundOffStatus("nothanks");
              }}
            >
              No Thanks
            </button>
          </div>

          {showTextField && (
            <div className="flex flex-col">
              <input
                type="number"
                placeholder="Enter Donation Amount"
                value={donateValue}
                onChange={handleDonateChange}
                className={`p-2 border rounded-md ${
                  donateError ? "border-red" : "border-primary"
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
            disabled={
              !hyper || !widgets || callingRef
            }
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
