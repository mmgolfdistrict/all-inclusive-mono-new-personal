import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z.string().min(1, { message: "Username is required" }).max(20),
    email: z.string().email({ message: "Invalid email" }).min(1, "Email is required"),
    location: z.string(),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must have more than 8 characters" }),
    confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
    ReCAPTCHA: z.string().min(1, { message: "ReCAPTCHA is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
