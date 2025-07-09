import type { ComponentProps } from "react";

export const CancelIcon = (props: ComponentProps<"svg">) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <circle cx="256" cy="256" r="256" fill="#e74c3c" />
            <rect x="128" y="240" width="256" height="32" rx="8" fill="#ffffff" />
        </svg>
    );
};
