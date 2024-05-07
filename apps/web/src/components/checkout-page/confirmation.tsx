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
      {/* 
      <video
        className="max-h-[200px] w-full"
        autoPlay
        muted
        playsInline
        // width={780}
        // height={439}

        src={"/videos/confirmation.mp4"}
      />
      <div style={{ display: "flex",flexWrap:'wrap' }}>
        <div className="flex-1">
          <h1 className="text-[24px] md:text-[32px]">
            Your Reservation Details
          </h1>
          <div style={{ paddingBottom: "5px", fontSize: "16px" }}>
            <span style={{ fontWeight: 500 }}>GOLFdistrict Reservation Id</span>
            <span style={{ margin: "0 15px" }}>:</span>
            <span>dummy</span>
          </div>
          <div style={{ paddingBottom: "5px" }}>
            <span style={{ fontWeight: 500 }}>GOLFdistrict Reservation Id</span>
            <span style={{ margin: "0 15px" }}>:</span>
            <span>dummy</span>
          </div>
          <div style={{ paddingBottom: "65px" }}>
            <span style={{ fontWeight: 500 }}>GOLFdistrict Reservation Id</span>
            <span style={{ margin: "0 15px" }}>:</span>
            <span>dummy</span>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-[24px] md:text-[32px]">
            Thanks for your purchase
          </h1>
          <p className="text-[14px] text-primary-gray md:text-[16px]">
            Your tee time will be viewable in your My Tee Box in the Profile.
            All purchases are final. You can sell or adjust your tee time up to
            30 minutes before the scheduled time.
          </p>
          <p className="text-[14px] text-primary-gray md:text-[16px]">
            Add your golfers to your tee time. You can add their name or select
            them using their GOLFdistrict handle or invite them via email or
            phone.
          </p>
        </div>
      </div> 
      */}
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
                <div style={{ paddingBottom: "5px", fontSize: "16px" }}>
                  <span style={{ fontWeight: 500 }}>
                    GOLFdistrict Reservation ID
                  </span>
                  <span style={{ margin: "0 15px" }}>:</span>
                  <span>{bookingId}</span>
                </div>
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
              Your tee time will be viewable in your My Tee Box in the Profile.
              All purchases are final. You can sell or adjust your tee time up
              to 30 minutes before the scheduled time.
            </p>
            <p className="text-[14px] text-primary-gray md:text-[16px]">
              Add your golfers to your tee time. You can add their name or
              select them using their GOLFdistrict handle or invite them via
              email or phone.
            </p>
          </div>
        </div>
      </div>
      <div>
        <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row">
          <Link
            href={`/${course?.id}/my-tee-box`}
            className="w-full md:w-fit md:min-w-[250px]"
            data-testid="go-to-my-tee-box-button-id"
          >
            <FilledButton className="w-full">Go To My Tee Box</FilledButton>
          </Link>
        </div>
        {/* <InviteFriends isConfirmationPage={true} teeTimeId={teeTimeId} /> */}
        <div className="flex flex-col gap-2">
          <div className="text-secondary-black">Share your Tee-Time</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <OutlineButton
              className={"flex h-[48px] w-[48px] items-center justify-center"}
            >
              <Facebook className="min-h-[24px] min-w-[24px]" />
            </OutlineButton>
            <OutlineButton
              className={"flex h-[48px] w-[48px] items-center justify-center"}
            >
              <X className="min-h-[24px] min-w-[24px]" />
            </OutlineButton>
            <OutlineButton
              className={"flex h-[48px] w-[48px] items-center justify-center"}
            >
              <LinkedIn className="min-h-[24px] min-w-[24px]" />
            </OutlineButton>
            <OutlineButton
              className={"flex h-[48px] w-[48px] items-center justify-center"}
            >
              <Instagram className="min-h-[24px] min-w-[24px]" />
            </OutlineButton>
          </div>
        </div>
      </div>
    </section>
  );
};
