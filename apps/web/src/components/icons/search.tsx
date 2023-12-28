import { type SVGAttributes } from "react";

interface SearchIconProps extends SVGAttributes<SVGElement> {
  className?: string;
  fill?: string;
}

export const Search = ({ className, fill, ...rest }: SearchIconProps) => {
  return (
    <svg
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? ""}
      {...rest}
    >
      <path
        d="M19.6334 17.871L15.7624 13.9984C18.6588 10.1278 17.8691 4.64195 13.9984 1.74551C10.1278 -1.15092 4.64195 -0.361157 1.74551 3.50949C-1.15092 7.38013 -0.361157 12.866 3.50949 15.7624C6.61871 18.0891 10.8892 18.0891 13.9984 15.7624L17.871 19.635C18.3577 20.1217 19.1467 20.1217 19.6333 19.635C20.12 19.1483 20.12 18.3593 19.6333 17.8727L19.6334 17.871ZM8.78623 15.015C5.34618 15.015 2.55751 12.2263 2.55751 8.78623C2.55751 5.34618 5.34618 2.55751 8.78623 2.55751C12.2263 2.55751 15.015 5.34618 15.015 8.78623C15.0113 12.2247 12.2248 15.0113 8.78623 15.015Z"
        fill={fill ?? "#353B3F"}
      />
    </svg>
  );
};
