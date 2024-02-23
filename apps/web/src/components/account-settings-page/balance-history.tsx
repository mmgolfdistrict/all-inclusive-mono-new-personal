"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import { formatMoney } from "~/utils/formatters";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { History } from "../icons/history";
import { Wallet } from "../icons/wallet";
import { TransactionHistory } from "./transaction-history";

export const BalanceHistory = ({ userId }: { userId: string }) => {
  const { data: user, refetch } = useUser(userId);
  const connectAccount = api.cashOut.createStripeAccountLink.useMutation();
  const requestCashOut = api.cashOut.requestCashOut.useMutation();

  const handleConnectAccount = async () => {
    try {
      const res = await connectAccount.mutateAsync({
        accountSettingsHref: window.location.href,
      });
      if (res.url) {
        //open up new tab with stripe connect link
        window.open(res.url, "_blank");
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message ?? "Could not connect account.");
    }
  };

  const handleRequestCashOut = async () => {
    try {
      await requestCashOut.mutateAsync({ userId: userId });
      toast.success("Cash out requested.");
      await refetch();
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message ?? "Could not request cash out.");
    }
  };

  return (
    <Tabs.Root defaultValue="balance">
      <Tabs.List className="flex w-full justify-center gap-6  border-b border-stroke bg-white px-6 pt-2 md:justify-start md:rounded-t-xl">
        <Tabs.Trigger
          value="balance"
          className="flex items-center gap-2 pb-2 text-[18px] text-secondary-black outline-none data-[state=active]:border-b-2 data-[state=active]:border-black md:text-[24px]"
          data-testid="account-balance-id"
        >
          <Wallet className="w-[23px]" />
          Balance
        </Tabs.Trigger>
        <Tabs.Trigger
          value="history"
          className="flex items-center gap-2 pb-2 text-[18px] text-secondary-black outline-none data-[state=active]:border-b-2 data-[state=active]:border-black md:text-[24px]"
          data-testid="account-history-id"
        >
          <History className="w-[20px]" />
          History
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="balance"
        className="bg-white px-2 py-4 md:rounded-b-xl w-full h-full  flex items-center justify-center"
      >
        <div className="flex flex-col h-full items-center justify-center gap-2 md:min-h-[220px]">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
            <div className="text-[24px] text-secondary-black md:text-[32px]">
              {formatMoney(user?.balance ?? 0 / 100)}
            </div>
            {user?.stripeConnectAccountStatus === "CONNECTED" ? null : (
              <div className="text-primary-gray">
                You need to connect your account to transfer your balance.
              </div>
            )}
          </div>
          {user?.stripeConnectAccountStatus === "CONNECTED" ? (
            <FilledButton
              onClick={() => void handleRequestCashOut()}
              disabled={requestCashOut.isLoading}
              className={`min-w-[150px] ${
                connectAccount.isLoading
                  ? "animate-pulse cusor-not-allowed"
                  : ""
              }`}
              data-testid="cash-out-button-id"
            >
              Cash Out
            </FilledButton>
          ) : (
            <FilledButton
              onClick={() => void handleConnectAccount()}
              disabled={connectAccount.isLoading}
              className={`${
                connectAccount.isLoading
                  ? "animate-pulse cusor-not-allowed"
                  : ""
              }`}
              data-testid="connect-button-id"
            >
              {connectAccount.isLoading
                ? "Connecting..."
                : "Connect Stripe Account"}
            </FilledButton>
          )}
        </div>
      </Tabs.Content>
      <Tabs.Content value="history" className="bg-white p-2">
        <TransactionHistory />
      </Tabs.Content>
    </Tabs.Root>
  );
};
