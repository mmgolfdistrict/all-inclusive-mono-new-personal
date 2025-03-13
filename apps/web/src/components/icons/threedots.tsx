import { type ComponentProps } from "react";

interface ThreeDotsProps extends ComponentProps<"svg"> {
    direction?: "horizontal" | "vertical";
}

export const ThreeDots = ({ direction = "horizontal", ...props }: ThreeDotsProps) => {
    const isVertical = direction === "vertical";

    return (
        <svg width={isVertical ? 20 : 30} height={isVertical ? 30 : 20} xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx={isVertical ? 10 : 5} cy={isVertical ? 5 : 10} r="3" fill="black" />
            <circle cx={isVertical ? 10 : 15} cy={isVertical ? 15 : 10} r="3" fill="black" />
            <circle cx={isVertical ? 10 : 25} cy={isVertical ? 25 : 10} r="3" fill="black" />
        </svg>
    );
};
