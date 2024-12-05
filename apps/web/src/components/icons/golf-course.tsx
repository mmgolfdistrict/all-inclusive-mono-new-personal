import { type ComponentProps } from "react";

export const GolfCourse = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Hole */}
    <ellipse cx="12" cy="19" rx="4" ry="1.5" fill="#008000" />
    {/* Flagpole */}
    <rect x="11.5" y="4" width="1" height="15" fill="#008000" />
    {/* Flag */}
    <path d="M12 4L16 7L12 10V4Z" fill="#008000" />
    {/* Ball */}
    <circle cx="18" cy="19" r="1" fill="#008000" />
  </svg>
);
