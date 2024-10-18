"use client";

import { BlurImage } from "~/components/images/blur-image";
import { Spinner } from "~/components/loading/spinner";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserContext } from "~/contexts/UserContext";

export default function CheckoutConfirmation() {
  const { course } = useCourseContext();
  const { user } = useUserContext();
  const params = useSearchParams();
  const status = params.get("status");
  const clientSecret = params.get("payment_intent_client_secret");
  const teeTimeId = params.get("teeTimeId");
  const paymentId = params.get("payment_id");
  const cartId = params.get("cart_id");
  const sensibleQuoteId = params.get("sensible_quote_id");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const reserveBookingApi = api.teeBox.reserveBooking.useMutation();
  const cancelHyperswitchPaymentById =
    api.webhooks.cancelHyperswitchPaymentById.useMutation();
  const { isLoading: isLoadingPaymentIntent, data: paymentIntent } =
    api.checkout.retrivePaymentIntent.useQuery({
      clientSecret: clientSecret?.split("secret")[0]?.slice(0, -1) ?? "",
    });
  
  const { setReservationData } = useCheckoutContext();

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

  const handlePayment = async () => {
    // if (listingId.length) {
    //   const isTeeTimeAvailable = await refetchCheckTeeTime();
    //   if (!isTeeTimeAvailable.data) {
    //     toast.error("Oops! Tee time is not available anymore");
    //     return;
    //   }
    //   console.log(isTeeTimeAvailable.data);
    // }

    // if (message === "Payment Successful") return;
    // e.preventDefault();
    // if (
    //   selectedCharity &&
    //   (!selectedCharityAmount || selectedCharityAmount === 0)
    // ) {
    //   setCharityAmountError("Charity amount cannot be empty or zero");
    //   return;
    // }
    // if (selectedCharityAmount && selectedCharityAmount > MAX_CHARITY_AMOUNT) {
    //   return;
    // }
    // setCharityAmountError("");
    // setIsLoading(true);

    try {
      if (status === "failed") {
        //TODO: If the payment is failed on prophetpay's end
        throw new Error(
          "Something went wrong while making payment, Please try again."
        );
      }
      // if (response) {
      if (paymentIntent!.status === "processing") {
        void cancelHyperswitchPaymentById.mutateAsync({
          paymentId: paymentId!,
          email: user?.email,
          phone: user?.phone,
          userId: user?.id,
          teeTimeId: teeTimeId!,
          courseId: course!.id,
        });
        // setMessage(
        //   getErrorMessageById((response?.error_code ?? "") as string)
        // );
      } else if (paymentIntent!.status === "succeeded") {
        let bookingResponse = {
          bookingId: "",
          providerBookingId: "",
          status: "",
        };

        // if (isFirstHand.length) {
        try {
          bookingResponse = await reserveBookingFirstHand(
            cartId!,
            paymentId!,
            sensibleQuoteId ?? ""
          );
          setReservationData({
            golfReservationId: bookingResponse.bookingId,
            providerReservationId: bookingResponse.providerBookingId,
            playTime: "",
          });
        } catch (error) {
          setMessage("Error reserving first hand booking: " + error.message);
          return;
        }
        // } else {
        //   try {
        //     bookingResponse = await reserveSecondHandBooking(
        //       cartId,
        //       listingId,
        //       response?.payment_id as string
        //     );
        //   } catch (error) {
        //     setMessage(
        //       "Error reserving second hand booking: " + error.message
        //     );
        //     return;
        //   }
        // }

        setMessage("Booking Successful");
        router.push(
          `${window.location.origin}/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}`
        );
        // if (isBuyNowAuction) {
        //   router.push(`/${course?.id}/auctions/confirmation`);
        // } else {
        //   router.push(
        //     `/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}`
        //   );
        // }
      }
      // else if (response.error) {
      //   setMessage(response.error.message as string);
      // }
      else {
        setMessage("An unexpected error occurred: " + status);
      }
      // }
    } catch (error) {
      setMessage("An unexpected error occurred: " + error.message);
    } finally {
      // setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!isLoadingPaymentIntent && paymentIntent) {
      void handlePayment();
    }
  }, [isLoadingPaymentIntent]);

  return (
    <div className="relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8">
      <div className="flex p-2 justify-center w-full">
        <Link href={`/${course?.id}`} data-testid="course-logo-id">
          <BlurImage
            src={course?.logo ?? ""}
            alt="course logo"
            width={60}
            height={100}
            className="w-[50px] object-fit"
          />
        </Link>
      </div>
      {/* <CheckoutBreadcumbs status={"processing"} /> */}

      <section className="mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[80vw] md:rounded-xl md:p-6 md:py-4">
        <div className="container mx-auto p-4">
          <div className="flex flex-wrap justify-center">
            <div className="w-full md:w-1/2 p-4">
              <h1 className="text-[24px] md:text-[32px]">Processing...</h1>
              <div className="flex justify-center items-center h-full min-h-[200px]">
                {!message ? (
                  <Spinner className="w-[50px] h-[50px]" />
                ) : (
                  <span>{message}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
