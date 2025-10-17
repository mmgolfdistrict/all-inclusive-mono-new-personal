import { type ComponentProps } from "react";

export const Refresh = (props: ComponentProps<"svg">) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14 4.94099V0.823762L12.5149 2.26515C11.2 0.864693 9.29091 0 7.21239 0C3.22479 0 0 3.12982 0 7C0 10.8702 3.22397 14 7.21239 14C9.24876 14 11.0727 13.1762 12.3884 11.8592L11.2008 10.6648C10.2248 11.6939 8.78182 12.3525 7.21239 12.3525C4.15785 12.3525 1.69751 9.96461 1.69751 7.00002C1.69751 4.03543 4.15785 1.64754 7.21239 1.64754C8.82479 1.64754 10.3091 2.34778 11.3273 3.4178L9.75785 4.94101L14 4.94099Z"
      fill={props.color ?? "#40942A"}
    />
  </svg>
);
