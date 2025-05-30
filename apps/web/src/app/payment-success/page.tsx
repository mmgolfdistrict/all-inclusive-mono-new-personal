"use client";

import { Loader } from "~/components/loading/spinner";
import { api } from "~/utils/api";
import { useSearchParams } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const SplitPaymentSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") || "";
  const referencePaymentId = searchParams.get("finixReferencePaymentId") || "";
  const paymentStatus = searchParams.get("status");
  const [errorMessage, setErrorMessage] = useState("");
  const isSuccess = paymentStatus === "succeeded";
  const { data: result, isLoading: isLoading } =
    api.checkout.updateSplitPaymentStatus.useQuery({ paymentId: paymentId, referencePaymentId: referencePaymentId });
  const saveCashOutResult =
    api.checkout.saveSplitPaymentAmountIntoCashOut.useMutation();
  const saveCashOut = async () => {
    try {
      if (!result) {
        return;
      }
      if (result.error || result.amount === "" || result.bookingId === "") {
        setErrorMessage(result?.message);
        return;
      }
      const result1 = await saveCashOutResult.mutateAsync({
        amount: Number(result?.amount),
        bookingId: result?.bookingId || "",
      });
      console.log("result1", result1);
      return result1;
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    void saveCashOut().then((data) => {
      console.log("data", data);
    });
  }, [result]);

  return (
    <Fragment>
      <div className="flex items-center justify-center h-screen bg-gray-100">
        {isLoading ? (
          <Loader size={100} />
        ) : errorMessage ? <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <h2 className="text-3xl font-bold mt-4 text-red">
            Payment Status
          </h2>
          <p className="text-gray-700 mt-2">{errorMessage}</p>
          <button
            onClick={() => {
              router.push("/");
            }}
            className="mt-6 px-6 py-2 rounded-lg text-white bg-black font-medium bg-red-500 hover:bg-red-600"
          >
            Go to Dashboard
          </button>
        </div> : (
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
            <h2
              className={`text-3xl font-bold mt-4 ${isSuccess ? "text-green-600" : "text-red-600"
                }`}
            >
              {isSuccess ? "Payment Successful" : "Payment Failed"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isSuccess
                ? "Your payment has been processed successfully."
                : "Unfortunately, your payment could not be completed."}
            </p>
            <button
              onClick={() => {
                router.push("/");
              }}
              className={`mt-6 px-6 py-2 rounded-lg text-white font-medium ${isSuccess
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
                }`}
            >
              {isSuccess ? "Go to Dashboard" : "Try Again"}
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default SplitPaymentSuccessPage;
