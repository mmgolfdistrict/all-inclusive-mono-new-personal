import {
  type SearchObject,
  type SensibleDataToMountCompType,
} from "~/utils/types";
import { CheckoutItem } from "../cards/checkout-item";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import { useMediaQuery } from "usehooks-ts";

export const OrderSummary = ({
  teeTime,
  isLoading,
  sensibleDataToMountComp,
  isSensibleInvalid,
  privacyPolicyAndTCByCourseUrl,
  isGroupBooking = false,
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
  isSensibleInvalid: boolean;
  privacyPolicyAndTCByCourseUrl?: {
    privacyPolicyURL: string | null;
    termsAndConditionsURL: string | null;
  };
  isGroupBooking?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <section
      className={isMobile ? "px-4" : ""}
    // className="mx-auto flex w-full h-fit flex-col gap-4 bg-white px-3 py-2 md:rounded-xl md:p-6 md:py-4"
    >
      <h1 className="text-center text-start mb-3">Order Summary</h1>

      <div className="flex flex-col gap-4">
        <CheckoutItem
          isLoading={isLoading}
          teeTime={teeTime}
          isSensibleInvalid={isSensibleInvalid}
          sensibleDataToMountComp={sensibleDataToMountComp}
          isGroupBooking={isGroupBooking}
        />
      </div>
      <h2 className="italic">
        This purchase is non-refundable. All fees are included. Please send your
        feedback to{" "}
        <a href="mailto:support@golfdistrict.com">support@golfdistrict.com</a>.
      </h2>
      {privacyPolicyAndTCByCourseUrl?.privacyPolicyURL && (
        <a
          href={privacyPolicyAndTCByCourseUrl.privacyPolicyURL}
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Course Privacy Policy: Click Here
        </a>
      )}
      {privacyPolicyAndTCByCourseUrl?.termsAndConditionsURL && (
        <a
          href={privacyPolicyAndTCByCourseUrl.termsAndConditionsURL}
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Course T&C: Click Here
        </a>
      )}
    </section>
  );
};
