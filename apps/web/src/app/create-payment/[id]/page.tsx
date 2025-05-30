"use client";

import { api } from "~/utils/api";
import { useParams } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";

const CreatePaymentPage = () => {
  const params = useParams();
  const [error, setError] = useState(false);
  const { id } = params;
  const { data: paymentLink } = api.checkout.getPaymentLinkByPaymentId.useQuery(
    { paymentId: id as string }
  );
  useEffect(() => {
    if (paymentLink?.paymentLink) {
      window.location.href = paymentLink.paymentLink;
    } else if (paymentLink?.error) {
      setError(true);
    }
  }, [paymentLink]);
  return (
    <Fragment>
      <div>
        {error && (
          <div className="text-red-500 font-semibold text-center">
            Your payment link has expired. Please Resend to email
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default CreatePaymentPage;
