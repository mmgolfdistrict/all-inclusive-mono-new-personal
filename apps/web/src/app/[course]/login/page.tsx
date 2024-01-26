"use client";

import { signIn } from "@golf-district/auth/nextjs-exports";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { SquareButton } from "~/components/buttons/square-button";
import { Apple } from "~/components/icons/apple";
import { Facebook } from "~/components/icons/facebook";
import { Google } from "~/components/icons/google";
import { Input } from "~/components/input/input";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { loginSchema, type LoginSchemaType } from "~/schema/login-schema";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

export default function Login() {
  const recaptchaRef = createRef<ReCAPTCHA>();
  const { prevPath } = useAppContext();
  const searchParams = useSearchParams();
  const loginError = searchParams.get("error");
  const { course } = useCourseContext();

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

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    try {
      const res = await signIn("credentials", {
        callbackUrl: `${window.location.origin}${
          !prevPath?.includes("/login") ? prevPath : "/"
        }`,
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (res?.error) {
        toast.error("The email or password you entered is incorrect.");
        setValue("password", "");
      } else if (!res?.error && res?.ok) {
        window.location.reload();
        window.location.href = `${window.location.origin}${
          !prevPath?.includes("/login") ? prevPath : "/"
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

  const facebookSignIn = () => {
    void signIn("github", {
      callbackUrl: `${window.location.origin}${
        !prevPath?.includes("/login") ? prevPath : "/"
      }`,
      redirect: true,
    });
  };

  const googleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}${
          !prevPath?.includes("/login") ? prevPath : "/"
        }`,
        redirect: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Login
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <div className="w-full rounded-lg shadow-outline">
          <SquareButton
            onClick={googleSignIn}
            className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
          >
            <Google className="w-[24px]" />
            Log In with Google
          </SquareButton>
        </div>
        <SquareButton className="flex items-center justify-center gap-3 bg-black text-white">
          <Apple className="w-[24px]" />
          Log In with Apple
        </SquareButton>
        <SquareButton
          onClick={facebookSignIn}
          className="flex items-center justify-center gap-3 bg-facebook text-white"
        >
          <Facebook className="w-[24px]" />
          Log In with Facebook
        </SquareButton>
        <div className="flex items-center py-4">
          <div className="h-[1px] w-full bg-stroke" />
          <div className="px-2 text-primary-gray">or</div>
          <div className="h-[1px] w-full bg-stroke" />
        </div>
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
          <Input
            label="Password"
            type="password"
            id="password"
            placeholder="Enter your password"
            register={register}
            name="password"
            error={errors.password?.message}
          />
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
