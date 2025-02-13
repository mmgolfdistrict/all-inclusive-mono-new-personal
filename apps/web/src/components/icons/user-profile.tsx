
import type { ComponentProps } from "react";

export const UserProfile = (props: ComponentProps<"svg">) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" enableBackground="new 0 0 32 32" xmlSpace="preserve" {...props}>
            <path d="M16 31C7.729 31 1 24.271 1 16S7.729 1 16 1s15 6.729 15 15-6.729 15-15 15zm0-28C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3z" />
            <circle cx="16" cy="11.368" r="3.368" />
            <path d="M20.673 24h-9.346c-.83 0-1.502-.672-1.502-1.502v-.987a5.404 5.404 0 0 1 5.403-5.403h1.544a5.404 5.404 0 0 1 5.403 5.403v.987c0 .83-.672 1.502-1.502 1.502z" />
        </svg>
    );
};
