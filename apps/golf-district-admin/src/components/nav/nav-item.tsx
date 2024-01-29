import { ChevronUp } from "~/components/icons/chevron-up";
import Link from "next/link";

interface NavItemProps {
  label: string;
  href: string;
  isSelected: boolean;
}

export const NavItem = ({ label, href, isSelected }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex gap-3 items-center border border-transparent !transition-all rounded-[5px] px-3 py-2 duration-150 ease-in-out hover:bg-primary-text/40 ${
        isSelected
          ? "bg-[#F7F7F7] text-[#262626]"
          : "text-[#A7A7A7] hover:bg-[#F7F7F780] hover:text-[#26262680] hover:border-[#26262620] hover:border"
      }`}
    >
      <ChevronUp
        className={`h-5 w-[18px] rotate-90`}
        fill={isSelected ? "#262626" : "#A7A7A7"}
      />
      <p className="capitalize">{label}</p>
    </Link>
  );
};
