import { z } from "zod";

export const PipelineStepStatusSchema = z.enum(["idle", "active", "done", "error"]);

export const PipelineStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: PipelineStepStatusSchema,
  duration: z.number().nonnegative().optional(),
});

export const PipelineStatusResponseSchema = z.object({
  steps: z.array(PipelineStepSchema),
});

export type PipelineStepStatus = z.infer<typeof PipelineStepStatusSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type PipelineStatusResponse = z.infer<typeof PipelineStatusResponseSchema>;
