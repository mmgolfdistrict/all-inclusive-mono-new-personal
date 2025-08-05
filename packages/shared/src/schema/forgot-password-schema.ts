import { z } from "zod";

export const forgotPasswordSchema = z
  .object({
    email: z.string().email({ message: "Invalid email" }).min(1, "Email is required"),
    redirectHref: z.string().url(),
    ReCAPTCHA: z.string().optional(),
    courseProviderId: z.string().optional(),
    color1: z.string().optional(),
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

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
