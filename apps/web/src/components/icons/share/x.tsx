import { type ComponentProps } from "react";

export const X = (props?: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_2814_14581)">
      <path
        d="M12.4027 8.65426L19.8482 0H18.0838L11.619 7.51437L6.45547 0H0.5L8.3082 11.3631L0.5 20.4384H2.26443L9.09152 12.5029L14.5445 20.4384H20.5L12.4023 8.65426H12.4027ZM9.98608 11.4632L9.19495 10.3317L2.90018 1.32817H5.61025L10.6902 8.59428L11.4813 9.72578L18.0847 19.1706H15.3746L9.98608 11.4636V11.4632Z"
        fill="#020202"
      />
    </g>
    <defs>
      <clipPath id="clip0_2814_14581">
        <rect
          width="20"
          height="20.4489"
          fill="white"
          transform="translate(0.5)"
        />
      </clipPath>
    </defs>
  </svg>
);
