import { type ComponentProps } from "react";

export const Check = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11.76 3.63992L5.32002 10.9199L1.96001 7.55992"
      stroke="#353B3F"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.0383 3.32564C12.212 3.47933 12.2282 3.74476 12.0746 3.9185L5.33872 11.5329L1.66299 7.8572C1.49897 7.69318 1.49897 7.42726 1.66299 7.26324C1.82701 7.09921 2.09294 7.09921 2.25696 7.26323L5.30125 10.3075L11.4454 3.36194C11.5991 3.1882 11.8645 3.17195 12.0383 3.32564Z"
      fill="#353B3F"
    />
  </svg>
);
