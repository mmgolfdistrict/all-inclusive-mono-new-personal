"use client";

// import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import Link from "next/link";
import { Fragment } from "react";
// import { useRouter } from "next/router";
import { FilledButton } from "../buttons/filled-button";
import { InviteFriends } from "../tee-time-page/invite-friends";

// import { InviteFriends } from "../tee-time-page/invite-friends";
interface ConfirmationProps {
  teeTimeId: string;
  bookingId: string;
  isEmailSend: boolean;
  isGroupBooking: boolean;
}
export const Confirmation = ({
  teeTimeId,
  bookingId,
  isEmailSend,
  isGroupBooking,
}: ConfirmationProps) => {
  const { data: bookingData, isLoading: isLoadingBookingData } =
    api.teeBox.getOwnedBookingById.useQuery(
      { bookingId },
      {
        enabled: !!teeTimeId,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      }
    );

  const { course } = useCourseContext();
  // const { reservationData } = useCheckoutContext();
  return (
    <section className="mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[80vw] md:rounded-xl md:p-6 md:py-4">
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 p-4">
            <h1 className="text-[24px] md:text-[32px]">
              Your Reservation Details
            </h1>
            {isLoadingBookingData ? (
              <span>Loading ...</span>
            ) : (
              <>
                {bookingData?.providerId?.length && !isGroupBooking ? (
                  <div style={{ paddingBottom: "5px" }}>
                    <span style={{ fontWeight: 500 }}>
                      Course Reservation ID
                    </span>
                    <span style={{ margin: "0 15px" }}>:</span>
                    <span>{bookingData?.providerId}</span>
                  </div>
                ) : null}
                {isGroupBooking && bookingData?.groupId ? (
                  <div style={{ paddingBottom: "5px" }}>
                    <span style={{ fontWeight: 500 }}>
                      Group Reservation ID
                    </span>
                    <span style={{ margin: "0 15px" }}>:</span>
                    <span>{bookingData?.groupId}</span>
                  </div>
                ) : null}
                {isGroupBooking ? (
                  <div style={{ paddingBottom: "5px" }}>
                    <span style={{ fontWeight: 500 }}>Player Count</span>
                    <span style={{ margin: "0 15px" }}>:</span>
                    <span>{bookingData?.playerCount}</span>
                  </div>
                ) : null}

                <div style={{ paddingBottom: "20px" }}>
                  <span style={{ fontWeight: 500 }}>Play Time</span>
                  <span style={{ margin: "0 15px" }}>:</span>
                  <span>
                    {formatTime(
                      bookingData?.playTime ?? "",
                      true,
                      course?.timezoneCorrection
                    )}
                  </span>
                </div>
                {isEmailSend ? (
                  <Fragment>
                    <div>
                      <span className="text-yellow-600 font-semibold text-center ">
                        Your booking is confirmed though we are unable to send
                        the email. Rest assured our customer service
                        representative will call you shortly
                      </span>
                    </div>
                  </Fragment>
                ) : (
                  ""
                )}
              </>
            )}
          </div>
          <div className="w-full md:w-1/2 p-4">
            <h1 className="text-[24px] md:text-[32px]">
              Thanks for your purchase
            </h1>
            <p className="text-[14px] text-primary-gray md:text-[16px]">
              Your tee time will be viewable in My Tee Box. Please note that all
              purchases are final. You can manage or update the players in your
              party at any time before the round.
            </p>
            <p className="text-[14px] text-primary-gray md:text-[16px]">
              Add golfers to your tee time by entering their names, selecting
              them by their Golf District handle, or inviting them via email.
            </p>
          </div>
        </div>
      </div>
      {/* <div>
        <InviteFriends teeTimeId={teeTimeId} isConfirmationPage />
      </div> */}
      <div>
        <div className="w-full flex-col items-center justify-center md:gap-2 md:flex-row">
          Please send your feedback to{" "}
          <a href="mailto:support@golfdistrict.com">support@golfdistrict.com</a>
          <br />
          <br />
        </div>
        <div className="flex w-full flex-col items-center justify-center mb-4 text-[14px] md:text-[16px]">
          <p className="text-red text-center">
            You should receive a confirmation email. If you don’t see the
            confirmation email within the next 5 mins, please check your Junk
            Mail or Spam folder. Remember to add no-reply@golfdistrict.com to
            the safe senders list.
          </p>
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
      <p className="mt-4 text-[14px] text-primary-gray md:text-[16px] font-semibold text-center">
        Tip: If you know you can’t make your time, the earlier you can list, the
        greater the chance it sells.
      </p>
    </section>
  );
};
