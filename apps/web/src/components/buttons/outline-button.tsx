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
      className={`rounded-full border-2 border-primary bg-white px-[1.25rem] py-[0.375rem] text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
};
