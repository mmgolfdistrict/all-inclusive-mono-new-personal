import type { ButtonHTMLAttributes, ReactNode } from "react";

interface SqaureButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const SquareButton = ({
  children,
  className,
  ...rest
}: SqaureButtonProps) => {
  return (
    <button className={`rounded-lg py-3.5 ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
};
