import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const IconButton = ({ children, className, ...rest }: IconProps) => {
  return (
    <button
      className={`flex h-[2.5rem] min-h-[2.5rem] w-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-full border-2 border-primary bg-white p-2 text-primary ${className ?? ""
        }`}
      {...rest}
    >
      {children}
    </button>
  );
};
