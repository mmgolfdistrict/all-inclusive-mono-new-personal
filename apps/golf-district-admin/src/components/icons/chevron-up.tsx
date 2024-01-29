import type { ComponentProps } from "react";

export const ChevronUp = (props: ComponentProps<"svg">) => {
  const { fill, ...rest } = props;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M8.99954 6.96073L14.876 12.6788C15.2613 13.0537 15.8853 13.0537 16.2705 12.6788C16.6558 12.304 16.6558 11.6968 16.2705 11.3219L9.69702 4.92493C9.5041 4.73784 9.2521 4.64396 8.99945 4.64396C8.7468 4.64396 8.49481 4.73783 8.30188 4.92493L1.72836 11.3219C1.34315 11.6968 1.34315 12.304 1.72836 12.6788C2.11358 13.0537 2.73765 13.0537 3.12287 12.6788L8.99954 6.96073Z"
        fill={fill ?? "#D7DCDE"}
      />
    </svg>
  );
};
