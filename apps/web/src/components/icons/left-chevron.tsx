export const LeftChevron = ({
  fill,
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className ?? ""}
  >
    <path
      d="M5.72175 6.99982L10.1692 2.4292C10.4607 2.12959 10.4607 1.6442 10.1692 1.34459C9.87763 1.04498 9.40532 1.04498 9.11379 1.34459L4.13835 6.45733C3.99283 6.60738 3.91982 6.80338 3.91982 6.99988C3.91982 7.19639 3.99282 7.39238 4.13835 7.54244L9.11379 12.6552C9.40532 12.9548 9.87763 12.9548 10.1692 12.6552C10.4607 12.3556 10.4607 11.8702 10.1692 11.5706L5.72175 6.99982Z"
      fill={fill ?? "#353B3F"}
    />
  </svg>
);
