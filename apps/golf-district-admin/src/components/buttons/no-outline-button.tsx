import type { ButtonHTMLAttributes, ReactNode } from "react";

interface NoOutlineProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const NoOutlineButton = ({
  children,
  className,
  ...rest
}: NoOutlineProps) => {
  return (
    <button
      className={`rounded-sm border-2 border-transparent bg-transparent px-4 py-2 text-primary ${
        className ?? ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
};
