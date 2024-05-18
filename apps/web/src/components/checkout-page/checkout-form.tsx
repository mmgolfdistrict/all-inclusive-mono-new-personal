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
import type { CartProduct } from "~/utils/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { CharitySelect } from "../input/charity-select";
import { Input } from "../input/input";
import styles from "./checkout.module.css";

export const CheckoutForm = ({
  isBuyNowAuction,
  teeTimeId,
  cartData,
  cartId,
  teeTimeDate,
  listingId,
}: {
  isBuyNowAuction: boolean;
  teeTimeId: string;
  cartData: CartProduct[];
  cartId: string;
  teeTimeDate: string | undefined;
  listingId: string;
}) => {
  const MAX_CHARITY_AMOUNT = 1000;
  const { course } = useCourseContext();
  const { user } = useUserContext();
  const auditLog = api.webhooks.auditLog.useMutation();
  const cancelHyperswitchPaymentById =
    api.webhooks.cancelHyperswitchPaymentById.useMutation();

  const { refetch: refetchCheckTeeTime, data: isTeeTimeStillListed } =
    api.teeBox.checkIfTeeTimeStillListedByListingId.useQuery(
      {
        listingId: listingId,
      },
      {
        enabled: false,
      }
    );

  const logAudit = async () => {
    await auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: teeTimeId,
      bookingId: "",
      listingId: listingId,
      eventId: "TEE_TIME_PURCHASED",
      json: `TEE_TIME_PURCHASED`,
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
  };
  const hyper = useHyper();
  const widgets = useWidgets();

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  // const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [charityAmountError, setCharityAmountError] = useState("");

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
  } = useCheckoutContext();

  const reserveBookingApi = api.teeBox.reserveBooking.useMutation();
  const reserveSecondHandBookingApi =
    api.teeBox.reserveSecondHandBooking.useMutation();

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void logAudit();
    if (listingId.length) {
      const isTeeTimeAvailable = await refetchCheckTeeTime();
      if (!isTeeTimeAvailable.data) {
        toast.error("Oops! Tee time is not available anymore");
        return;
      }
      console.log(isTeeTimeAvailable.data);
    }

    if (message === "Payment Successful") return;
    e.preventDefault();
    if (
      selectedCharity &&
      (!selectedCharityAmount || selectedCharityAmount === 0)
    ) {
      setCharityAmountError("Charity amount cannot be empty or zero");
      return;
    }
    if (selectedCharityAmount && selectedCharityAmount > MAX_CHARITY_AMOUNT) {
      return;
    }
    setCharityAmountError("");
    setIsLoading(true);

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
          void cancelHyperswitchPaymentById.mutateAsync({
            paymentId: response?.payment_id as string,
          });
          setMessage(
            getErrorMessageById((response?.error_code ?? "") as string)
          );
        } else if (response.status === "succeeded") {
          let bookingResponse = {
            bookingId: "",
            providerBookingId: "",
            status: "",
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
              return;
            }
          }

          setMessage("Payment Successful");
          if (isBuyNowAuction) {
            router.push(`/${course?.id}/auctions/confirmation`);
          } else {
            router.push(
              `/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}`
            );
          }
        } else if (response.error) {
          setMessage(response.error.message as string);
        } else {
          setMessage(
            getErrorMessageById((response?.error_code ?? "") as string)
          );
        }
      }
    } catch (error) {
      setMessage("An unexpected error occurred: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reserveBookingFirstHand = async (
    cartId: string,
    payment_id: string,
    sensibleQuoteId: string
  ) => {
    const bookingResponse = await reserveBookingApi.mutateAsync({
      cartId,
      payment_id,
      sensibleQuoteId,
    });
    return bookingResponse;
  };

  const reserveSecondHandBooking = async (
    cartId: string,
    listingId: string,
    payment_id: string
  ) => {
    const bookingResponse = await reserveSecondHandBookingApi.mutateAsync({
      cartId,
      listingId,
      payment_id,
    });
    // console.log(bookingResponse);
    return bookingResponse;
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <UnifiedCheckout id="unified-checkout" options={unifiedCheckoutOptions} />
      <div className="flex w-full flex-col gap-2 bg-white p-4 rounded-lg my-2">
        {course?.supportCharity ? (
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
                      .replace("$", "")
                      .replaceAll(",", "");

                    if (Number(value) < 0) return;

                    const decimals = value.split(".")[1];
                    if (decimals) return;

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
            {isBuyNowAuction ? null : ` (1 item)`}
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
            {(
              taxCharge +
              sensibleCharge +
              charityCharge +
              convenienceCharge
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <div>Total</div>
          <div>
            $
            {(
              primaryGreenFeeCharge +
              taxCharge +
              sensibleCharge +
              charityCharge +
              convenienceCharge
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>

      <FilledButton
        className={`w-full rounded-full`}
        disabled={
          isLoading || !hyper || !widgets || message === "Payment Successful"
        }
        data-testid="pay-now-id"
      >
        {isLoading ? "Processing..." : <>Pay Now</>}
      </FilledButton>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={styles.paymentMessage}>
          {message === "Payment Successful" ? (
            <span>Payment Successful</span>
          ) : (
            <span className="!text-red">
              An error occurred processing payment.
            </span>
          )}
        </div>
      )}
    </form>
  );
};
