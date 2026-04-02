import { z } from "zod";

export const ApplicationSourceSchema = z.enum(["email", "facebook", "webform"]);
export const ApplicationIntentSchema = z.enum(["commercial", "support", "technical"]);
export const ApplicationUrgencySchema = z.enum(["low", "medium", "high"]);
export const ApplicationComplexitySchema = z.enum(["low", "medium", "high"]);
export const ApplicationStatusSchema = z.enum(["processing", "assigned", "escalated"]);

export const AssignedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export const ApplicationSchema = z.object({
  id: z.string(),
  source: ApplicationSourceSchema,
  rawText: z.string(),
  intent: ApplicationIntentSchema,
  urgency: ApplicationUrgencySchema,
  complexity: ApplicationComplexitySchema,
  aiConfidence: z.number().min(0).max(100),
  assignedTo: AssignedUserSchema,
  bitrix24DealId: z.string().optional(),
  bitrix24DealUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
  processedAt: z.coerce.date().optional(),
  status: ApplicationStatusSchema,
});

export const ApplicationsResponseSchema = z.object({
  items: z.array(ApplicationSchema),
  total: z.number().int().nonnegative(),
});

export type ApplicationSource = z.infer<typeof ApplicationSourceSchema>;
export type ApplicationIntent = z.infer<typeof ApplicationIntentSchema>;
export type ApplicationUrgency = z.infer<typeof ApplicationUrgencySchema>;
export type ApplicationComplexity = z.infer<typeof ApplicationComplexitySchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type AssignedUser = z.infer<typeof AssignedUserSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationsResponse = z.infer<typeof ApplicationsResponseSchema>;
