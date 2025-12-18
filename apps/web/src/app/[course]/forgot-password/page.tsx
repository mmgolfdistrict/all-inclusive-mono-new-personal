"use client";

import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "@golf-district/shared/src/schema/forgot-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { Input } from "~/components/input/input";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { createRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from "~/contexts/AppContext";

export default function ForgotPassword() {
  const { course } = useCourseContext();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    // @ts-ignore
    resolver: zodResolver(forgotPasswordSchema),
  });
  const recaptchaRef = createRef<ReCAPTCHA>();
  const forgotFn = api.user.forgotPasswordRequest.useMutation();
  const { entity } = useAppContext();

  useEffect(() => {
    const href = window.location.href;
    const cleanedHref = href.split("/forgot-password")[0];
    if (!cleanedHref) return;
    setValue("redirectHref", cleanedHref);
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true") {
      recaptchaRef.current?.execute();
    }
  }, [recaptchaRef]);

  const onSubmit: SubmitHandler<ForgotPasswordSchemaType> = async (data) => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !data.ReCAPTCHA) {
      toast.info("Please verify you are not a robot.");
      return;
    }
    if (forgotFn.isSuccess) return;
    if (forgotFn.isLoading) return;
    try {
      const forgotPasswordData = { ...data, courseProviderId: course?.id, color1: entity?.color1 ?? "#000000" };
      const result = await forgotFn.mutateAsync(forgotPasswordData);
      if (result.error) {
        toast.error(result.message);
      } else {
        toast.success(result.message, {
          progressStyle: {
            background: entity?.color1,
          },
        });
      }
    } catch (error) {
      await recaptchaRef.current?.executeAsync();
      toast.error(
        (error as Error)?.message ??
        "An error occurred submitting your request."
      );
    }
  };

  const onReCAPTCHAChange = (captchaCode: string | null | undefined) => {
    // If the reCAPTCHA code is null or undefined indicating that
    // the reCAPTCHA was expired then return early
    if (!captchaCode) {
      return;
    }
    setValue("ReCAPTCHA", captchaCode);
  };

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[1.5rem] md:pb-6 md:pt-8 md:text-[2rem]">
        Forgot Password
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[31.25rem] sm:rounded-xl sm:p-6">
        {forgotFn.isSuccess && !forgotFn.data.error ? (
          <div className="text-[1rem] text-center fade-in text-primary-gray">
            If your email exists in a Golf District account with the email
            provided then you should receive a password reset link. Please open
            the email and click the reset button.
          </div>
        ) : (
          <>
            <div className="pt-4 text-[1rem] text-primary-gray">
              Enter the email address that you used to create your account.
            </div>
            <form
              className="flex flex-col gap-2"
              onSubmit={handleSubmit(onSubmit)}
            >
              <Input
                label="Email"
                type="email"
                id="email"
                placeholder="Enter your email address"
                register={register}
                name="email"
                error={errors.email?.message}
                data-testid="forgot-password-email-id"
              />
              {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                <ReCAPTCHA
                  size={
                    process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true"
                      ? "invisible"
                      : "normal"
                  }
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
                  onChange={onReCAPTCHAChange}
                  ref={recaptchaRef}
                  data-testid="forgot-password-recaptcha-id"
                />
              )}
              {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
                errors?.ReCAPTCHA?.message && (
                  <div className="text-[0.75rem] text-red">
                    {errors.ReCAPTCHA?.message}
                  </div>
                )}
              <FilledButton
                className={`w-full rounded-full ${forgotFn.isLoading ? "animate-pulse cursor-not-allopwed" : ""
                  }`}
                data-testid="forgot-password-submit-id"
              >
                {forgotFn.isLoading ? "Submitting..." : "Submit"}
              </FilledButton>
            </form>
          </>
        )}
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[0.875rem] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary"
            href={`/${course?.id}/register`}
            data-testid="signup-button-id" prefetch={false}
          >
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-5 md:self-end w-full h-0.5 md:w-0.5 bg-stroke" />
        <Link
          className="text-primary  md:self-end text-[0.875rem]"
          href={`/${course?.id}/login`}
          data-testid="login-button-id" prefetch={false}
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
