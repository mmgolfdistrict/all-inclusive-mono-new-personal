import {
  type SearchObject,
  type SensibleDataToMountCompType,
} from "~/utils/types";
import { CheckoutItem } from "../cards/checkout-item";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";

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
  return (
    <section className="mx-auto flex w-full h-fit flex-col gap-4 bg-white px-3 py-2 md:rounded-xl md:p-6 md:py-4">
      <h1 className="text-center md:text-start">Order Summary</h1>
      <div className="rounded-md bg-gray-300 p-2 text-black">
        <h2 className="text-lg">
          Plans change. No worries! Resell your time.{" "}
          <Tooltip
            className="!text-black"
            trigger={<Info color="#000000" className="h-[14px] w-[14px]" />}
            content="Easily resell your tee time through our Golf District platforms. Tee times bought and resold through Golf District—an approved technology partner—are verified and supported because they sync directly with the golf course’s official tee sheet. Reselling through unaffiliated platforms may not be compatible with course systems and could result in an invalid booking."
          />
        </h2>
      </div>

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
        This purchase in non-refundable. All fees are included. Please send your
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
