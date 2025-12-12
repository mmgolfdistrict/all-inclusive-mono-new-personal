import type { ComponentProps } from "react";

export const UserIcon = (props: ComponentProps<"svg">) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            fill="white"
            width="100%"
            height="100%"
            {...props}
        >
            <circle cx="24" cy="16" r="5.5" />
            <path d="M32 36H16c-1.3 0-2.2-.9-2.2-2.2v-1.5c0-4.4 3.6-8 8-8h4.4c4.4 0 8 3.6 8 8v1.5c0 1.3-.9 2.2-2.2 2.2z" />
        </svg>
    );
};
