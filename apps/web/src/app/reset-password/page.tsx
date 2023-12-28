"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { Input } from "~/components/input/input";
import {
  resetPasswordSchema,
  type ResetPasswordSchemaType,
} from "~/schema/reset-password-schema";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";

export default function ResetPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    // @ts-ignore
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit: SubmitHandler<ResetPasswordSchemaType> = (data) => {
    // console.log((data.profilePhoto as FileList)?.[0]);
    console.log("data to submit", data);
  };

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Reset Password
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Password"
            type="password"
            id="password"
            placeholder="Enter your password"
            register={register}
            name="password"
            error={errors.password?.message}
          />
          <Input
            label="Confirm Password"
            type="confirmPassword"
            id="confirmPassword"
            placeholder="Confirm your password"
            register={register}
            name="confirmPassword"
            error={errors.password?.message}
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
