import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z
      .string()
      .min(6, { message: "Username should be at least 6 characters long" })
      .max(64, { message: "Username shouldn't be more than 64 characters long" }),
      // .refine((username) => !username.includes("@"), {
      //   message: "Username cannot contain '@'",
      // }),
    email: z.string().email({ message: "Invalid email" }).min(1, "Email is required"),
    phoneNumber: z
      .string()
      .min(1, { message: "Phone number is required" })
      .refine((phoneNumber) => /^\d{10}$/.test(phoneNumber), {
        message:
          "Invalid phone number. Please enter a valid US phone number with area code. No country code required, dashes, or spaces.",
      }),
    location: z.string().min(1, { message: "Location is required" }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must have more than 8 characters" }),
    confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
    redirectHref: z.string().url(),
    ReCAPTCHA: z.string().optional(),
    courseId: z.string().optional(),
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
