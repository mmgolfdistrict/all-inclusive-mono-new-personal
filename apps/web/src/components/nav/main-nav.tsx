"use client";

import { useAppContext } from "~/contexts/AppContext";
import Link from "next/link";
import { BlurImage } from "../images/blur-image";
import { PoweredBy } from "../powered-by";

export const MainNav = () => {
  const { entity } = useAppContext();

  return (
    <div>
      <div className={`fixed z-10 w-full bg-white transition-all top-0`}>
        <div className="relative z-10 min-h-[75px] md:min-h-[95px] flex w-full items-center justify-end border-b border-stroke-secondary bg-white p-4 md:p-6">
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform`}
          >
            <Link href="/" data-testid="resort-logo-id">
              <BlurImage
                src={entity?.logo ?? ""}
                alt={entity?.name ?? "resort logo"}
                width={60}
                height={100}
              />
            </Link>
          </div>
          <div className="flex items-center align-end gap-6 md:gap-4">
            <div>
              <PoweredBy id="powered-by-sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
