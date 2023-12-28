import { type ComponentProps } from "react";

export const Success = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20Z"
      fill="white"
    />
    <path
      d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM9.0026 14L16.0737 6.92893L14.6595 5.51472L9.0026 11.1716L6.17421 8.3431L4.75999 9.7574L9.0026 14Z"
      fill="#74E040"
    />
    <path
      d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM9.0026 14L16.0737 6.92893L14.6595 5.51472L9.0026 11.1716L6.17421 8.3431L4.75999 9.7574L9.0026 14Z"
      fill="black"
      fillOpacity="0.2"
    />
  </svg>
);
