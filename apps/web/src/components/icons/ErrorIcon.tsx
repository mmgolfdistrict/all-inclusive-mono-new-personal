import type { ComponentProps } from "react";

export const ErrorIcon = (props: ComponentProps<"svg">) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <circle cx="12" cy="12" r="12" fill="#E74C3C" />
            <line
                x1="12"
                y1="7"
                x2="12"
                y2="13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="12" cy="17" r="1.5" fill="white" />
        </svg>
    );
};
