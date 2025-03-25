"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import * as Tabs from "@radix-ui/react-tabs";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { OpenSection } from "~/utils/tee-box-helper";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge } from "../badge";
import { FilledButton } from "../buttons/filled-button";
import { OffersReceived } from "./offers-received";
import { OffersSent } from "./offers-sent";
import { MobileCashouts } from "./mobile/mobile-cashouts";
import MobileInvitedTeeTime from "./mobile/mobile-invited-tee-time";
import { MobileMyListedTeeTimes } from "./mobile/mobile-my-listed-tee-times";
import { MobileOwned } from "./mobile/mobile-owned";
import { MobileTransactionHistory } from "./mobile/mobile-transaction-history";

export const TableViewMobile = () => {
  const { course } = useCourseContext();
  const { data: session, status } = useSession();
  const courseId = course?.id;
  const params = useSearchParams();
  const section = OpenSection.includes(params?.get("section") ?? "")
    ? params?.get("section")
    : "owned";
  const { user } = useUserContext();
  const pathname = usePathname();
  const { setPrevPath, setActivePage } = useAppContext();
  setActivePage("my-tee-box")
  const [selected, setSelected] = useState(section ?? "owned");

  const options = [{
    value: "owned",
    label: "Owned",
  }, {
    value: "invited",
    label: "Invited",
  }, {
    value: "offers-received",
    label: "Offers Received",
  }, {
    value: "offers-sent",
    label: "Offers Sent",
  }, {
    value: "transaction-history",
    label: "Transaction History",
  }, {
    value: "cashouts",
    label: "Cashouts",
  }];

  const { data: unreadOffers, refetch } =
    api.user.getUnreadOffersForCourse.useQuery(
      {
        courseId: courseId ?? "",
      },
      {
        enabled: user !== undefined && courseId !== undefined,
      }
    );

  const readOffers = api.user.readOffersForCourse.useMutation();

  const markAsRead = async () => {
    if (!courseId) return;
    try {
      await readOffers.mutateAsync({
        courseId: courseId,
      });
      await refetch();
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleSelectChange = (e) => {
    setSelected(e.target.value);

  };

  return (
    <div>
      <div className="relative w-full px-4">
        <select
          className="w-full p-2 border rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selected}
          onChange={handleSelectChange}
        >
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Tabs.Root value={selected}>
        <Tabs.List className="flex gap-10 overflow-x-auto border-b border-stroke bg-white px-6 pt-4 md:rounded-t-xl">
          <TabTrigger id="sell-owned" value={"owned"}>
            Owned
          </TabTrigger>
          <TabTrigger
            value={"my-listed-tee-times"}
            data-testid="my-listed-tee-time-id"
            id="sell-my-listed-tee-times"
          >
            My Listed Tee Times
          </TabTrigger>
          <TabTrigger value="invited-tee-times" data-testid="invited-tee-time-id">
            Invited Tee Times
          </TabTrigger>
          {course?.supportsOffers ? (
            <>
              <TabTrigger id="sell-offers-send" value={"offers-sent"}>
                Offers Sent
              </TabTrigger>
              <TabTrigger
                id="sell-offers-recieved"
                value={"offers-received"}
                handleClick={markAsRead}
              >
                Offers Received{" "}
                {unreadOffers && unreadOffers > 0 ? (
                  <Badge className="py-[.15rem] text-[12px]">
                    {unreadOffers}
                  </Badge>
                ) : null}
              </TabTrigger>
            </>
          ) : null}
          <TabTrigger id="sell-transaction-history" value={"transaction-history"}>
            Transaction History
          </TabTrigger>
          <TabTrigger id="sell-cashouts" value={"cashouts"}>
            Cashouts
          </TabTrigger>
        </Tabs.List>
        <Tabs.Content value={"owned"}>
          <MobileOwned />
        </Tabs.Content>
        <Tabs.Content value={"my-listed-tee-times"}>
          <MobileMyListedTeeTimes />
        </Tabs.Content>
        <Tabs.Content value={"invited-tee-times"}>
          <MobileInvitedTeeTime />
        </Tabs.Content>
        <Tabs.Content value={"transaction-history"}>
          <MobileInvitedTeeTime />
        </Tabs.Content>
        <Tabs.Content value={"cashouts"}>
          <MobileInvitedTeeTime />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

const TabTrigger = ({
  value,
  children,
  handleClick,
  id,
}: {
  value: string;
  children: ReactNode;
  handleClick?: () => Promise<void>;
  id?: string;
}) => {
  return (
    <Link
      href={`?section=${value}`}
      onClick={handleClick ? () => void handleClick() : undefined}
      data-testid="tab-trigger-id"
      data-qa={value}
      id={id ?? ""}
    >
      <Tabs.Trigger
        value={value}
        className="flex items-center gap-2 whitespace-nowrap pb-4 text-[16px] text-secondary-black outline-none data-[state=active]:border-b-2 data-[state=active]:border-black md:text-[24px]"
      >
        {children}
      </Tabs.Trigger>
    </Link>
  );
};
