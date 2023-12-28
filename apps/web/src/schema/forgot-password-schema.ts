import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(1, "Email is required"),
  ReCAPTCHA: z.string().min(1, { message: "ReCAPTCHA is required" }),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
