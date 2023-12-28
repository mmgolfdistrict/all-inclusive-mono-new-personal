import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const IconButton = ({ children, className, ...rest }: IconProps) => {
  return (
    <button
      className={`flex h-[40px] min-h-[40px] w-[40px] min-w-[40px] items-center justify-center rounded-full border-2 border-primary bg-white p-2 text-primary ${
        className ?? ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
};
