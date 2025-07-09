import { type SVGAttributes } from "react";

export const Close = ({ color = "#353B3F", ...rest }: SVGAttributes<SVGElement>) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 25 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20.1013 5.7519C20.3942 6.04479 20.3942 6.51966 20.1013 6.81256L6.31268 20.6011C6.01979 20.894 5.54491 20.894 5.25202 20.6011C4.95913 20.3082 4.95913 19.8334 5.25202 19.5405L19.0406 5.7519C19.3335 5.459 19.8084 5.459 20.1013 5.7519Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.7476 20.601C19.4547 20.8939 18.9798 20.8939 18.687 20.601L4.89837 6.81243C4.60548 6.51954 4.60548 6.04467 4.89837 5.75177C5.19127 5.45888 5.66614 5.45888 5.95903 5.75177L19.7476 19.5404C20.0405 19.8333 20.0405 20.3081 19.7476 20.601Z"
      fill={color}
    />
  </svg>
);
