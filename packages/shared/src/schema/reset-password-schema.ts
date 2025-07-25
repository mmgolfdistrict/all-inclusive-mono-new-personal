import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    userId: z.string().uuid(),
    verificationToken: z.string(),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must have more than 8 characters" }),
    confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
    courseId: z.string().optional(),
    color1: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;
