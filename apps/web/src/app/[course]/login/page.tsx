"use client";

import { signIn, useSession } from "@golf-district/auth/nextjs-exports";
import { AuthenticationMethodEnum } from "@golf-district/shared";
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
import { useUserContext } from "~/contexts/UserContext";
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
    gtag: (
      event: string,
      action: string,
      params: Record<string, unknown>
    ) => void;
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
  const [localstorageApple, setLocalStorageApple] = useState("");
  const [googleIsLoading, setGoogleIsLoading] = useState(false);
  const [hasSessionLogged, setHasSessionLogged] = useState(false);
  const [linkedinIsLoading, setLinkedinIsLoading] = useState(false);
  const [facebookIsLoading, setFacebookIsLoading] = useState(false);
  const [appleIsLoading, setAppleIsLoading] = useState(false);
  const auditLog = api.webhooks.auditLog.useMutation();
  const addUserSession = api.user.addUserSession.useMutation();
  const addCourseUser = api.user.addCourseUser.useMutation();
  const { data: sessionData, status } = useSession();
  const { refetchMe } = useUserContext();
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

  const {
    data: authenticationMethods,
    isLoading: authenticationMethodsLoading,
  } = api.course.getAuthenticationMethods.useQuery({
    courseId: course?.id ?? "",
  });

  const isMethodSupported = (method: AuthenticationMethodEnum) => {
    return authenticationMethods?.includes(method);
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
      logAudit(sessionData.user.id, course.id);
    }
  }, [sessionData, course, status]);

  const logAudit = (userId: string, courseId: string, func?: () => void) => {
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
        if (res && func) {
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
      const loginMethod = localStorage.getItem(
        "loginMethod"
      ) as unknown as string;
      addUserSession
        .mutateAsync({
          status: "LOGIN",
          courseId: course?.id ?? "",
          loginMethod: loginMethod ?? "",
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

  const regexPattern = /^\/([^/]+\/)/;
  const match = prevPath?.path?.match(regexPattern);
  const extractedURL = match ? match[0] : prevPath?.path;

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
      const callbackURL = `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
        ? prevPath?.path
        : extractedURL ?? "/"
        }`;
      const res = await signIn("credentials", {
        callbackUrl: callbackURL,
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
          toast.error(res?.error);
          if (typeof window !== "undefined") {
            localStorage.removeItem("credentials");
          }
        }
        setValue("password", "");
      } else {
        void refetchMe();
        router.push(String(res?.url));
        localStorage.setItem("loginMethod", "EMAIL_PASSWORD");
        localStorage.setItem("showBalanceToast", "true");
        localStorage.setItem("showBalanceToast", "true");

        localStorage.setItem("showBalanceToast", "true");
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
    try {
      setFacebookIsLoading(true);
      const res = await signIn("facebook", {
        callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
          : extractedURL ?? "/"
          }`,
        redirect: true,
      });

      if (!res?.error) {
        localStorage.setItem("loginMethod", "FACEBOOK");
        localStorage.setItem("showBalanceToast", "true");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("facebookstate", "loggedin");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const appleSignIn = async () => {
    try {
      setAppleIsLoading(true);
      await signIn("apple", {
        callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
          : extractedURL ?? "/"
          }`,
        redirect: true,
      });
      localStorage.setItem("applestate", "loggedin");
    } catch (error) {
      console.log(error, "error");
    }
  };

  const googleSignIn = async () => {
    setGoogleIsLoading(true);
    event({
      action: "SIGNIN_USING_GOOGLE",
      category: "SIGNIN",
      label: "Sign in using google",
    });
    try {
      const res = await signIn("google", {
        callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
          : extractedURL ?? "/"
          }`,
        redirect: true,
      });

      if (!res?.error) {
        localStorage.setItem("showBalanceToast", "true");
        localStorage.setItem("loginMethod", "GOOGLE");
      }
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

  const signinWithKeycloak = async () => {
    try {
      await signIn("keycloak", {
        callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
          : extractedURL ?? "/"
          }`,
        redirect: true,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("loginMethod", "KEYCLOAK");
        localStorage.setItem("showBalanceToast", "true");
      }
    } catch (error) {
      console.log("Keycloak sign-in error:", error);
    }
  };

  const linkedinSignIn = async () => {
    try {
      setLinkedinIsLoading(true);
      const res = await signIn("linkedin", {
        callbackUrl: `${window.location.origin}${GO_TO_PREV_PATH && !isPathExpired(prevPath?.createdAt)
          ? prevPath?.path
          : extractedURL ?? "/"
          }`,
        redirect: true,
      });
      if (!res?.error) {
        localStorage.setItem("loginMethod", "LINKEDIN");
        localStorage.setItem("showBalanceToast", "true");
      }
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
    setTimeout(() => {
      setGoogleIsLoading(false);
      setLocalStorageGoogle("");
      localStorage.removeItem("googlestate");
    }, 3000);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageLinkedin(localStorage.getItem("linkedinstate") || "");
    }
    setTimeout(() => {
      setLinkedinIsLoading(false);
      setLocalStorageLinkedin("");
      localStorage.removeItem("linkedinstate");
    }, 3000);
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
    setTimeout(() => {
      setFacebookIsLoading(false);
      setLocalStorageFacebook("");
      localStorage.removeItem("facebookstate");
    }, 3000);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const appleLocalStorage = localStorage.getItem("applestate") ?? "";
      setLocalStorageApple(appleLocalStorage);
    }
    setTimeout(() => {
      setLocalStorageApple("");
      localStorage.removeItem("applestate");
    }, 3000);
  }, []);
  return isLoading ||
    localStorageGoogle ||
    localstorageLinkedin ||
    localstorageApple ||
    localstorageFacebook ||
    authenticationMethodsLoading ? (
    <LoadingContainer isLoading={true}>
      <div></div>
    </LoadingContainer>
  ) : (
    <main className="bg-secondary-white py-4 md:py-6">
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <h1 className="pb-4 text-center text-[1.5rem] md:pb-6 md:pt-8 md:text-[2rem]">
        Login
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[31.25rem] sm:rounded-xl sm:p-6">
        {isMethodSupported(AuthenticationMethodEnum.EMAIL_PASSWORD) ? (
          <p>
            First time users of Golf District need to create a new account.
            Simply use any social login like Google to login quickly, or select{" "}
            <Link
              className="text-primary"
              href={`/${course?.id}/register`}
              data-testid="signup-button-id"
            >
              sign up
            </Link>{" "}
            if you prefer to use another email.
          </p>
        ) : (
          <p>
            First time users of Golf District need to create a new account.
            Simply use any social login like Google to login quickly.
          </p>
        )}
        {
          process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ? (
            <div className="w-full rounded-lg shadow-outline">
              <SquareButton
                onClick={signinWithKeycloak}
                className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
                data-testid="login-with-google-id"
              >
                <Fragment>
                  <Google className="w-6" />
                  Log In with KeyCloak
                </Fragment>
              </SquareButton>
            </div>
          ) : null}
        {isMethodSupported(AuthenticationMethodEnum.GOOGLE) &&
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
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
                  <Google className="w-6" />
                  Log In with Google
                </Fragment>
              )}
            </SquareButton>
          </div>
        ) : null}
        {isMethodSupported(AuthenticationMethodEnum.LINKEDIN) &&
          process.env.NEXT_PUBLIC_LINKEDIN_ENABLED_AUTH_SUPPORT ? (
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
                  <LinkedinLogo className="w-[1.875rem] h-[1.875rem]" />
                  Log In with Linkedin
                </Fragment>
              )}
            </SquareButton>
          </div>
        ) : null}
        {isMethodSupported(AuthenticationMethodEnum.APPLE) &&
          process.env.NEXT_PUBLIC_AUTH_APPLE_CLIENT_ID ? (
          <SquareButton
            onClick={appleSignIn}
            className="flex items-center justify-center gap-3 bg-black text-white"
            data-testid="login-with-apple-id"
          >
            {appleIsLoading || localstorageApple ? (
              <div className="w-10 h-10">
                <Spinner />
              </div>
            ) : (
              <Fragment>
                <Apple className="w-6" />
                Log In with Apple
              </Fragment>
            )}
          </SquareButton>
        ) : null}
        {isMethodSupported(AuthenticationMethodEnum.FACEBOOK) &&
          process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ? (
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
                <Facebook className="w-6" />
                Log In with Facebook
              </Fragment>
            )}
          </SquareButton>
        ) : null}
        {isMethodSupported(AuthenticationMethodEnum.EMAIL_PASSWORD) &&
          authenticationMethods?.length !== 1 &&
          hasProvidersSetUp ? (
          <div className="flex items-center py-4">
            <div className="h-px w-full bg-stroke" />
            <div className="px-2 text-primary-gray">or</div>
            <div className="h-px w-full bg-stroke" />
          </div>
        ) : null}
        {isMethodSupported(AuthenticationMethodEnum.EMAIL_PASSWORD) && (
          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmit(onSubmit)}
          >
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%] ${errors.password?.message ? "pb-10" : ""
                  }`}
                data-testid="login-show-password-id"
              >
                {showPassword ? (
                  <Hidden className="h-[0.875rem] w-[0.875rem]" />
                ) : (
                  <Visible className="h-[0.875rem] w-[0.875rem]" />
                )}
              </IconButton>
            </div>
            <Link
              className="text-[0.75rem] text-primary"
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
        )}

      </section>
      {isMethodSupported(AuthenticationMethodEnum.EMAIL_PASSWORD) && (
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
      )}
    </main>
  );
}
