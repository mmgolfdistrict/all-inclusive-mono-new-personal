import { type SVGProps } from "react";

export const GroupBooking = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Center person */}
        <circle cx="32" cy="14" r="7" />
        <path d="M20 32c0-5.5 8-8 12-8s12 2.5 12 8v6H20v-6z" />

        {/* Left person */}
        <circle cx="14" cy="24" r="6" />
        <path d="M2 40c0-4.5 7-7 10-7s10 2.5 10 7v5H2v-5z" />

        {/* Right person */}
        <circle cx="50" cy="24" r="6" />
        <path d="M42 40c0-4.5 7-7 10-7s10 2.5 10 7v5H42v-5z" />
    </svg>
);
