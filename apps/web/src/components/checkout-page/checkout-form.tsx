/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { ReserveTeeTimeResponse } from "@golf-district/shared";
import {
  UnifiedCheckout,
  useHyper,
  useWidgets,
} from "@juspay-tech/react-hyper-js";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import type { CartProduct } from "~/utils/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FilledButton } from "../buttons/filled-button";
import { CharitySelect } from "../input/charity-select";
import { Input } from "../input/input";
import styles from "./checkout.module.css";

export const CheckoutForm = ({
  isBuyNowAuction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  amountToPay,
  teeTimeId,
  cartData,
  cartId,
  teeTimeDate,
  listingId,
}: {
  isBuyNowAuction: boolean;
  amountToPay: number;
  teeTimeId: string;
  cartData: CartProduct[];
  cartId: string;
  teeTimeDate: string | undefined;
  listingId: string;
}) => {
  const { course } = useCourseContext();

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
        handlePaymentStatus(resp?.paymentIntent?.status);
      }
    });
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    if (message === "Payment Successful") return;
    e.preventDefault();
    if (
      selectedCharity &&
      (!selectedCharityAmount || selectedCharityAmount === 0)
    ) {
      setCharityAmountError("Charity amount cannot be empty or zero");
    }
    {
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

      if (response) {
        if (response.status === "succeeded") {
          let bookingResponse: ReserveTeeTimeResponse = {
            bookingId: "",
            providerBookingId: "",
            status: "",
          };
          if (isFirstHand.length) {
            bookingResponse = await reserveBookingFirstHand(
              cartId,
              response?.payment_id
            );
            setReservationData({
              golfReservationId: bookingResponse.bookingId,
              providerReservationId: bookingResponse.providerBookingId,
              playTime: teeTimeDate || "",
            });
          } else {
            bookingResponse = await reserveSecondHandBooking(
              cartId,
              listingId,
              response?.payment_id
            );
          }
          setMessage("Payment Successful");
          isBuyNowAuction
            ? router.push(`/${course?.id}/auctions/confirmation`)
            : router.push(
                `/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}`
              );
          setIsLoading(false);
        } else if (response.error) {
          setMessage(response.error.message);
          setIsLoading(false);
        } else {
          setMessage("An unexpected error occurred.");
          setIsLoading(false);
        }

        // setIsPaymentCompleted(true);
      } else {
        setIsLoading(false);
      }
    }
  };

  const reserveBookingFirstHand = async (
    cartId: string,
    payment_id: string
  ) => {
    const bookingResponse = await reserveBookingApi.mutateAsync({
      cartId,
      payment_id,
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
              <div>Support a Charity</div>
              {selectedCharity ? (
                <button
                  onClick={handleRemoveSelectedCharity}
                  className="text-[12px] self-end p-1 border rounded-md w-fit bg-error-stroke text-white"
                >
                  Remove Charity
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
                    const value = e.target.value
                      .replace("$", "")
                      .replaceAll(",", "");

                    const decimals = value.split(".")[1];
                    if (decimals && decimals?.length > 2) return;

                    const strippedLeadingZeros = value.replace(/^0+/, "");
                    handleSelectedCharityAmount(Number(strippedLeadingZeros));
                  }}
                  placeholder="Enter donation amount"
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

      <FilledButton
        className={`w-full rounded-full`}
        disabled={
          isLoading || !hyper || !widgets || message === "Payment Successful"
        }
        data-testid="pay-now-id"
      >
        {isLoading ? "Loading..." : <>Pay Now</>}
      </FilledButton>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={styles.paymentMessage}>
          {message === "Payment Successful"
            ? "Payment Successful"
            : "An error occurred processing payment."}
        </div>
      )}
    </form>
  );
};
