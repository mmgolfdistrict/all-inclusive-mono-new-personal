import type { ComponentProps } from "react";

// Change the url here for production

export const DownArrow = (props: ComponentProps<"img">): JSX.Element => (
  <img
    {...props}
    src="https://demo-cdn.golfdistrict.in/down-arrow-circle-svgrepo-com.svg"
    alt="Down Arrow"
    width="800"
    height="800"
  />
);
