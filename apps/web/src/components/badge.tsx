import { type ReactNode } from "react";

export const Badge = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`flex min-w-[22px] items-center justify-center rounded-full bg-alert-red px-1.5 text-white ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
};
