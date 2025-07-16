"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import Link from "next/link";
import { Fragment, useEffect } from "react";
import { FilledButton } from "../buttons/filled-button";
import { InviteFriends } from "../tee-time-page/invite-friends";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
interface ConfirmationProps {
  teeTimeId: string;
  bookingId: string;
  isEmailSend: boolean;
  isGroupBooking: boolean;
  isValidForCollectPayment: boolean;
}
export const Confirmation = ({
  teeTimeId,
  bookingId,
  isEmailSend,
  isGroupBooking,
  isValidForCollectPayment
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
  const params = useParams();
  const router = useRouter();
  const courseId = course?.id;
  useEffect(() => {
    // const handlePopState = () => {
    //   // console.log(params.course);
    //   // void router.replace(`/${params.course}`);
    //   // console.log("button pressed");
    //      router.push(`/${params.course}`);
    //   if (typeof params.course === 'string') {
    //   console.log(params.course);
    //   void router.replace(`/${params.course}`);
    //   console.log("button pressed");
    // } else {
    //   console.log("Course param missing or invalid");
    //   void router.replace('/');
    // }
    // };
    const handlePopState = () => {
      console.log("Back button pressed>>>>>>", courseId);
      router.push(`/${courseId}`);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);
  function handleNavigationGotoMyTeeBox() {
    router.replace(`/${course?.id}/my-tee-box`);
  }
  function handleNavigationForCollectPayment() {
    router.replace(`/${course?.id}/my-tee-box/?bookingId=${bookingId}&collectPayment=true`)
  }
  return (
    <section className="mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 text-center md:max-w-[80vw] md:rounded-xl md:p-6 md:py-4">
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 p-4">
            <h1 className="text-[1.5rem] md:text-[2rem]">
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
                {bookingData && (bookingData?.playerCount ?? 0) > 1 ? (
                  <div className="flex  flex-col items-center justify-center gap-2 md:flex-row">
                    {/* <Link
                      href={`/${course?.id}/my-tee-box/?bookingId=${bookingId}&collectPayment=${isValidForCollectPayment}`}
                      className="w-full md:w-fit md:min-w-[250px]"
                      data-testid="go-to-my-tee-box-button-id"
                    >
                      <FilledButton className="w-full">Collect Payment</FilledButton>
                    </Link> */}
                    <div className="w-full md:w-fit md:min-w-[15.625rem] ">
                      <FilledButton
                        onClick={handleNavigationForCollectPayment}
                        className="w-full">Request Payment</FilledButton>
                    </div>
                  </div>
                ) : null}
                <div className="mt-5">
                  <span className="text-primary-gray font-semibold text-center text-justify">
                    Collect the payment from your players in your tee time.
                  </span>
                </div>
                {isEmailSend ? (
                  <Fragment>
                    <div>
                      <span className="text-yellow-600 font-semibold text-center text-justify">
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
            <h1 className="text-[1.5rem] md:text-[2rem]">
              Thanks for your purchase
            </h1>
            <div className="flex justify-center items-center w-full my-3">
              <FilledButton
                onClick={handleNavigationGotoMyTeeBox}
                className="min-w-[250px]"
              >
                Go To My Tee Box
              </FilledButton>
            </div>

            <p className="text-[14px] text-primary-gray md:text-[16px] text-justify">
              Your tee time will be viewable in My Tee Box. Please note that all
              purchases are final. You can manage or update the players in your
              party at any time before the round.
            </p>
            <p className="text-[14px] text-primary-gray md:text-[16px] text-justify">
              Add golfers to your tee time by entering their names, selecting
              them by their Golf District handle, or inviting them via email.
            </p>
          </div>
        </div>
      </div>
      {course?.supportsPlayerNameChange && (
        <div>
          <InviteFriends teeTimeId={teeTimeId} isConfirmationPage />
        </div>
      )}
      <div>
        <div className="w-full flex-col items-center justify-center md:gap-2 md:flex-row">
          Please send your feedback to{" "}
          <a href="mailto:support@golfdistrict.com">support@golfdistrict.com</a>
          <br />
          <br />
        </div>
        <div className="flex w-full flex-col items-center justify-center mb-4 text-[0.875rem] md:text-[1rem]">
          <p className="text-red text-center">
            You should receive a confirmation email. If you don’t see the
            confirmation email within the next 5 mins, please check your Junk
            Mail or Spam folder. Remember to add no-reply@golfdistrict.com to
            the safe senders list.
          </p>
        </div>
        <div className="flex gap-2 justify-center" >
          <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
            {/* <Link
              href={`/${course?.id}/my-tee-box`}
              className="w-full md:w-fit md:min-w-[250px]"
              data-testid="go-to-my-tee-box-button-id"
            >
              <FilledButton className="w-full">Go To My Tee Box</FilledButton>
            </Link> */}
          </div>
        </div>
      </div>
      <p className="mt-4 text-[0.875rem] text-primary-gray md:text-[1rem] font-semibold text-center">
        Tip: If you know you can’t make your time, the earlier you can list, the
        greater the chance it sells.
      </p>

    </section>
  );
};
