"use client";

import { Spinner } from "~/components/loading/spinner";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function Verify() {
  const { course } = useCourseContext();
  const params = useSearchParams();
  const userId = params.get("userId");
  const verificationToken = params.get("verificationToken");

  const verifyEmail = api.register.verifyEmail.useMutation();

  const router = useRouter();
  const callingRef = useRef<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const verifyUser = async () => {
    if (!userId || !verificationToken) return;
    try {
      callingRef.current = true;
      await verifyEmail.mutateAsync({ userId, token: verificationToken });
      toast.success("Your email address has been verified!");
      callingRef.current = false;
      router.push(`/${course?.id}/login`);
    } catch (error) {
      callingRef.current = false;
      setError((error as Error)?.message ?? "An unexpected error occurred.");
      toast.error(
        (error as Error)?.message ??
          "An error occurred verifying your email address."
      );
    }
  };

  useEffect(() => {
    if (
      verificationToken &&
      userId &&
      !verifyEmail.isLoading &&
      !verifyEmail.isError &&
      !verifyEmail.isSuccess &&
      !callingRef.current &&
      !error
    ) {
      void verifyUser();
    }
  }, [verificationToken, userId, verifyEmail, error]);

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <section className="mx-auto mt-6 flex w-full text-center flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <h1 className="text-[24px] md:text-[32px]">
          {verifyEmail.isLoading && !error
            ? "Verifying Email..."
            : verifyEmail.isSuccess
            ? "Verified Email!"
            : error
            ? "Something went wrong."
            : "Verify Your Email Address"}
        </h1>
        <div className="text-primary-gray">
          {verifyEmail.isLoading && !error ? (
            <div className="w-[100px] mx-auto">
              <Spinner className="h-[50px]" />
            </div>
          ) : verifyEmail.isSuccess ? (
            "Your email address has been verified!"
          ) : error ? (
            error
          ) : (
            "An verification link was just sent to the email provided. Please open the email and click the verify button."
          )}
        </div>
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[14px] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link className="text-primary" href={`/${course?.id}/register`}>
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-[20px] md:self-end w-full h-[2px] md:w-[2px] bg-stroke" />
        <Link
          className="text-primary  md:self-end text-[14px]"
          href={`/${course?.id}/login`}
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
