import { type ComponentProps } from "react";

export const BookAdvance = (props: ComponentProps<"svg">) => (
  <svg
    width={props.width ?? "1.875rem"}
    height={props.height ?? "1.875rem"}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Filled Calendar Background */}
    <rect
      x="8"
      y="10"
      width="20"
      height="18"
      rx="2"
      fill="#E8F5E9"
      stroke="#41942A"
      strokeWidth="2.5"
    />

    {/* Top Line */}
    <path
      d="M8 14H28"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Calendar Bindings */}
    <path
      d="M12 7V11"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M24 7V11"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Listing Items */}
    <path
      d="M12 18H24"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M12 22H24"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
