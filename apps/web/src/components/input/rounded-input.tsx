import { type ComponentProps } from "react";

export const RoundedInput = (props: ComponentProps<"input">) => {
  return (
    <input
      {...props}
      className={`
      h-10 w-full rounded-full border border-stroke px-4 pl-10 text-primary
        ${props.className ?? ""}
      `}
    />
  );
};
