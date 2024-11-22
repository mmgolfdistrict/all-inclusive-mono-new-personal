"use client";

import { isValidPassword } from "@golf-district/shared";
import {
  registerSchema,
  type RegisterSchemaType,
} from "@golf-district/shared/src/schema/register-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem, Select } from "@mui/material";
import { useLoadScript, type Libraries } from "@react-google-maps/api";
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
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
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
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
  });
  const libraries: Libraries = ["places"];
  const [city, setCity] = useState(getValues("city"));

  const debouncedLocation = useDebounce<string>(city, 500);
  const recaptchaRef = createRef<ReCAPTCHA>();
  const registerUser = api.register.register.useMutation();
  const { data: uName } = api.register.generateUsername.useQuery(6);
  const [rotate, setRotate] = useState<boolean>(false);
  const [password] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const router = useRouter();
  const {
    mutateAsync: checkProfanity,
    data: profanityCheckData,
    reset: resetProfanityCheck,
  } = api.profanity.checkProfanity.useMutation();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.address_components) {
      const addressComponents = place.address_components;

      const getAddressComponent = (type: string): string => {
        return (
          addressComponents.find((component) => component.types.includes(type))
            ?.long_name || ""
        );
      };

      const streetNumber = getAddressComponent("street_number");
      const route = getAddressComponent("route");
      const address1 = `${streetNumber} ${route}`.trim();
      const address2 = getAddressComponent("sublocality");
      const state = getAddressComponent("administrative_area_level_1");
      const city = getAddressComponent("locality");
      const zipcode = getAddressComponent("postal_code");
      const country = getAddressComponent("country");

      if (inputRef?.current) {
        inputRef.current.value = address1;
      }

      // Type guard before passing to setValue
      if (typeof address1 === "string") setValue("address1", address1);
      if (typeof address2 === "string") setValue("address2", address2);
      if (typeof state === "string") setValue("state", state);
      if (typeof city === "string") setValue("city", city);
      if (typeof zipcode === "string") setValue("zipcode", zipcode);
      if (typeof country === "string") setValue("country", country);
    }
  };

  useEffect(() => {
    if (isLoaded && !loadError && inputRef?.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "us" },
        }
      );
      if (autocomplete) {
        autocompleteRef.current = autocomplete;
        autocomplete.addListener("place_changed", onPlaceChanged);
      }
    }
  }, [isLoaded, loadError]);

  const cities = api.places.getCity.useQuery(
    { city: debouncedLocation },
    {
      enabled: !!debouncedLocation,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

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

  const auditLog = api.webhooks.auditLog.useMutation();

  const logAudit = async (message) => {
    await auditLog.mutateAsync({
      userId: "",
      teeTimeId: "",
      bookingId: "",
      listingId: "",
      courseId: course?.id,
      eventId: "ERROR_DURING_SIGN_UP",
      json: message,
    });
  };

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true") {
      recaptchaRef.current?.execute();
    }
  }, [recaptchaRef]);

  const onSubmit: SubmitHandler<RegisterSchemaType> = async (data) => {
    if (profanityCheckData?.isProfane) {
      setError("username", {
        message: "Handle not allowed.",
      });
      return;
    }
    if (isSubmitting) return;
    if (registerUser.isLoading) return;
    // if (registerUser.isSuccess) return;
    try {
      const response = await registerUser.mutateAsync({
        ...data,
        country: "USA",
        courseId: course?.id,
      });
      if (response?.error) {
        await recaptchaRef.current?.executeAsync();
        toast.error(response.message);
        await logAudit(response.message);
        return;
      }
      router.push(`/${course?.id}/verify-email`);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error registering user.");
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
        <p>
          Using gmail? Go to the login page and select the Google icon to login
          with Google. The below form is not required for gmail users.
        </p>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="First Name"
                type="text"
                placeholder="Enter your first name"
                id="firstName"
                name="firstName"
                register={register}
                error={errors.firstName?.message}
                data-testid="register-first-name-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Last Name"
                type="text"
                placeholder="Enter your last name"
                id="lastName"
                name="lastName"
                register={register}
                error={errors.lastName?.message}
                data-testid="register-last-name-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Email"
                type="email"
                placeholder="Enter your email address"
                id="email"
                register={register}
                name="email"
                error={errors.email?.message}
                data-testid="register-email-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                id="phoneNumber"
                register={register}
                name="phoneNumber"
                error={errors.phoneNumber?.message}
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />

          <div className="flex items-end gap-2">
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
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
                  inputRef={(e) => {
                    field.ref(e);
                  }}
                />
              )}
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
          <Controller
            name="address1"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Addr&#8204;ess1"
                type="text"
                list="places"
                placeholder="Enter your address1"
                id="address1"
                register={register}
                name="addres&#8204;s1"
                error={errors.address1?.message}
                data-testid="register-address1-id"
                inputRef={inputRef}
                autoComplete="new-password"
              />
            )}
          />
          <Controller
            name="address2"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Address2"
                type="text"
                list="places"
                placeholder="Enter your address2"
                id="address2"
                register={register}
                name="address2"
                error={errors.address2?.message}
                data-testid="register-address2-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
                autoComplete="new-password"
              />
            )}
          />
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
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
                autoComplete="new-password"
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <div>
                <label
                  htmlFor="state"
                  style={{ fontSize: "14px", color: "rgb(109 119 124" }}
                >
                  State
                </label>
                <Select
                  size="small"
                  {...field}
                  id="state"
                  placeholder="Enter Your State"
                  fullWidth
                  name="state"
                  data-testid="register-state-id"
                  inputRef={(e) => {
                    field.ref(e);
                  }}
                  sx={{
                    fontSize: "14px",
                    color: "rgb(109 119 124)",
                    backgroundColor: "rgb(247, 249, 250)",
                    border: "none",
                    "& fieldset": { border: "none" },
                  }}
                  value={field.value || ""}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenuItem-root.Mui-selected": {
                          backgroundColor: "rgb(0, 0, 0)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "rgb(0, 0, 0)",
                            color: "white",
                          },
                        },
                      },
                    },
                  }}
                  // defaultValue=""
                  displayEmpty
                >
                  {/* <MenuItem value="" disabled >Select your state</MenuItem> */}
                  {usStates.map((state) => (
                    <MenuItem key={state.code} value={state.name}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            )}
          />
          <Controller
            name="zipcode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Zip"
                type="text"
                list="places"
                placeholder="Enter your zip"
                id="zipcode"
                register={register}
                name="zipcode"
                error={errors.zipcode?.message}
                data-testid="register-zipcode-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
                autoComplete="new-password"
              />
            )}
          />
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Country"
                type="text"
                list="places"
                placeholder="Enter your country"
                id="country"
                register={register}
                name="country"
                error={errors.country?.message}
                showInfoTooltip={true}
                disabled={true}
                value={"USA"}
                content="We only support cash outs for US banks at this time"
                data-testid="register-country-id"
                inputRef={(e) => {
                  field.ref(e);
                }}
              />
            )}
          />

          <datalist id="places">
            {cities.data?.autocompleteCities.features.map((city, idx) => (
              <option key={idx}>{city.place_name}</option>
            ))}
          </datalist>
          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  register={register}
                  name="password"
                  error={errors.password?.message}
                  data-testid="register-password-id"
                  inputRef={(e) => {
                    field.ref(e);
                  }}
                />
              )}
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
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  register={register}
                  name="confirmPassword"
                  error={errors.confirmPassword?.message}
                  data-testid="register-confirm-password-id"
                  inputRef={(e) => {
                    field.ref(e);
                  }}
                />
              )}
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
                process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE === "true"
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
            className={`w-full rounded-full ${isSubmitting ? "animate-pulse cursor-not-allopwed" : ""
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

const usStates = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];