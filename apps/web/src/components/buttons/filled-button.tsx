import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const FilledButton = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button
      className={`min-w-[6.875rem] rounded-full border-2 border-primary bg-primary px-[1.25rem] py-[0.375rem] text-white ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
};
