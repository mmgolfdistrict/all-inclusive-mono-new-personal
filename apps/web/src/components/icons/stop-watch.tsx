import { type ComponentProps } from "react";

export const Stopwatch = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="12"
      cy="14"
      r="8"
      stroke="#008000"
      strokeWidth="2"
      fill="none"
    />
    <rect x="11" y="8" width="2" height="6" fill="#008000" />
    <rect x="10" y="3" width="4" height="2" fill="#008000" />
    <path d="M16.5 6.5L18 5" stroke="#008000" strokeWidth="2" />
  </svg>
);
