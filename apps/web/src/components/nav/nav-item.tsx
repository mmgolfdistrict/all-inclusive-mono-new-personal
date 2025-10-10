import Link from "next/link";
import { type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  text: ReactNode;
  icon?: ReactNode;
  className?: string;
};

type DivProps = HTMLAttributes<HTMLDivElement> & {
  text: ReactNode;
  icon?: ReactNode;
  className?: string;
};

type NavItemProps = LinkProps | DivProps;

export const NavItem = (props: NavItemProps) => {
  if ("href" in props && props.href) {
    const { text, icon, href, className, ...rest } = props;
    return (
      <Link
        href={href}
        {...rest}
        className={`flex flex-col md:flex-row justify-between md:justify-center items-center gap-1 ${className ?? ""}`}
      >
        {icon ? <div>{icon}</div> : null}
        <div>
          <div className="text-[0.75rem] md:text-sm text-center">{text}</div>
        </div>
      </Link>
    );
  }
  const { text, icon, className, ...rest } = props;
  return (
    <div
      {...(rest as HTMLAttributes<HTMLDivElement>)}
      className={`flex flex-col md:flex-row justify-between md:justify-center items-center gap-1 ${className ?? ""}`}
    >
      {icon ? <div>{icon}</div> : null}
      <div>
        <div className="text-[0.75rem] md:text-sm text-center">{text}</div>
      </div>
    </div>
  );
};
