import { type ComponentProps } from "react";

export const CloudyWithSun = (props: ComponentProps<"svg">) => (
  <svg
    width={props.width ?? "1.875rem"}
    height={props.height ?? "1.875rem"}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Sun */}
    <circle
      cx="26"
      cy="10"
      r="4"
      stroke="#41942A"
      strokeWidth="2.5" /* Bold outline */
    />
    <path
      d="M26 1V5"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M26 15V19"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M18 10H22"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M30 10H34"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M20.5 5.5L23 8"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M29 8L31.5 5.5"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M20.5 14.5L23 12"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M29 12L31.5 14.5"
      stroke="#41942A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Cloud */}
    <path
      d="M10 24C8.34 24 7 22.66 7 21C7 19.34 8.34 18 10 18C10.41 18 10.8 18.08 11.16 18.23C11.92 16.87 13.36 16 15 16C17.21 16 19 17.79 19 20H21C22.66 20 24 21.34 24 23C24 24.66 22.66 26 21 26H11C9.9 26 9 25.1 9 24H10Z"
      stroke="#41942A"
      strokeWidth="2.5" /* Bold outline */
      fill="none"
    />
  </svg>
);
