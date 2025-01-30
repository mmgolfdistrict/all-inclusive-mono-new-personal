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
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
  isSensibleInvalid: boolean;
  privacyPolicyAndTCByCourseUrl?: {
    privacyPolicyURL: string | null;
    termsAndConditionsURL: string | null;
  };
}) => {
  return (
    <section className="mx-auto flex w-full h-fit flex-col gap-4 bg-white px-3 py-2 md:rounded-xl md:p-6 md:py-4">
      <h1 className="text-center md:text-start">Order Summary</h1>
      <div className="rounded-md bg-primary p-2 text-white">
        <h2 className="text-lg">
          Plans change. No worries! Resell your time.{" "}
          <Tooltip
            trigger={<Info className="h-[14px] w-[14px]" />}
            content="Easily resell your tee time through our website. Please note that selling outside our platform is prohibited and may result in both the buyer and seller forfeiting their money and time."
          />
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        <CheckoutItem
          isLoading={isLoading}
          teeTime={teeTime}
          isSensibleInvalid={isSensibleInvalid}
          sensibleDataToMountComp={sensibleDataToMountComp}
        />
      </div>
      <h2 className="italic">
        This purchase in non-refundable. All fees are included.
      </h2>
      <h2 className="italic">
        Please send your feedback to{" "}
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
