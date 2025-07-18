"use client";

import { isValidPassword } from "@golf-district/shared";
import {
  resetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@golf-district/shared/src/schema/reset-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { IconButton } from "~/components/buttons/icon-button";
import { Hidden } from "~/components/icons/hidden";
import { Visible } from "~/components/icons/visible";
import { Input } from "~/components/input/input";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const { course } = useCourseContext();
  const { setPrevPath } = useAppContext();
  const params = useSearchParams();
  const userId = params.get("userId");
  const verificationToken = params.get("verificationToken");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      await resetFn.mutateAsync({ ...data, courseId: course?.id });
    } catch (error) {
      toast.error(
        (error as Error)?.message ??
        "An error occurred submitting your request."
      );
    }
  };

  const password = watch("password");

  const passwordFeedback = useMemo(() => {
    if (!password) return;
    const feedback = isValidPassword(password).feedback;
    return feedback;
  }, [password]);

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[1.5rem] md:pb-6 md:pt-8 md:text-[2rem]">
        Reset Password
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[31.25rem] sm:rounded-xl sm:p-6">
        {resetFn.isSuccess ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="text-[1rem] text-center fade-in text-primary-gray">
              Successfully reset password!
            </div>
            <Link href={`/${course?.id}/login`} data-testid="login-button-id">
              <FilledButton
                onClick={() => {
                  setPrevPath({
                    path: `/${course?.id}`,
                    createdAt: new Date().toISOString(),
                  });
                }}
              >
                Log In
              </FilledButton>
            </Link>
          </div>
        ) : (
          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                register={register}
                name="password"
                error={errors.password?.message}
                data-testid="reset-password-id"
              />
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%] ${errors.password?.message ? "pb-10" : ""}`}
                data-testid="show-password-id"
              >
                {showPassword ? (
                  <Hidden className="h-[0.875rem] w-[0.875rem]" />
                ) : (
                  <Visible className="h-[0.875rem] w-[0.875rem]" />
                )}
              </IconButton>
            </div>
            {passwordFeedback && passwordFeedback.length > 0 ? (
              <ul className={`flex flex-col gap-2 list-disc pl-4`}>
                {passwordFeedback?.map((advice, idx) => (
                  <li className="text-[0.75rem] text-red" key={`${idx}+passsword`}>
                    {advice}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="relative">
              <Input
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                register={register}
                name="confirmPassword"
                error={errors.confirmPassword?.message}
                data-testid="reset-confirm-password-id"
              />
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirmPassword(!showConfirmPassword);
                }}
                className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%] ${errors.confirmPassword?.message ? "pb-10" : ""}`}
                data-testid="show-confirm-password-id"
              >
                {showConfirmPassword ? (
                  <Hidden className="h-[0.875rem] w-[0.875rem]" />
                ) : (
                  <Visible className="h-[0.875rem] w-[0.875rem]" />
                )}
              </IconButton>
            </div>
            <FilledButton
              className={`w-full rounded-full ${resetFn.isLoading ? "animate-pulse cursor-not-allopwed" : ""
                }`}
              data-testid="submit-button-id"
            >
              {resetFn.isLoading ? "Submitting..." : "Submit"}
            </FilledButton>
          </form>
        )}
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[0.875rem] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary"
            href={`/${course?.id}/register`}
            data-testid="signup-button-id"
          >
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-[1.25rem] md:self-end w-full h-[0.125rem] md:w-[0.125rem] bg-stroke" />
        <Link
          className="text-primary  md:self-end text-[0.875rem]"
          href={`/${course?.id}/login`}
          data-testid="back-to-login-button-id"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
