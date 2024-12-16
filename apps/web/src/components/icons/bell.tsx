import { type ComponentProps } from "react";

export const Bell = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 22c1.104 0 2-.896 2-2H10c0 1.104.896 2 2 2zm6-5V9c0-3.314-2.686-6-6-6S6 5.686 6 9v8l-2 2v1h16v-1l-2-2z"
      stroke="#fff"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);
