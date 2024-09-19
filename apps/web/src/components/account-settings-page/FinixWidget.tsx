"use client";

import { LoadingContainer } from "~/app/[course]/loader";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [showError, setShowError] = useState(false);
  const [showLoadingSubmit, setShowLoadingSubmit] = useState(false);
  const courseId = course?.id;

  const auditLog = api.webhooks.auditLog.useMutation();
  const logAudit = () => {
    void auditLog.mutateAsync({
      userId: user?.id ?? "",
      teeTimeId: "",
      bookingId: "",
      listingId: "",
      courseId,
      eventId: "FINIX_WEB_HOOK_ACCOUNT_ADDED",
      json: `Bank account added for user ${user?.id} `,
    });
  };

  const handleCashoutTransfer = async (token: string) => {
    return await createCashoutCustomerIdentity.mutateAsync({
      paymentToken: token,
    });
  };

  useEffect(() => {
    if (typeof window.Finix !== "undefined") {
      const onSubmit = () => {
        if (
          form.state.account_type.selected == "BUSINESS_CHECKING" ||
          form.state.account_type.selected == "BUSINESS_SAVINGS"
        ) {
          setShowError(true);
          return;
        }
        setShowLoadingSubmit(true);
        setShowError(false);
        try {
          form.submit(
            process.env.NEXT_PUBLIC_FINIX_ENVIRONMENT,
            process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID,
            async function (err, res) {
              if (err) {
                setShowLoadingSubmit(false);
                return;
              }

              // get token ID from response
              const tokenData = res.data || {};
              const token: string = tokenData.id;
              const response = await handleCashoutTransfer(token);
              if (response.error) {
                toast.error(response.message);
                onClose();
                setShowLoadingSubmit(false);
                return;
              }
              await refetchAssociatedBanks();
              logAudit();
              toast.success("Bank account added successfully .");
              onClose();
              setShowLoadingSubmit(false);
            }
          );
        } catch (err) {
          setShowLoadingSubmit(false);
        }
      };

      const form = window.Finix.BankTokenForm("form", {
        showAddress: true,
        labels: {
          bank_code: "Routing Number",
        },
        onSubmit,
        onLoad: () => {
          setLoading(false);
        },
      });
    }
  }, []);

  return (
    <>
      {showError ? (
        <div style={{ color: "red", margin: "10px 0px" }}>
          We do not support Business Checking and Business Savings”.
        </div>
      ) : null}
      <LoadingContainer isLoading={showLoadingSubmit}>
        <div></div>
      </LoadingContainer>
      <div id="form" className={`h-full ${loading ? "hidden" : ""}`} />
    </>
  );
};

export default FinixForm;
