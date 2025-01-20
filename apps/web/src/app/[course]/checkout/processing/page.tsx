"use client";

import { Spinner } from "~/components/loading/spinner";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserContext } from "~/contexts/UserContext";
import { toast } from "react-toastify";
import { getErrorMessageById } from "@golf-district/shared/src/hyperSwitchErrorCodes";
import Link from "next/link";
import { FilledButton } from "~/components/buttons/filled-button";
import styles from "../../../../components/checkout-page/checkout.module.css";
import { useBookingSourceContext } from "~/contexts/BookingSourceContext";

export default function CheckoutProcessing() {
  const { bookingSource, setBookingSource } = useBookingSourceContext();
  const { course } = useCourseContext();
  const { user } = useUserContext();
  const params = useSearchParams();
  const status = params.get("status");
  const clientSecret = params.get("payment_intent_client_secret");
  const teeTimeId = params.get("teeTimeId");
  const paymentId = params.get("payment_id");
  const cartId = params.get("cart_id");
  const needRentals = params.get("need_rentals") === "true";
  const listingId = params.get("listing_id");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const {
    setReservationData,
    sensibleData,
    amountOfPlayers,
  } = useCheckoutContext();
  const reserveBookingApi = api.teeBox.reserveBooking.useMutation();
  const cancelHyperswitchPaymentById =
    api.webhooks.cancelHyperswitchPaymentById.useMutation();
  const { isLoading: isLoadingPaymentIntent, data: paymentIntent } =
    api.checkout.retrivePaymentIntent.useQuery({
      clientSecret: clientSecret?.split("secret")[0]?.slice(0, -1) ?? "",
    });

  const { data: checkIsBookingDisabled } = api.course.getCourseById.useQuery({
    courseId: (course?.id) ?? "",
  });
  const reserveSecondHandBookingApi =
    api.teeBox.reserveSecondHandBooking.useMutation();

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
      source: bookingSource
        ? bookingSource
        : sessionStorage.getItem("source") ?? "",
      additionalNoteFromUser: "",
      needRentals,
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
      source: bookingSource
        ? bookingSource
        : sessionStorage.getItem("source") ?? "",
      needRentals,
    });
    return bookingResponse;
  };


  const { data: maxReservation } =
    api.checkout.checkMaxReservationsAndMaxRounds.useQuery({
      roundsToBook: amountOfPlayers,
      courseId: course ? course.id : "",
    });
  const { refetch: refetchCheckTeeTime } =
    api.teeBox.checkIfTeeTimeStillListedByListingId.useQuery(
      {
        listingId: listingId ?? "",
      },
      {
        enabled: false,
      }
    );

  const checkIfTeeTimeAvailableOnProvider =
    api.teeBox.checkIfTeeTimeAvailableOnProvider.useMutation();
  console.log("paymentIntent", paymentIntent);

  const handlePayment = async () => {
    if (checkIsBookingDisabled?.isBookingDisabled == 1) {
      // e.preventDefault();
      toast.error(
        "Due some issue currently Booking are unavailable for this course"
      );
      return;
    }
    if (!maxReservation?.success) {
      // toast.error(maxReservation?.message);
      setMessage(maxReservation?.message ?? "");
      return;
    }
    if (listingId?.length) {
      const isTeeTimeAvailable = await refetchCheckTeeTime();
      if (!isTeeTimeAvailable.data) {
        setMessage("Oops! Tee time is not available anymore");
        return;
      }
    } else {
      if (teeTimeId) {
        const resp = await checkIfTeeTimeAvailableOnProvider.mutateAsync({
          teeTimeId,
          golfersCount: Number(amountOfPlayers ?? 0),
        });
        if (!resp) {
          setMessage("Oops! Tee time is not available anymore");
          return;
        }
      }
    }

    try {
      if (status === "failed") {
        //TODO: If the payment is failed on prophetpay's end
        setMessage("Something went wrong while making payment, Please try again.")
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
        setMessage(
          getErrorMessageById("Error Processing Payment with unknown error")
        );
      } else if (paymentIntent!.status === "succeeded") {
        let bookingResponse = {
          bookingId: "",
          providerBookingId: "",
          status: "",
          isEmailSend: false,
        };

        if (!listingId) {

          try {
            bookingResponse = await reserveBookingFirstHand(
              cartId!,
              paymentId!,
              sensibleData?.id ?? ""
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
        } else {

          try {
            bookingResponse = await reserveSecondHandBooking(
              cartId!,
              listingId,
              paymentId!
            );
          } catch (error) {
            setMessage(
              "Error reserving second hand booking: " + error.message
            );
            return;
          }
        }

        setMessage("Booking Successful");
        setBookingSource("");
        router.push(
          `${window.location.origin}/${course?.id}/checkout/confirmation?teeTimeId=${teeTimeId}&bookingId=${bookingResponse.bookingId}`
        );
      }
      else {
        setMessage(
          getErrorMessageById("Error Processing Payment with unknown error")
        );
      }

    } catch (error) {
      setMessage("An unexpected error occurred: " + error.message);
    }
  };

  useEffect(() => {
    if (!isLoadingPaymentIntent && paymentIntent) {
      void handlePayment();
    }
  }, [isLoadingPaymentIntent]);

  const { data: systemNotifications } =
    api.systemNotification.getSystemNotification.useQuery({});

  const { data: courseGlobalNotification } =
    api.systemNotification.getCourseGlobalNotification.useQuery({
      courseId: course?.id ?? "",
    });

  const notificationsCount =
    (systemNotifications ? systemNotifications.length : 0) +
    (courseGlobalNotification ? courseGlobalNotification.length : 0);

  const marginTop = notificationsCount > 0 ? `${notificationsCount * 8}px` : "0";
  return (
    <div className="relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8" style={{ marginTop }}>
      <div className="h-12 w-full ">
      </div>
      {/* <CheckoutBreadcumbs status={"processing"} /> */}

      <section className="mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[80vw] md:rounded-xl md:p-6 md:py-4">
        <div className="container mx-auto p-4">
          <div className="flex flex-wrap justify-center">
            <div className="w-full md:w-1/2 p-2">
              <h1 className="text-[20px] md:text-[28px]">We are processing your payment.</h1>
              <h1 className="text-[20px] md:text-[28px]"> Please do not close or reload your browser as this might take up to 2 mins.</h1>
              <div className="flex justify-center items-center h-full min-h-[200px]">
                {!message ? (
                  <Spinner className="w-[50px] h-[50px]" />
                ) : (
                  <div id="payment-message" className={styles.paymentMessage}>
                    {message === "Booking Successful" ? (
                      <span>Booking Successful</span>
                    ) : (
                      <span className="!text-red">{message}</span>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
        {message && message !== "Booking Successful" && <div>
          <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
            Please send your feedback to{" "}
            <a href="mailto:support@golfdistrict.com">support@golfdistrict.com</a>
            <br />
            <br />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
            <Link
              href={`/${course?.id}/my-tee-box`}
              className="w-full md:w-fit md:min-w-[250px]"
              data-testid="go-to-my-tee-box-button-id"
            >
              <FilledButton className="w-full">Go To My Tee Box</FilledButton>
            </Link>
          </div>
        </div>
        }
      </section>
    </div>
  );
}