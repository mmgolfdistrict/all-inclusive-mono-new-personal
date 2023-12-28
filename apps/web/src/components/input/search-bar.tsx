import type { InputHTMLAttributes } from "react";
import { Search } from "../icons/search";
import { RoundedInput } from "./rounded-input";

interface SearchProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SearchBar = ({ className, ...rest }: SearchProps) => {
  return (
    <>
      <div className="relative hidden w-full md:block md:max-w-[250px] lg:max-w-[350px]">
        <RoundedInput
          placeholder="Search by location, course, date, etc."
          className={className ?? ""}
          {...rest}
        />
        <Search className="absolute left-4 top-3.5 h-[14px] w-[14px]" />
      </div>
    </>
  );
};
