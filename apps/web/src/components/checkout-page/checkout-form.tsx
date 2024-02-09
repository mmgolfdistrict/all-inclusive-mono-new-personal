/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  UnifiedCheckout,
  useHyper,
  useWidgets,
} from "@juspay-tech/react-hyper-js";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FilledButton } from "../buttons/filled-button";
import { CharitySelect } from "../input/charity-select";
import { Input } from "../input/input";
import styles from "./checkout.module.css";

export const CheckoutForm = ({
  isBuyNowAuction,
  amountToPay,
  teeTimeId,
}: {
  isBuyNowAuction: boolean;
  amountToPay: number;
  teeTimeId: string;
}) => {
  const { course } = useCourseContext();
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
  };
  const hyper = useHyper();
  const widgets = useWidgets();

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  // const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const {
    promoCode,
    handlePromoCode,
    selectedCharity,
    selectedCharityAmount,
    handleSelectedCharity,
    handleSelectedCharityAmount,
    handleRemoveSelectedCharity,
  } = useCheckoutContext();

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
        console.log(response);
        setMessage("Payment Successful");
        isBuyNowAuction
          ? router.push(`/${course?.id}/auctions/confirmation`)
          : router.push(
              `/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}`
            );
      } else if (response.error) {
        setMessage(response.error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
    // setIsPaymentCompleted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <UnifiedCheckout id="unified-checkout" options={unifiedCheckoutOptions} />
      <div className="flex w-full flex-col gap-2 bg-white p-4 rounded-lg my-2">
        {course?.supportCharity ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div>Support A Charity</div>
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
                  error=""
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {isBuyNowAuction ? null : (
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
            />
          </div>
        )}
        <div className="flex justify-between">
          <div>
            Subtotal
            {isBuyNowAuction ? null : ` (1 item)`}
          </div>

          <div>
            $
            {amountToPay.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <div>Tax</div>
          <div>$0.00</div>
        </div>
        <div className="flex justify-between">
          <div>Total</div>
          <div>
            $
            {amountToPay.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <FilledButton
        className={`w-full rounded-full`}
        disabled={!hyper || !widgets || message === "Payment Successful"}
      >
        {isLoading ? "Loading..." : <>Pay Now</>}
      </FilledButton>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={styles.paymentMessage}>
          {message}
        </div>
      )}
    </form>
  );
};
