"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps } from "react";
import { LeftChevron } from "../icons/left-chevron";

export const GoBack = ({
  href,
  text,
  usePrevRoute,
  props
}: {
  href: string;
  text: string;
  props?: ComponentProps<"button">;
  usePrevRoute?: boolean;
}) => {
  const router = useRouter();

  return (
    <Link
      href={usePrevRoute ? "" : href}
      onClick={usePrevRoute ? () => router.back() : () => undefined}
      data-testid="back-to-page-id"
    >
      <button className="flex items-center gap-1" {...props} data-testid="left-chevron-id">
        <LeftChevron className="h-[14px] w-[14px]" />
        <div className="text-[14px] text-primary">{text}</div>
      </button>
    </Link>
  );
};
