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
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
  isSensibleInvalid: boolean;
}) => {
  return (
    <section className="mx-auto flex w-full h-fit flex-col gap-4 bg-white px-3 py-2 md:rounded-xl md:p-6 md:py-4">
      <h1 className="text-center md:text-start">Order Summary</h1>
      <div className="rounded-md bg-primary p-2 text-white">
        <h2 className="text-lg">
          Plans change. No worries!
          <Tooltip
            trigger={<Info className="h-[14px] w-[14px]" />}
            content="Resell your tee time from our website. Selling outside from our website is not allowed, and both the buyer and seller may forfeit their money and time."
          />
        </h2>
        {/* <p className="text-sm">
          Resell your tee time from our website. Selling outside from our
          website is not allowed, and both the buyer and seller may forfeit
          their money and time.
        </p> */}
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
    </section>
  );
};
