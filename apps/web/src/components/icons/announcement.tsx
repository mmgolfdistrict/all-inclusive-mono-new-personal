import { type ComponentProps } from "react";

export const Announcement = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M3 10H13L18 6V18L13 14H3V10Z" fill="#008000" />
    <rect x="3" y="9" width="2" height="6" fill="#008000" />
    <path
      d="M19 10L21 9M19 14L21 15M21 12H19"
      stroke="#008000"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
