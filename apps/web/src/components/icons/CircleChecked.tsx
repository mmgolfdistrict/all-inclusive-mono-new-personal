import type { ComponentProps } from "react";

export const CircleChecked = (props: ComponentProps<"svg">) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={props.fill ?? "green"}
            {...props}
        >
            <circle cx="12" cy="12" r="12" fill={props.fill ?? "green"} />
            <path
                d="M6 12l4 4 8-8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
