import { z } from "zod";

export const AnalyticsCategoryItemSchema = z.object({
  category: z.enum(["commercial", "support", "technical"]),
  value: z.number().int().nonnegative(),
});

export const AnalyticsCategoriesResponseSchema = z.object({
  items: z.array(AnalyticsCategoryItemSchema),
});

export type AnalyticsCategoryItem = z.infer<typeof AnalyticsCategoryItemSchema>;
export type AnalyticsCategoriesResponse = z.infer<typeof AnalyticsCategoriesResponseSchema>;
