"use client";

// import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatTime } from "~/utils/formatters";
import Link from "next/link";
// import { useRouter } from "next/router";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Facebook } from "../icons/share/facebook";
import { Instagram } from "../icons/share/instagram";
import { LinkedIn } from "../icons/share/linkedin";
import { X } from "../icons/share/x";

// import { InviteFriends } from "../tee-time-page/invite-friends";

export const Confirmation = ({
  teeTimeId,
  bookingId,
}: {
  teeTimeId: string;
  bookingId: string;
}) => {
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
                {bookingData?.providerId?.length ? (
                  <div style={{ paddingBottom: "5px" }}>
                    <span style={{ fontWeight: 500 }}>
                      Course Reservation ID
                    </span>
                    <span style={{ margin: "0 15px" }}>:</span>
                    <span>{bookingData?.providerId}</span>
                  </div>
                ) : null}

                <div style={{ paddingBottom: "65px" }}>
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
      <div>
        <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
          Please send your feedback to{" "}
          <a href="mailto:support@golfdistrict.com">support@golfdistrict.com</a>
          .
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
    </section>
  );
};
