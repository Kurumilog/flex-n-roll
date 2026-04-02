import { z } from "zod";

export const TodayMetricsSchema = z.object({
  totalProcessed: z.number().int().nonnegative(),
  aiConfidenceAvg: z.number().min(0).max(100),
  autoRouted: z.number().int().nonnegative(),
  manualReview: z.number().int().nonnegative(),
  slaCompliance: z.number().min(0).max(100),
});

export type TodayMetrics = z.infer<typeof TodayMetricsSchema>;
