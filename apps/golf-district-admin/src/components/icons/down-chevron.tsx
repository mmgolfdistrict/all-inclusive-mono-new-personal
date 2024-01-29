import { type ComponentProps } from "react";

export const DownChevron = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7.00018 8.27789L11.5708 3.83047C11.8704 3.53893 12.3558 3.53893 12.6554 3.83047C12.955 4.122 12.955 4.59431 12.6554 4.88585L7.54267 9.86129C7.39262 10.0068 7.19662 10.0798 7.00012 10.0798C6.80361 10.0798 6.60762 10.0068 6.45756 9.86129L1.34483 4.88585C1.04521 4.59431 1.04521 4.122 1.34483 3.83047C1.64444 3.53893 2.12983 3.53893 2.42944 3.83047L7.00018 8.27789Z"
      fill={props.fill ?? "#A7A7A7"}
    />
  </svg>
);
