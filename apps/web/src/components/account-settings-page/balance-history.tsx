"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import Script from "next/script";
import { useState } from "react";
import { toast } from "react-toastify";
import { FilledButton } from "../buttons/filled-button";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";
import Modal from "./modal";
import OptionDetails from "./SelectComponent";

export const BalanceHistory = ({ userId }: { userId: string }) => {
  const { data: user, refetch } = useUser(userId);
  const connectAccount = api.cashOut.createStripeAccountLink.useMutation();
  const createCashoutTransfer = api.cashOut.createCashoutTransfer.useMutation();
  const { data: associatedBanks } = api.cashOut.getAssociatedAccounts.useQuery(
    {}
  );
  const { data: recievableData, refetch: refetchRecievableData } =
    api.cashOut.getRecievables.useQuery({});
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingCashout, setLoadingCashout] = useState<boolean>(false);
  const { course } = useCourseContext();
  const courseId = course?.id ?? "";
  const hasAddress =
    user?.address1 && user.city && user.state && user.zipcode && user.country;
  const openModal = () => {
    if (hasAddress) {
      setModalOpen(true);
    } else {
      toast.error("Please add address before adding bank account");
      return;
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleTransferAmount = async (paymentInstrumentId, amount) => {
    try {
      setLoadingCashout(true);
      if (amount > (recievableData?.withdrawableAmount ?? 0)) {
        toast.error("Amount cannot be greater then withdrawable amount");
        return;
      }
      if (amount <= 0) {
        toast.error("Please enter valid amount");
      }
      const response = await createCashoutTransfer.mutateAsync({
        paymentInstrumentId,
        amount: Number(amount),
        courseId,
      });
      if ((response as { success: boolean; error: boolean }).success) {
        toast.success(`Cash out requested for $${amount}`);
        await refetch();
        await refetchRecievableData();
      } else {
        toast.error(
          (response as Error).message ??
          "Could not request cashout at this moment. Please try later."
        );
      }
    } catch (error) {
      toast.error((error as Error).message ?? "Could not request cash out.");
    } finally {
      setLoadingCashout(false);
    }
  };

  return (
    <>
      <Modal isOpen={modalOpen} onClose={closeModal} />
      <section className="h-full mx-auto flex w-full flex-col gap-6 bg-white px-3 py-2 mb-2  md:rounded-xl md:p-6 md:py-4" id="add-bank-account-account-settings">
        <div>
          <h3 className="text-[18px]  md:text-[24px]">Balance</h3>
          <p className="text-justify text-[14px] text-primary-gray md:text-[16px]">
            You can cashout once a day up to $3000.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 lg:flex-row">
          <div className="flex flex-col w-full h-full items-center justify-center gap-2 ">
            <div
              className="py-4"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                width: "100%",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex">
                  <p className="text-gray-600 md:text-[24px]">
                    Processing Funds:&nbsp;
                  </p>
                  <p className="text-gray-800 md:text-[24px]">{`$${(
                    (recievableData?.availableAmount ?? 0) -
                    (recievableData?.withdrawableAmount ?? 0)
                  ).toFixed(2) || 0
                    }`}</p>
                </div>
                <Tooltip
                  trigger={<Info className="h-[20px] w-[20px]" />}
                  content="These funds are currently being processed and will be available for withdrawal soon. Processing typically takes 5-8 business days."
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex">
                  <p className="text-gray-600 md:text-[24px]">
                    Available Funds:&nbsp;
                  </p>
                  <p className="text-gray-800 md:text-[24px]">{`$${recievableData?.withdrawableAmount.toFixed(2) || 0
                    }`}</p>
                </div>
                <Tooltip
                  trigger={<Info className="h-[20px] w-[20px]" />}
                  content="These funds have completed processing and are now available for withdrawal. You can transfer these funds to your bank account. All bank information is handled through a secure PCI compliant third party and handled with care."
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
              {/* <div className="text-[24px] text-secondary-black md:text-[32px]">
                {formatMoney(user?.balance ?? 0 / 100)}
              </div> */}
              {user?.stripeConnectAccountStatus === "CONNECTED" ||
                associatedBanks?.length ? null : (
                <div className="text-justify text-primary-gray">
                  You need to connect your account to transfer your balance.
                </div>
              )}
            </div>

            <FilledButton

              onClick={openModal}
              disabled={connectAccount.isLoading}
              className={`${connectAccount.isLoading
                ? "animate-pulse cusor-not-allowed"
                : ""
                }`}
              data-testid="connect-button-id"
            >
              {associatedBanks?.length
                ? "Add another bank account"
                : "Add Bank Account"}
            </FilledButton>
          </div>
        </div>
        <OptionDetails
          loadingCashout={loadingCashout}
          associatedBanks={associatedBanks}
          handleTransferAmount={handleTransferAmount}
          disabledCashOut={recievableData?.withdrawableAmount ? false : true}
        />
      </section>

      <Script src="https://js.finix.com/v/1/finix.js" />
    </>
  );
};
