"use client";

import {
  resetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@golf-district/shared/src/schema/reset-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { Input } from "~/components/input/input";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const { course } = useCourseContext();

  const params = useSearchParams();
  const userId = params.get("userId");
  const verificationToken = params.get("verificationToken");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    // @ts-ignore
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetFn = api.user.executeForgotPassword.useMutation();

  useEffect(() => {
    if (!userId || !verificationToken) return;
    setValue("userId", userId);
    setValue("verificationToken", verificationToken);
  }, [userId, verificationToken]);

  const onSubmit: SubmitHandler<ResetPasswordSchemaType> = async (data) => {
    if (resetFn.isSuccess) return;
    if (resetFn.isLoading) return;
    try {
      await resetFn.mutateAsync(data);
      toast.success("Your password has been reset!");
      router.push(`/${course?.id}/login`);
    } catch (error) {
      console.log(error);
      toast.error(
        (error as Error)?.message ??
          "An error occurred submitting your request."
      );
    }
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
            error={errors.confirmPassword?.message}
          />
          <FilledButton
            className={`w-full rounded-full ${
              resetFn.isLoading ? "animate-pulse cursor-not-allopwed" : ""
            }`}
          >
            {resetFn.isLoading ? "Submitting..." : "Submit"}
          </FilledButton>
        </form>
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
