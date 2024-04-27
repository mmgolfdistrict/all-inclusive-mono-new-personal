"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import { formatMoney } from "~/utils/formatters";
import Script from "next/script";
import { useState } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { History } from "../icons/history";
import { Wallet } from "../icons/wallet";
import Modal from "./modal";
import OptionDetails from "./SelectComponent";
import { TransactionHistory } from "./transaction-history";

export const BalanceHistory = ({ userId }: { userId: string }) => {
  const { data: user, refetch } = useUser(userId);
  const connectAccount = api.cashOut.createStripeAccountLink.useMutation();
  const createCashoutTransfer = api.cashOut.createCashoutTransfer.useMutation();
  const { data: associatedBanks, isLoading: isLoadingAssociatedBanks } =
    api.cashOut.getAssociatedAccounts.useQuery({});
  const requestCashOut = api.cashOut.requestCashOut.useMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [loadingCashout, setLoadingCashout] = useState<boolean>(false);
  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleTransferAmount = async (paymentInstrumentId, amount) => {
    try {
      setLoadingCashout(true);
      await createCashoutTransfer.mutateAsync({
        paymentInstrumentId,
        amount: Number(amount),
      });
      toast.success("Cash out requested.");
      await refetch();
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message ?? "Could not request cash out.");
    } finally {
      setLoadingCashout(false);
    }
  };

  return (
    <>
      <Modal isOpen={modalOpen} onClose={closeModal} />
      <section className="h-full mx-auto flex w-full flex-col gap-6 bg-white px-3 py-2 mb-2  md:rounded-xl md:p-6 md:py-4">
        <div>
          <h3 className="text-[18px]  md:text-[24px]">Balance</h3>
          {/* <p className=" text-[14px] text-primary-gray md:text-[16px]">
        Set how you&apos;d like your profile information to appear.
      </p> */}
        </div>
        <div className="flex flex-col items-center gap-2 lg:flex-row">
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
                onClick={openModal}
                disabled={connectAccount.isLoading}
                className={`${
                  connectAccount.isLoading
                    ? "animate-pulse cusor-not-allowed"
                    : ""
                }`}
                data-testid="connect-button-id"
              >
                Add Bank Account
              </FilledButton>
            )}
          </div>
        </div>
        <OptionDetails
          loadingCashout={loadingCashout}
          associatedBanks={associatedBanks}
          handleTransferAmount={handleTransferAmount}
        />
      </section>

      <Script src="https://js.finix.com/v/1/finix.js" />
    </>
  );
};
