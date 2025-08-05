import { z } from "zod";

export const NAME_VALIDATION_REGEX = /^[A-Za-zÀ-ÿ'’ ]+$/;

export const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(1, { message: "First name is required" })
      .regex(NAME_VALIDATION_REGEX, { message: "First name can only contain letters and single quotes" })
      .transform((name) => name.trim().replace(/\s{2,}/g, " ")),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(1, { message: "Last name is required" })
      .regex(NAME_VALIDATION_REGEX, { message: "Last name can only contain letters and single quotes" })
      .transform((name) => name.trim().replace(/\s{2,}/g, " ")),
    username: z
      .string({ required_error: "Username is required" })
      .min(6, { message: "Username should be at least 6 characters long" })
      .max(64, { message: "Username shouldn't be more than 64 characters long" }),
    // .refine((username) => !username.includes("@"), {
    //   message: "Username cannot contain '@'",
    // }),
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email" })
      .min(1, "Email is required"),
    phoneNumberCountryCode: z.number().min(1, { message: "Phone number country code is required" }),
    phoneNumber: z
      .string({ required_error: "Phone number is required" })
      .min(10, { message: "Invalid phone number, it should have 10 digits." })
      .max(10, { message: "Invalid phone number, it should have 10 digits." })
      .refine((phoneNumber) => /^\d{10}$/.test(phoneNumber)),
    // location: z.string().min(1, { message: "Location is required" }),
    address1: z
      .string({ required_error: "Address1 is required" })
      .min(1, { message: "Address1 is required" }),
    address2: z.string().optional(),
    state: z.string({ required_error: "State is required" }).min(1, { message: "State is required" }),
    zipcode: z.string({ required_error: "Zip is required" }).min(1, { message: "Zip is required" }),
    city: z.string({ required_error: "City is required" }).min(1, { message: "City is required" }),
    country: z.string({ required_error: "Country is required" }).min(1, { message: "Country is required" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must have more than 8 characters" }),
    confirmPassword: z
      .string({ required_error: "Password confirmation is required" })
      .min(1, { message: "Password confirmation is required" }),
    redirectHref: z.string().url(),
    ReCAPTCHA: z.string().optional(),
    courseId: z.string().optional(),
    color1: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine(
    (data) => {
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !data.ReCAPTCHA) {
        return false;
      }
      return true;
    },
    {
      message: "ReCAPTCHA is required",
      path: ["ReCAPTCHA"],
    }
  );

export type RegisterSchemaType = z.infer<typeof registerSchema>;
