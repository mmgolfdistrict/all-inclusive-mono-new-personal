import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const FilledButton = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button
      className={`min-w-[6.875rem] rounded-full border-2 border-primary bg-primary px-5 py-1.5 text-white ${className ?? ""
        }`}
      {...rest}
    >
      {children}
    </button>
  );
};
