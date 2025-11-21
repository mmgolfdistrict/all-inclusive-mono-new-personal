"use client";

import dynamic from "next/dynamic";
import { useSession } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { OpenSection } from "~/utils/tee-box-helper";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "../badge";
import { MobileCashouts } from "./mobile/mobile-cashouts";
import MobileInvitedTeeTime from "./mobile/mobile-invited-tee-time";
import Link from "next/link";
import { FilledButton } from "../buttons/filled-button";

const OffersReceived = dynamic(
  () => import("./offers-received").then((mod) => mod.default),
  { ssr: false }
);

const OffersSent = dynamic(
  () => import("./offers-sent").then((mod) => mod.default),
  { ssr: false }
);

const MobileOwned = dynamic(
  () => import("./mobile/mobile-owned").then((mod) => mod.default),
  { ssr: false }
);

const MobileMyListedTeeTimes = dynamic(
  () => import("./mobile/mobile-my-listed-tee-times").then((mod) => mod.default),
  { ssr: false }
);

const MobileTransactionHistory = dynamic(
  () => import("./mobile/mobile-transaction-history").then((mod) => mod.default),
  { ssr: false }
);

export default function TableViewMobile() {
  const { course } = useCourseContext();
  const { data: session, status } = useSession();
  const courseId = course?.id;
  const params = useSearchParams();
  const section = OpenSection.includes(params?.get("section") ?? "")
    ? params?.get("section")
    : "owned";
  const { user } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const { setPrevPath, setActivePage } = useAppContext();
  const [selected, setSelected] = useState<string>(section ?? "owned");

  useEffect(() => {
    setActivePage("my-tee-box");
  }, []);

  const options = [{
    value: "owned",
    label: "Owned",
  }, {
    value: "my-listed-tee-times",
    label: "My Listed Tee Times",
  }, {
    value: "invited-tee-times",
    label: "Invited Tee Times",
  }, {
    value: "transaction-history",
    label: "Transaction History",
  }, {
    value: "withdrawal",
    label: "Withdrawal",
  }];

  if (course?.supportsOffers) {
    options.push({
      value: "offers-sent",
      label: "Offers Sent",
    });
    options.push({
      value: "offers-received",
      label: "Offers Received",
    });
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
    const newParams = new URLSearchParams(params);
    newParams.set("section", e.target.value);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const { data: unreadOffers } =
    api.user.getUnreadOffersForCourse.useQuery(
      {
        courseId: courseId ?? "",
      },
      {
        enabled: user !== undefined && courseId !== undefined,
      }
    );

  return (
    <div className="">
      <div className="relative w-full px-4">
        <select
          className="w-full p-2 border rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selected}
          onChange={handleSelectChange}
        >
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}{" "}
              {option.value === "offers-received" && unreadOffers && unreadOffers > 0 ? (
                <Badge className="py-[.15rem] text-[12px]">
                  {unreadOffers}
                </Badge>
              ) : null}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2">
        {!session ? (
          status == "loading" ? null : (
            <div className="min-h-[120px] flex items-center justify-center">
              <Link
                href={`/${courseId}/login`}
                onClick={() => {
                  setPrevPath({
                    path: pathname,
                    createdAt: new Date().toISOString(),
                  });
                }}
                data-testid="login-to-view-id"
              >
                <FilledButton>Login to view</FilledButton>
              </Link>
            </div>
          )
        ) : (
          <>
            {selected === "owned" && <MobileOwned />}
            {selected === "my-listed-tee-times" && <MobileMyListedTeeTimes />}
            {selected === "invited-tee-times" && <MobileInvitedTeeTime />}
            {course?.supportsOffers ? (
              <>
                {selected === "offers-sent" && <OffersSent />}
                {selected === "offers-received" && <OffersReceived />}
              </>
            ) : null}
            {selected === "transaction-history" && <MobileTransactionHistory />}
            {selected === "withdrawal" && <MobileCashouts />}
          </>
        )}
      </div>
    </div>
  );
};
