"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { FilledButton } from "../buttons/filled-button";
import { History } from "../icons/history";
import { Wallet } from "../icons/wallet";
import { TransactionHistory } from "./transaction-history";

export const BalanceHistory = () => {
  return (
    <Tabs.Root defaultValue="balance">
      <Tabs.List className="flex w-full justify-center gap-6  border-b border-stroke bg-white px-6 pt-2 md:justify-start md:rounded-t-xl">
        <Tabs.Trigger
          value="balance"
          className="flex items-center gap-2 pb-2 text-[18px] text-secondary-black outline-none data-[state=active]:border-b-2 data-[state=active]:border-black md:text-[24px]"
        >
          <Wallet className="w-[23px]" />
          Balance
        </Tabs.Trigger>
        <Tabs.Trigger
          value="history"
          className="flex items-center gap-2 pb-2 text-[18px] text-secondary-black outline-none data-[state=active]:border-b-2 data-[state=active]:border-black md:text-[24px]"
        >
          <History className="w-[20px]" />
          History
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="balance"
        className="bg-white p-2 md:rounded-b-xl w-full flex items-center justify-center"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
            <div className="text-[24px] text-secondary-black md:text-[32px]">
              $247.99
            </div>
            <div className=" text-primary-gray">
              You need to connect your account to transfer your balance.
            </div>
          </div>
          <FilledButton>Connect Account</FilledButton>
        </div>
      </Tabs.Content>
      <Tabs.Content value="history" className="bg-white p-2">
        <TransactionHistory />
      </Tabs.Content>
    </Tabs.Root>
  );
};
