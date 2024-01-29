import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const OutlineButton = ({
  children,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={`rounded-sm border-2 border-primary bg-white px-4 py-2 text-primary ${
        className ?? ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
};
