"use client";

import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import React, { useEffect } from "react";
import { useCourseContext } from "~/contexts/CourseContext";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Finix: any;
  }
}

const FinixForm = ({ onClose, setLoading, loading }) => {
  const { refetch: refetchAssociatedBanks } =
    api.cashOut.getAssociatedAccounts.useQuery({}, { enabled: false });
  const createCashoutCustomerIdentity =
    api.cashOut.createCashoutCustomerIdentity.useMutation();
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const courseId = course?.id;

  const auditLog = api.webhooks.auditLog.useMutation();
  const logAudit = () => {
    void auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: "",
      bookingId: "",
      listingId: "",
      courseId,
      eventId: "FINIX_WEB_HOOK_CASHOUT_TRANSFERED",
      json: `Cashout transfered to user id ${user?.id} `,
    });
  };

  const handleCashoutTransfer = async (token: string) => {
    await createCashoutCustomerIdentity.mutateAsync({ paymentToken: token });
  };

  useEffect(() => {
    if (typeof window.Finix !== "undefined") {
      const onSubmit = () => {
        form.submit(
          process.env.NEXT_PUBLIC_FINIX_ENVIRONMENT,
          process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID,
          async function (err, res) {
            // get token ID from response
            const tokenData = res.data || {};
            const token: string = tokenData.id;
            await handleCashoutTransfer(token);
            await refetchAssociatedBanks();
            logAudit();
            onClose();
          }
        );
      };

      const form = window.Finix.BankTokenForm("form", {
        showAddress: true,
        onSubmit,
        onLoad: () => {
          setLoading(false);
        },
      });
    }
  }, []);

  return (
    <>
      <div id="form" className={`h-full ${loading ? "hidden" : ""}`} />
    </>
  );
};

export default FinixForm;
