"use client";

import { OutlineButton } from "~/components/buttons/outline-button";
import { NAV_LINKS } from "~/constants/nav-links";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GolfDistrict } from "../icons/golf-district";
import { NavItem } from "./nav-item";

export const Nav = () => {
  const pathname = usePathname();

  return (
    <div className="sticky flex h-[100dvh] min-w-[310px] w-[310px] overflow-y-auto flex-col gap-6 justify-between px-4 py-9 border-r border-r-[#EAEDF0]">
      <section>
        <Link href={"/reservations"}>
          <div className="mx-auto w-fit">
            <GolfDistrict color="black" id="admin-logo" className="w-[224px]" />
          </div>
        </Link>
        <div className="pt-[3.75rem] flex flex-col gap-2">
          {NAV_LINKS.map((link) => {
            const isSelected = pathname.includes(link.href);
            return (
              <NavItem
                label={link.label}
                key={`admin-nav-${link.label}`}
                href={link.href}
                isSelected={isSelected}
              />
            );
          })}
        </div>
      </section>
      <section>
        <p className="pb-3 text-center text-[12px] text-[#A7A7A7]">
          Logged in as: <span className="text-[#353B3F]">(user_email)</span>
        </p>
        <Link href={"/"}>
          <OutlineButton className="w-full py-2.5 rounded-[4px]">
            Log out
          </OutlineButton>
        </Link>
      </section>
    </div>
  );
};
