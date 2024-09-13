"use client";

import {
  signIn,
  signOut,
  useSession,
} from "@golf-district/auth/nextjs-exports";
import { db } from "@golf-district/database";
import { NotificationService, UserService } from "@golf-district/service";
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
import { usePreviousPath } from "~/hooks/usePreviousPath";
import { loginSchema, type LoginSchemaType } from "~/schema/login-schema";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createRef, useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { LoadingContainer } from "../loader";
import { microsoftClarityEvent } from "~/utils/microsoftClarityUtils";

export default function Login() {
  const recaptchaRef = createRef<ReCAPTCHA>();
  const { prevPath } = useAppContext();
  const { isPathExpired } = usePreviousPath();
  const searchParams = useSearchParams();
  const loginError = searchParams.get("error");
  const { course } = useCourseContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const auditLog = api.webhooks.auditLog.useMutation();
  const { data: sessionData, status } = useSession();
  const errorKey = searchParams.get("error");
  const router = useRouter();

  const event = ({ action, category, label, value }: any) => {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  };

  useEffect(() => {
    if (errorKey === "AccessDenied" && !toast.isActive("accessDeniedToast")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.push(url.pathname + url.search);
      toast.error(
        "Unable to login. Please call customer support at 877-TeeTrade or email at support@golfdistrict.com",
        { toastId: "accessDeniedToast" }
      );
    }
  }, [errorKey]);

  useEffect(() => {
    if (sessionData?.user?.id && course?.id && status === "authenticated") {
      logAudit(sessionData.user.id, course.id, () => {
        window.location.reload();
        window.location.href = `${window.location.origin}${
          GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
            ? prevPath?.path
              ? prevPath.path
              : "/"
            : "/"
        }`;
      });
    }
  }, [sessionData, course, status]);

  const logAudit = (userId: string, courseId: string, func: () => void) => {
    auditLog
      .mutateAsync({
        userId: userId,
        teeTimeId: "",
        bookingId: "",
        listingId: "",
        courseId: courseId,
        eventId: "USER_LOGGED_IN",
        json: `user logged in `,
      })
      .then((res) => {
        if (res) {
          func();
        }
      })
      .catch((err) => {});
  };

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
    !prevPath?.path?.includes("/login") &&
    !prevPath?.path?.includes("verify") &&
    !prevPath?.path?.includes("reset-password") &&
    !prevPath?.path?.includes("forgot-password") &&
    !prevPath?.path?.includes("verify-email") &&
    !prevPath?.path?.includes("register");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true") {
      recaptchaRef.current?.execute();
    }
  }, [recaptchaRef]);

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    microsoftClarityEvent({
      action: `REGISTER CLICKED`,
      category: "REGISTER",
      label: "User clicked on register",
      value: data?.email,
    })
    setIsLoading(true);
    event({
      action: "SIGNIN_USING_CREDENTIALS",
      category: "SIGNIN",
      label: "Sign in using credentials",
      value: "",
    });
    try {
      recaptchaRef.current?.reset();
      const callbackURL = `${window.location.origin}${
        GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
            ? prevPath.path
            : "/"
          : "/"
      }`;
      const res = await signIn("credentials", {
        // callbackUrl: callbackURL,
        redirect: false,
        email: data.email,
        password: data.password,
        ReCAPTCHA: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
          ? data.ReCAPTCHA
          : undefined,
      });
      if (res?.error) {
        await recaptchaRef.current?.executeAsync();
        if (res.error === "AccessDenied") {
          toast.error(
            "Unable to login. Please call customer support at 877-TeeTrade or email at support@golfdistrict.com"
          );
        } else {
          toast.error("The email or password you entered is incorrect.");
        }
        setValue("password", "");
      }
    } catch (error) {
      toast.error(
        (error as Error)?.message ??
          "An error occurred logging in, try another option."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
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
        GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
            ? prevPath.path
            : "/"
          : "/"
      }`,
      redirect: true,
    });
  };

  const appleSignIn = async () => {
    await signIn("apple", {
      callbackUrl: `${window.location.origin}${
        GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
            ? prevPath.path
            : "/"
          : "/"
      }`,
      redirect: true,
    });
  };

  const googleSignIn = async () => {
    event({
      action: "SIGNIN_USING_GOOGLE",
      category: "SIGNIN",
      label: "Sign in using google",
      value: "",
    });
    try {
      await signIn("google", {
        // callbackUrl: `${window.location.origin}${
        //   GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
        //     ? prevPath?.path
        //       ? prevPath.path
        //       : "/"
        //     : "/"
        // }`,
        redirect: false,
      });
    } catch (error) {}
  };

  const hasProvidersSetUp =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_APPLE_ID;

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Login
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <p>
          First time users of Golf District need to create a new account. Simply
          use Google to login quickly, or select sign up if you prefer to use
          another email.
        </p>
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <div className="w-full rounded-lg shadow-outline">
            <SquareButton
              onClick={googleSignIn}
              className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
              data-testid="login-with-google-id"
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
            data-testid="login-with-apple-id"
          >
            <Apple className="w-[24px]" />
            Log In with Apple
          </SquareButton>
        ) : null}
        {process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ? (
          <SquareButton
            onClick={facebookSignIn}
            className="flex items-center justify-center gap-3 bg-facebook text-white"
            data-testid="login-with-facebook-id"
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
            data-testid="login-email-id"
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
              data-testid="login-password-id"
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
              className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%]`}
              data-testid="login-show-password-id"
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
            data-testid="forgot-password-id"
          >
            Forgot password?
          </Link>
          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <ReCAPTCHA
              size={
                process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE
                  ? "invisible"
                  : "normal"
              }
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
              onChange={onReCAPTCHAChange}
              ref={recaptchaRef}
              data-testid="login-recaptcha-id"
            />
          )}
          <FilledButton
            className="w-full rounded-full"
            data-testid="login-button-id"
          >
            Log In
          </FilledButton>
        </form>
      </section>
      <div className="pt-4 text-center text-[14px] text-primary-gray">
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
    </main>
  );
}
