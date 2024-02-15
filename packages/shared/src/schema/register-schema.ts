import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z
      .string()
      .min(1, { message: "Username is required" })
      .max(20)
      .refine((username) => !username.includes("@"), {
        message: "Username cannot contain '@'",
      }),
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
    ReCAPTCHA: z.string().min(1, { message: "ReCAPTCHA is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
