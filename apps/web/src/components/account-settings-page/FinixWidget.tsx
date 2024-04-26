"use client";

import { api } from "~/utils/api";
import React, { useEffect } from "react";

declare global {
  interface Window {
    Finix: any;
  }
}

const FinixForm = ({ onClose }) => {
  const createCashoutCustomerIdentity =
    api.cashOut.createCashoutCustomerIdentity.useMutation();

  const handleCashoutTransfer = async (token: string) => {
    await createCashoutCustomerIdentity.mutateAsync({ paymentToken: token });
  };

  useEffect(() => {
    if (typeof window.Finix !== "undefined") {
      const onSubmit = () => {
        form.submit(
          "sandbox",
          process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID,
          async function (err, res) {
            // get token ID from response
            const tokenData = res.data || {};
            const token: string = tokenData.id;
            await handleCashoutTransfer(token);
            onClose();
          }
        );
      };

      const form = window.Finix.BankTokenForm("form", {
        showAddress: true,
        onSubmit,
      });
    }
  }, []);

  return (
    <>
      <div id="form" />
    </>
  );
};

export default FinixForm;
