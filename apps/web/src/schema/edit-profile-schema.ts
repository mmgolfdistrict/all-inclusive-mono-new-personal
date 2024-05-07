import { z } from "zod";

// const FileSchema = z.object({
//   name: z.string(),
//   size: z.number(),
//   type: z.string(),
//   webkitRelativePath: z.string(),
//   lastModified: z.number(),
//   lastModifiedDate: z.date(),
// });

// const MAX_PROFILE_IMAGE_SIZE = 500000;

export const editProfileSchema = z.object({
  name: z.string().min(6, { message: "Name is required (should be in at least 6 characters)" }).max(30, { message: "Name should be in at most 30 characters" }),
  handle: z
    .string()
    .min(1, { message: "Handle is required" })
    .max(20)
    .refine((handle) => !handle.includes("@"), {
      message: "Handle cannot contain '@'",
    }),
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(1, "Email is required"),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((phoneNumber) => /^\d{10}$/.test(phoneNumber), {
      message:
        "Invalid phone number. Please enter a valid US phone number with area code. No country code required, dashes, or spaces.",
    }),
  location: z.string().min(1, { message: "Location is required" }),
  profilePictureAssetId: z.string().or(z.null()).or(z.object({})).optional(),
  // .refine(
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //   (files) => files?.[0]?.size <= MAX_PROFILE_IMAGE_SIZE,
  //   { message: `Max file size is 5MB.` }
  // ),
  bannerImageAssetId: z.string().or(z.null()).or(z.object({})).optional(),
});

export type EditProfileSchemaType = z.infer<typeof editProfileSchema>;
