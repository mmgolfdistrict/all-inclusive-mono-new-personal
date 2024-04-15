import {
  type SearchObject,
  type SensibleDataToMountCompType,
} from "~/utils/types";
import { CheckoutItem } from "../cards/checkout-item";

export const OrderSummary = ({
  teeTime,
  isLoading,
  sensibleDataToMountComp,
  isSensibleInvalid,
  checkIfHyperSessionIsBuild
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
  isSensibleInvalid: boolean;
  checkIfHyperSessionIsBuild:boolean;
}) => {
  return (
    <section className="mx-auto flex w-full h-fit flex-col gap-4 bg-white px-3 py-2 md:rounded-xl md:p-6 md:py-4">
      <h1 className="text-center md:text-start">Order Summary</h1>
      <div className="flex flex-col gap-4">
        <CheckoutItem
          isLoading={isLoading}
          teeTime={teeTime}
          isSensibleInvalid={isSensibleInvalid}
          sensibleDataToMountComp={sensibleDataToMountComp}
          checkIfHyperSessionIsBuild={checkIfHyperSessionIsBuild}
        />
      </div>
      <h2 className="italic">This purchase in non-refundable</h2>
      <div className="rounded-md bg-primary p-2 text-white">
        <h2 className="text-lg">Resell Your Tee Time Anytime</h2>
        <p className="text-sm">
          Plans change. No worries! Resell your tee times on GOLFdistrict up to
          30 minutes before play.
        </p>
      </div>
    </section>
  );
};
