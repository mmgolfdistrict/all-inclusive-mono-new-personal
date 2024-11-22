"use client";

import {
  signIn,
  useSession,
} from "@golf-district/auth/nextjs-exports";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { IconButton } from "~/components/buttons/icon-button";
import { SquareButton } from "~/components/buttons/square-button";
import { Apple } from "~/components/icons/apple";
import { Facebook } from "~/components/icons/facebook";
import { Google } from "~/components/icons/google";
import { Hidden } from "~/components/icons/hidden";
import { LinkedinLogo } from "~/components/icons/linkedin";
import { Visible } from "~/components/icons/visible";
import { Input } from "~/components/input/input";
import { Spinner } from "~/components/loading/spinner";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { usePreviousPath } from "~/hooks/usePreviousPath";
import { loginSchema, type LoginSchemaType } from "~/schema/login-schema";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createRef, Fragment, useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { LoadingContainer } from "../loader";

declare global {
  interface Window {
    gtag: (event: string, action: string, params: Record<string, unknown>) => void;
  }
}


export default function Login() {
  const recaptchaRef = createRef<ReCAPTCHA>();
  const { prevPath } = useAppContext();
  const { isPathExpired } = usePreviousPath();
  const searchParams = useSearchParams();
  const loginError = searchParams.get("error");
  const { course } = useCourseContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localStorageGoogle, setLocalStorageGoogle] = useState("");
  const [localstorageCredentials, setLocalStorageCredentials] = useState("");
  const [localstorageLinkedin, setLocalStorageLinkedin] = useState("");
  const [localstorageFacebook, setLocalStorageFacebook] = useState("");
  const [googleIsLoading, setGoogleIsLoading] = useState(false);
  const [hasSessionLogged, setHasSessionLogged] = useState(false);
  const [linkedinIsLoading, setLinkedinIsLoading] = useState(false);
  const [facebookIsLoading, setFacebookIsLoading] = useState(false);
  const auditLog = api.webhooks.auditLog.useMutation();
  const addUserSession = api.user.addUserSession.useMutation();
  const addCourseUser = api.user.addCourseUser.useMutation();
  const { data: sessionData, status } = useSession();
  const errorKey = searchParams.get("error");
  const router = useRouter();
  const event = ({
    action,
    category,
    label,
    value,
  }: {
    action: string;
    category: string;
    label: string;
    value?: number;
  }) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      const params: Record<string, unknown> = {
        event_category: category,
        event_label: label,
        value: value,
      };
  
      window.gtag("event", action, params);
    }
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
      addCourseToUser();
      addLoginSession();
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
      .catch((err) => {
        console.log("error", err);
      });
  };

  const addCourseToUser = () => {
    addCourseUser
      .mutateAsync({
        courseId: course?.id ? course?.id : "",
        userId: sessionData?.user?.id ? sessionData?.user?.id : "",
      })
      .then(() => {
        console.log("New courseUser entry added successfully");
      })
      .catch((err) => {
        console.log("error", err);
      });
  };

  const addLoginSession = () => {
    if (!hasSessionLogged) {
      addUserSession
        .mutateAsync({
          status: "LOGIN",
        })
        .then(() => {
          console.log("login user added successfully");
        })
        .catch((err) => {
          console.log("error", err);
        });
      setHasSessionLogged(true);
    }
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
    try {
      setIsLoading(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("credentials", "credentials");
        //setLocalStorageCredentials(localStorage.getItem("credentials"));
      }
      // const callbackURL = `${window.location.origin}${
      //   GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
      //     ? prevPath?.path
      //       ? prevPath.path
      //       : "/"
      //     : "/"
      // }`;
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
          if (typeof window !== "undefined") {
            localStorage.removeItem("credentials");
          }
        } else {
          toast.error("The email or password you entered is incorrect.");
          if (typeof window !== "undefined") {
            localStorage.removeItem("credentials");
          }
        }
        setValue("password", "");
      }
      console.log("login done");
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
    try {
      setFacebookIsLoading(true);
      await signIn("facebook", {
        // callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
        //   ? prevPath?.path
        //     ? prevPath.path
        //     : "/"
        //   : "/"
        //   }`,
        redirect: false,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("facebookstate", "loggedin");
      }
    } catch (error) {
      console.log(error);
    }
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
    setGoogleIsLoading(true);
    event({
      action: "SIGNIN_USING_GOOGLE",
      category: "SIGNIN",
      label: "Sign in using google"
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

      if (typeof window !== "undefined") {
        localStorage.setItem("googlestate", "loggedin");
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      // if (typeof window !== "undefined") {
      //   localStorage.removeItem("googlestate");
      // }
      // setGoogleIsLoading(false);
    }
  };
  const linkedinSignIn = async () => {
    try {
      setLinkedinIsLoading(true);
     await signIn("linkedin", {
        redirect: false,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("linkedinstate", "loggedin");
      }
    } catch (error) {
      console.log(error, "error");
    }
  };
  const hasProvidersSetUp =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_APPLE_ID;
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("googlestate")) {
        setGoogleIsLoading(true);
      }
      // if (!localStorage.getItem("googlestate")) {
      //   setGoogleIsLoading(false);
      //   localStorage.removeItem("googlestate");
      // }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageGoogle(localStorage.getItem("googlestate") || "");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageLinkedin(localStorage.getItem("linkedinstate") || "");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageCredentials(localStorage.getItem("credentials") || "");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageFacebook(localStorage.getItem("facebookstate") || "");
    }
  }, []);
  return isLoading ||
    localStorageGoogle ||
    localstorageLinkedin ||
    localstorageFacebook ? (
    <LoadingContainer isLoading={true}>
      <div></div>
    </LoadingContainer>
  ) : (
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
              {googleIsLoading || localStorageGoogle ? (
                <div className="w-10 h-10">
                  <Spinner />
                </div>
              ) : (
                <Fragment>
                  <Google className="w-[24px]" />
                  Log In with Google
                </Fragment>
              )}
            </SquareButton>
          </div>
        ) : null}
        {process.env.NEXT_PUBLIC_LINKEDIN_ENABLED_AUTH_SUPPORT ? (
          <div className="w-full rounded-lg shadow-outline">
            <SquareButton
              onClick={linkedinSignIn}
              className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
              data-testid="login-with-google-id"
            >
              {linkedinIsLoading || localstorageLinkedin ? (
                <div className="w-10 h-10">
                  <Spinner />
                </div>
              ) : (
                <Fragment>
                  <LinkedinLogo className="w-[30px] h-[30px]" />
                  Log In with Linkedin
                </Fragment>
              )}
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
            {facebookIsLoading ? (
              <Fragment>
                <div className="w-10 h-10">
                  <Spinner />
                </div>
              </Fragment>
            ) : (
              <Fragment>
                <Facebook className="w-[24px]" />
                Log In with Facebook
              </Fragment>
            )}
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
                process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true"
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
            className="w-full rounded-full flex justify-center items-center"
            data-testid="login-button-id"
          >
            {localstorageCredentials ? (
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin "></div>
            ) : (
              "Log In"
            )}
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
