import { LeftChevron } from "../icons/left-chevron";

export const CheckoutBreadcumbs = ({
  status,
}: {
  status: "checkout" | "confirmation";
}) => {
  return (
    <div className="flex items-center gap-3 text-[0.875rem]">
      <div
        className={`${status === "checkout" ? "text-secondary-black" : "text-primary-gray"
          }`}
      >
        Checkout
      </div>
      <LeftChevron className="h-2.5 w-2.5 rotate-180" />
      <div
        className={`${status === "confirmation"
            ? "text-secondary-black"
            : "text-secondary-gray"
          }`}
      >
        Order Confirmation
      </div>
    </div>
  );
};
