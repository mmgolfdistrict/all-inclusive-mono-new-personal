import { type ComponentProps } from "react";

export const FiltersIcon = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.25 10.0625L1.75 10.9375V3.0625L5.25 2.1875"
      stroke="#353B3F"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.75 11.8125L5.25 10.0625V2.1875L8.75 3.9375V11.8125Z"
      stroke="#353B3F"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.75 3.9375L12.25 3.0625V10.9375L8.75 11.8125"
      stroke="#353B3F"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
