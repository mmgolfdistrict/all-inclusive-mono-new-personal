import Link from "next/link";
import { type AnchorHTMLAttributes, type ReactNode } from "react";

interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text: ReactNode;
  icon?: ReactNode;
  href: string;
  className?: string;
}

export const NavItem = ({
  text,
  icon,
  href,
  className,
  ...rest
}: AnchorProps) => {
  return (
    <Link
      href={href}
      {...rest}
      className={`flex flex-col md:flex-row justify-between md:justify-center items-center gap-1 ${className ?? ""
        }`}
    >
      {icon ? <div>{icon}</div> : null}
      <div>
        <div className="text-[0.75rem] md:text-sm text-center">{text}</div>
      </div>
    </Link>
  );
};
