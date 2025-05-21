import { type ComponentProps } from "react";

interface InfoProps extends ComponentProps<"svg"> {
  longMessage?: boolean;
  color?: string;
}

export const Info = ({ longMessage, color, ...props }: InfoProps) => (
  <svg
    width="100%"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 15 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.39941 0C3.53359 0 0.399414 3.13418 0.399414 7C0.399414 10.8658 3.53359 14 7.39941 14C11.2652 14 14.3994 10.8658 14.3994 7C14.3994 3.13418 11.2652 0 7.39941 0ZM7.39941 1.4C4.30681 1.4 1.79941 3.9074 1.79941 7C1.79941 10.0926 4.30681 12.6 7.39941 12.6C10.492 12.6 12.9994 10.0926 12.9994 7C12.9994 3.9074 10.492 1.4 7.39941 1.4Z"
      fill={longMessage ? "#ffffff" : color ? "#000000" : "#B0B7BC"}
    />
    <path
      d="M6.69934 4.2C6.69934 3.81336 7.0127 3.5 7.39934 3.5C7.78598 3.5 8.09934 3.81336 8.09934 4.2C8.09934 4.58664 7.78598 4.9 7.39934 4.9C7.0127 4.9 6.69934 4.58664 6.69934 4.2Z"
      fill={longMessage ? "#ffffff" : color ? "#000000" : "#B0B7BC"}
    />
    <path
      d="M6.69934 6.30059C6.69934 5.91395 7.0127 5.60059 7.39934 5.60059C7.78598 5.60059 8.09934 5.91395 8.09934 6.30059V9.80059C8.09934 10.1872 7.78598 10.5006 7.39934 10.5006C7.0127 10.5006 6.69934 10.1872 6.69934 9.80059V6.30059Z"
      fill={longMessage ? "#ffffff" : color ? "#000000" : "#B0B7BC"}
    />
  </svg>
);
