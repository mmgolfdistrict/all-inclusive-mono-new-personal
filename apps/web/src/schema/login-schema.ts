import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(1, "Email is required"),

  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must have more than 8 characters" }),
  ReCAPTCHA: z.string().optional(),
  // ReCAPTCHA: z.string().min(1, { message: "ReCAPTCHA is required" }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
