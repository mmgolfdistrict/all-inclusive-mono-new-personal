import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const FilledButton = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button
      className={`rounded-sm border-2 border-primary bg-primary px-4 py-2 text-white ${
        className ?? ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
};
