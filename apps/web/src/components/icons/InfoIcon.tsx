import type { ComponentProps } from "react";

export const InfoIcon = (props: ComponentProps<"svg">) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <circle cx="12" cy="12" r="12" fill="#3498db" /> {/* blue circle */}
            {/* dot on top */}
            <circle cx="12" cy="7.5" r="1.5" fill="white" />
            {/* vertical line for "i" */}
            <line
                x1="12"
                y1="11"
                x2="12"
                y2="17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};
