"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { Input } from "~/components/input/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "~/schema/forgot-password-schema";
import Link from "next/link";
import { createRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";

export default function ForgotPassword() {
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

  const onSubmit: SubmitHandler<ForgotPasswordSchemaType> = (data) => {
    // console.log((data.profilePhoto as FileList)?.[0]);
    console.log("data to submit", data);
  };

  const onReCAPTCHAChange = (captchaCode: string | null | undefined) => {
    // If the reCAPTCHA code is null or undefined indicating that
    // the reCAPTCHA was expired then return early
    if (!captchaCode) {
      return;
    }
    setValue("ReCAPTCHA", captchaCode);
    // console.log(captchaCode);
    // Else reCAPTCHA was executed successfully so proceed with the
    // alert
    // alert(`approved`);
    // Reset the reCAPTCHA so that it can be executed again if user
    // submits another email.
    // void recaptchaRef.current?.reset();
  };

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Forgot Password
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <div className="pt-4 text-[16px] text-primary-gray">
          Enter the amil address that you used to create your account.
        </div>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            id="email"
            placeholder="Enter your email address"
            register={register}
            name="email"
            error={errors.email?.message}
          />
          <ReCAPTCHA
            size="normal"
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
            onChange={onReCAPTCHAChange}
            ref={recaptchaRef}
          />
          <FilledButton className="w-full rounded-full">Submit</FilledButton>
        </form>
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[14px] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link className="text-primary" href="/register">
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-[20px] md:self-end w-full h-[2px] md:w-[2px] bg-stroke" />
        <Link className="text-primary  md:self-end text-[14px]" href="/login">
          Back to Login
        </Link>
      </div>
    </main>
  );
}
