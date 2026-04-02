import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["manager", "supervisor", "admin"]),
  department: z.string().min(1),
  timezone: z.string().min(1),
  bio: z.string().max(280).optional(),
  avatar: z.string().optional(),
});

export const ProfileResponseSchema = z.object({
  profile: ProfileSchema,
});

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  bio: z.string().max(280).optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
