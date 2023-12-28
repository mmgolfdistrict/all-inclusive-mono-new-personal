import { type ComponentProps } from "react";

export const Error = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10Z"
      fill="white"
    />
    <path
      d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM10 8.5858L7.17157 5.75736L5.75736 7.17157L8.5858 10L5.75736 12.8284L7.17157 14.2426L10 11.4142L12.8284 14.2426L14.2426 12.8284L11.4142 10L14.2426 7.17157L12.8284 5.75736L10 8.5858Z"
      fill="#E04070"
    />
  </svg>
);
