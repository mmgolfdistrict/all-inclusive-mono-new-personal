"use client";

import { signIn } from "@golf-district/auth/nextjs-exports";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { IconButton } from "~/components/buttons/icon-button";
import { SquareButton } from "~/components/buttons/square-button";
import { Apple } from "~/components/icons/apple";
import { Facebook } from "~/components/icons/facebook";
import { Google } from "~/components/icons/google";
import { Hidden } from "~/components/icons/hidden";
import { Visible } from "~/components/icons/visible";
import { Input } from "~/components/input/input";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { loginSchema, type LoginSchemaType } from "~/schema/login-schema";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createRef, useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

export default function Login() {
  const recaptchaRef = createRef<ReCAPTCHA>();
  const { prevPath } = useAppContext();
  const searchParams = useSearchParams();
  const loginError = searchParams.get("error");
  const { course } = useCourseContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (loginError === "CallbackRouteError") {
      toast.error("An error occurred logging in, try another option.");
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,

    formState: { errors },
  } = useForm<LoginSchemaType>({
    // @ts-ignore
    resolver: zodResolver(loginSchema),
  });
  const GO_TO_PREV_PATH =
    !prevPath?.includes("/login") &&
    !prevPath?.includes("verify") &&
    !prevPath?.includes("reset-password") &&
    !prevPath?.includes("forgot-password") &&
    !prevPath?.includes("verify-email");

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    try {
      const res = await signIn("credentials", {
        callbackUrl: `${window.location.origin}${
          GO_TO_PREV_PATH ? prevPath : "/"
        }`,
        redirect: false,
        email: data.email,
        password: data.password,
        ReCAPTCHA: data.ReCAPTCHA,
      });
      if (res?.error) {
        toast.error("The email or password you entered is incorrect.");
        setValue("password", "");
      } else if (!res?.error && res?.ok) {
        window.location.reload();
        window.location.href = `${window.location.origin}${
          GO_TO_PREV_PATH ? prevPath : "/"
        }`;
      }
    } catch (error) {
      console.log(error);
      toast.error(
        (error as Error)?.message ??
          "An error occurred logging in, try another option."
      );
    }
  };

  useEffect(() => {
    if (
      errors.ReCAPTCHA?.message &&
      !errors.email?.message &&
      !errors.password?.message
    ) {
      toast.info("Please verify you are not a robot.");
    }
  }, [errors]);

  const onReCAPTCHAChange = (captchaCode: string | null | undefined) => {
    // If the reCAPTCHA code is null or undefined indicating that
    // the reCAPTCHA was expired then return early
    if (!captchaCode) {
      return;
    }
    setValue("ReCAPTCHA", captchaCode);
  };

  const facebookSignIn = async () => {
    await signIn("facebook", {
      callbackUrl: `${window.location.origin}${
        GO_TO_PREV_PATH ? prevPath : "/"
      }`,
      redirect: true,
    });
  };

  const appleSignIn = async () => {
    await signIn("apple", {
      callbackUrl: `${window.location.origin}${
        GO_TO_PREV_PATH ? prevPath : "/"
      }`,
      redirect: true,
    });
  };

  const googleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}${
          GO_TO_PREV_PATH ? prevPath : "/"
        }`,
        redirect: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const hasProvidersSetUp =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_APPLE_ID;

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Login
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <div className="w-full rounded-lg shadow-outline">
            <SquareButton
              onClick={googleSignIn}
              className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
            >
              <Google className="w-[24px]" />
              Log In with Google
            </SquareButton>
          </div>
        ) : null}
        {process.env.NEXT_PUBLIC_APPLE_ID ? (
          <SquareButton
            onClick={appleSignIn}
            className="flex items-center justify-center gap-3 bg-black text-white"
          >
            <Apple className="w-[24px]" />
            Log In with Apple
          </SquareButton>
        ) : null}
        {process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ? (
          <SquareButton
            onClick={facebookSignIn}
            className="flex items-center justify-center gap-3 bg-facebook text-white"
          >
            <Facebook className="w-[24px]" />
            Log In with Facebook
          </SquareButton>
        ) : null}
        {hasProvidersSetUp ? (
          <div className="flex items-center py-4">
            <div className="h-[1px] w-full bg-stroke" />
            <div className="px-2 text-primary-gray">or</div>
            <div className="h-[1px] w-full bg-stroke" />
          </div>
        ) : null}
        <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email address"
            id="email"
            register={register}
            name="email"
            error={errors.email?.message}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              register={register}
              name="password"
              error={errors.password?.message}
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
              className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%]`}
            >
              {showPassword ? (
                <Hidden className="h-[14px] w-[14px]" />
              ) : (
                <Visible className="h-[14px] w-[14px]" />
              )}
            </IconButton>
          </div>
          <Link
            className="text-[12px] text-primary"
            href={`/${course?.id}/forgot-password`}
          >
            Forgot password?
          </Link>
          <ReCAPTCHA
            size="normal"
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
            onChange={onReCAPTCHAChange}
            ref={recaptchaRef}
          />
          <FilledButton className="w-full rounded-full">Log In</FilledButton>
        </form>
      </section>
      <div className="pt-4 text-center text-[14px] text-primary-gray">
        Dont&apos;t have an account?{" "}
        <Link className="text-primary" href={`/${course?.id}/register`}>
          Sign Up
        </Link>{" "}
        instead
      </div>
    </main>
  );
}
