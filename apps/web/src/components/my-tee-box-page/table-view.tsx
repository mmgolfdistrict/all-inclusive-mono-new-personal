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
import { type ReactNode } from "react";
import { Badge } from "../badge";
import { FilledButton } from "../buttons/filled-button";
import { Cashouts } from "./cashouts";
import { MyListedTeeTimes } from "./my-listed-tee-times";
import { OffersReceived } from "./offers-received";
import { OffersSent } from "./offers-sent";
import { Owned } from "./owned";
import { TransactionHistory } from "./transaction-history";

export const TableView = () => {
  const { course } = useCourseContext();
  const { data: session, status } = useSession();
  const courseId = course?.id;
  const params = useSearchParams();
  const section = OpenSection.includes(params?.get("section") ?? "")
    ? params?.get("section")
    : "owned";
  const { user } = useUserContext();
  const pathname = usePathname();
  const { setPrevPath } = useAppContext();

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
      console.log(error);
    }
  };

  return (
    <Tabs.Root value={section ?? "owned"}>
      <Tabs.List className="flex gap-10 overflow-x-auto border-b border-stroke bg-white px-6 pt-4 md:rounded-t-xl">
        <TabTrigger value={"owned"}>Owned</TabTrigger>
        <TabTrigger
          value={"my-listed-tee-times"}
          data-testid="my-listed-tee-time-id"
        >
          My Listed Tee Times
        </TabTrigger>
        {course?.supportsOffers ? (
          <>
            <TabTrigger value={"offers-sent"}>Offers Sent</TabTrigger>
            <TabTrigger value={"offers-received"} handleClick={markAsRead}>
              Offers Received{" "}
              {unreadOffers && unreadOffers > 0 ? (
                <Badge className="py-[.15rem] text-[12px]">
                  {unreadOffers}
                </Badge>
              ) : null}
            </TabTrigger>
          </>
        ) : null}
        <TabTrigger value={"transaction-history"}>
          Transaction History
        </TabTrigger>
        <TabTrigger value={"cashouts"}>Cash out History</TabTrigger>
      </Tabs.List>
      {!session ? (
        status == "loading" ? null : (
          <Tabs.Content value={section ?? "owned"} className="bg-white p-2">
            <div className="min-h-[250px] flex items-center justify-center">
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
          </Tabs.Content>
        )
      ) : (
        <>
          <Tabs.Content value="owned" className="bg-white p-2">
            <Owned />
          </Tabs.Content>
          <Tabs.Content value="my-listed-tee-times" className="bg-white p-2">
            <MyListedTeeTimes />
          </Tabs.Content>
          <Tabs.Content value="offers-sent" className="bg-white p-2">
            <OffersSent />
          </Tabs.Content>
          <Tabs.Content value="offers-received" className="bg-white p-2">
            <OffersReceived />
          </Tabs.Content>
          <Tabs.Content value="transaction-history" className="bg-white p-2">
            <TransactionHistory />
          </Tabs.Content>
          <Tabs.Content value="cashouts" className="bg-white p-2">
            <Cashouts />
          </Tabs.Content>
        </>
      )}
    </Tabs.Root>
  );
};

const TabTrigger = ({
  value,
  children,
  handleClick,
}: {
  value: string;
  children: ReactNode;
  handleClick?: () => Promise<void>;
}) => {
  return (
    <Link
      href={`?section=${value}`}
      onClick={handleClick ? () => void handleClick() : undefined}
      data-testid="tab-trigger-id"
      data-qa={value}
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
