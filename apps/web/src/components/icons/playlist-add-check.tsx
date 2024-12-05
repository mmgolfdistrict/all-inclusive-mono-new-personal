import { type ComponentProps } from "react";

export const PlaylistAddCheck = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Horizontal lines for playlist */}
    <rect x="3" y="6" width="14" height="2" fill="#008000" />
    <rect x="3" y="10" width="14" height="2" fill="#008000" />
    <rect x="3" y="14" width="10" height="2" fill="#008000" />

    {/* Tick/Checkmark */}
    <path
      d="M17 18L19.5 20.5L23 16"
      stroke="#008000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
