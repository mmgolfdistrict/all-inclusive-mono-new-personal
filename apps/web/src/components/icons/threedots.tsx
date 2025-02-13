import { type ComponentProps } from "react";

export const ThreeDots = (props: ComponentProps<"svg">) => {
    return (
        <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="10" cy="10" r="3" fill="black" />
            <circle cx="20" cy="10" r="3" fill="black" />
            <circle cx="30" cy="10" r="3" fill="black" />
        </svg>
    )
}


