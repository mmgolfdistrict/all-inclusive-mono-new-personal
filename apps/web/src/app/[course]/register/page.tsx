"use client";

import { isValidPassword } from "@golf-district/shared";
import {
  registerSchema,
  type RegisterSchemaType,
} from "@golf-district/shared/src/schema/register-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { IconButton } from "~/components/buttons/icon-button";
import { Hidden } from "~/components/icons/hidden";
import { Refresh } from "~/components/icons/refresh";
import { Visible } from "~/components/icons/visible";
import { Input } from "~/components/input/input";
import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { debounceFunction } from "~/utils/debounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { useDebounce } from "usehooks-ts";

export default function RegisterPage() {
  const { course } = useCourseContext();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
  });
  const [city, setCity] = useState(getValues("city"));

  const debouncedLocation = useDebounce<string>(city, 500);
  const cities = api.places.getCity.useQuery({ city: debouncedLocation });
  const recaptchaRef = createRef<ReCAPTCHA>();
  const registerUser = api.register.register.useMutation();
  const { data: uName } = api.register.generateUsername.useQuery(6);
  const [rotate, setRotate] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const router = useRouter();
  const {
    mutateAsync: checkProfanity,
    data: profanityCheckData,
    reset: resetProfanityCheck,
  } = api.profanity.checkProfanity.useMutation();

  const genUsername = () => {
    setValue("username", uName ?? "");
  };

  const username = watch("username");

  useEffect(() => {
    genUsername();
  }, [uName]);

  const handleCheckProfanity = async (text: string) => {
    if (!text) return;
    const data = await checkProfanity({ text });
    if (data.isProfane) {
      setError("username", {
        message: "Handle not available.",
      });
    }
  };

  const debouncedHandleCheckProfanity = useCallback(
    debounceFunction(handleCheckProfanity, 500),
    []
  );

  useEffect(() => {
    if (!username || username?.length <= 2) {
      setError("username", {
        message: "",
      });
      resetProfanityCheck();
      return;
    }
    setError("username", {
      message: "",
    });
    debouncedHandleCheckProfanity(username);
  }, [username]);

  useEffect(() => {
    const href = window.location.href;
    const cleanedHref = href.split("/register")[0];
    if (!cleanedHref) return;
    setValue("redirectHref", cleanedHref);
  }, []);

  useEffect(() => {
    recaptchaRef.current?.execute();
  }, []);

  const onSubmit: SubmitHandler<RegisterSchemaType> = async (data) => {
    if (profanityCheckData?.isProfane) {
      setError("username", {
        message: "Handle not allowed.",
      });
      return;
    }
    if (isSubmitting) return;
    if (registerUser.isLoading) return;
    if (registerUser.isSuccess) return;
    try {
      await registerUser.mutateAsync({
        ...data,
        courseId: course?.id,
      });

      router.push(`/${course?.id}/verify-email`);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error registering user.");
      console.log(error);
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

  const passwordFeedback = useMemo(() => {
    if (!password) return;
    const feedback = isValidPassword(password).feedback;
    return feedback;
  }, [password]);

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <h1 className="pb-4 text-center text-[24px] md:pb-6 md:pt-8 md:text-[32px]">
        Create an Account
      </h1>
      <section className="mx-auto flex w-full flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            id="firstName"
            name="firstName"
            register={register}
            error={errors.firstName?.message}
            data-testid="register-first-name-id"
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            id="lastName"
            name="lastName"
            register={register}
            error={errors.lastName?.message}
            data-testid="register-last-name-id"
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email address"
            id="email"
            register={register}
            name="email"
            error={errors.email?.message}
            data-testid="register-email-id"
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            id="phoneNumber"
            register={register}
            name="phoneNumber"
            error={errors.phoneNumber?.message}
          />
          <div className="flex items-end gap-2">
            <Input
              label="Handle"
              className="w-full"
              type="text"
              placeholder="Enter your handle"
              id="username"
              register={register}
              name={"username"}
              error={errors.username?.message}
              data-testid="register-user-name-id"
              showInfoTooltip={true}
              content="Handle must all be in lower case or numeric and must contain a minimum of 6 characters and maximum of 64 characters. Handle cannot contain special characters other than dot(.) and underscore(_) and any form of profanity or racism related content. Golf District reserves the right to change your handle to a random handle at any time if it violates our terms of service."
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                genUsername();
                setRotate(true);
                setTimeout(() => {
                  setRotate(false);
                }, 1000);
              }}
              className={`mb-1  ${rotate ? "animate-spin" : ""}`}
              data-testid="register-user-name-refresh-id"
            >
              <Refresh className="h-[14px] w-[14px]" />
            </IconButton>
          </div>
          {/* <Input
            label="Location"
            type="text"
            list="places"
            placeholder="Start typing your city"
            id="location"
            register={register}
            name="location"
            error={errors.location?.message}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setLocation(e.target.value);
            }}
            data-testid="register-location-id"
          /> */}
          <Input
            label="Address1"
            type="text"
            list="places"
            placeholder="Enter your address1"
            id="address1"
            register={register}
            name="address1"
            error={errors.address1?.message}
            data-testid="register-address1-id"
          />
          <Input
            label="Address2"
            type="text"
            list="places"
            placeholder="Enter your address2"
            id="address2"
            register={register}
            name="address2"
            error={errors.address2?.message}
            data-testid="register-address2-id"
          />
          <Input
            label="City"
            type="text"
            list="places"
            placeholder="Enter your city"
            id="city"
            register={register}
            name="city"
            error={errors.city?.message}
            data-testid="register-city-id"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setValue("city", e.target.value);
              setCity(e.target.value);
            }}
          />
          <Input
            label="State"
            type="text"
            list="places"
            placeholder="Enter your state"
            id="state"
            register={register}
            name="state"
            error={errors.state?.message}
            data-testid="register-state-id"
          />
          <Input
            label="Zip"
            type="text"
            list="places"
            placeholder="Enter your zip"
            id="zipcode"
            register={register}
            name="zipcode"
            error={errors.zipcode?.message}
            data-testid="register-zipcode-id"
          />
          <Input
            label="Country"
            type="text"
            list="places"
            placeholder="Enter your country"
            id="country"
            register={register}
            name="country"
            error={errors.country?.message}
            showInfoTooltip={true}
            content="We only support cashouts for US banks at this time"
            data-testid="register-country-id"
          />
          <datalist id="places">
            {cities.data?.autocompleteCities.features.map((city, idx) => (
              <option key={idx}>{city.place_name}</option>
            ))}
          </datalist>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              register={register}
              name="password"
              error={errors.password?.message}

              data-testid="register-password-id"
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
              className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%]`}
              data-testid="register-show-password-id"
            >
              {showPassword ? (
                <Hidden className="h-[14px] w-[14px]" />
              ) : (
                <Visible className="h-[14px] w-[14px]" />
              )}
            </IconButton>
          </div>
          {passwordFeedback && passwordFeedback.length > 0 ? (
            <ul className={`flex flex-col gap-2 list-disc pl-4`}>
              {passwordFeedback?.map((advice, idx) => (
                <li className="text-[12px] text-red" key={`${idx}+passsword`}>
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
              data-testid="register-confirm-password-id"
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                setShowConfirmPassword(!showConfirmPassword);
              }}
              className={`absolute right-2 !top-[90%] border-none !bg-transparent !transform !-translate-y-[90%]`}
              data-testid="register-show-confirm-password-id"
            >
              {showConfirmPassword ? (
                <Hidden className="h-[14px] w-[14px]" />
              ) : (
                <Visible className="h-[14px] w-[14px]" />
              )}
            </IconButton>
          </div>
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
              data-testid="register-recaptcha-id"
            />
          )}
          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
            errors.ReCAPTCHA?.message && (
              <p className="text-[12px] text-red">
                {errors.ReCAPTCHA?.message}
              </p>
            )}

          <FilledButton
            className={`w-full rounded-full ${
              isSubmitting ? "animate-pulse cursor-not-allopwed" : ""
            }`}
            type="submit"
            disabled={isSubmitting}
            data-testid="register-button-id"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </FilledButton>
        </form>
      </section>
      <div className="pt-4 text-center text-[14px] text-primary-gray">
        Already have an account?{" "}
        <Link
          className="text-primary"
          href={`/${course?.id}/login`}
          data-testid="signin-button-id"
        >
          Sign In
        </Link>{" "}
        instead
      </div>
    </main>
  );
}
