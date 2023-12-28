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
  name: z.string().min(1, { message: "Name is required" }).max(30),
  handle: z.string().min(1, { message: "Handle is required" }).max(30),
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(1, "Email is required"),
  location: z.string().optional(),
  profilePictureAssetId: z.string().or(z.null()).or(z.object({})).optional(),
  // .refine(
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //   (files) => files?.[0]?.size <= MAX_PROFILE_IMAGE_SIZE,
  //   { message: `Max file size is 5MB.` }
  // ),
  bannerImageAssetId: z.string().or(z.null()).or(z.object({})).optional(),
});

export type EditProfileSchemaType = z.infer<typeof editProfileSchema>;
