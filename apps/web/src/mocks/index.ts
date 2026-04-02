import { analyticsHandlers } from "@/mocks/handlers/analytics";
import { applicationsHandlers } from "@/mocks/handlers/applications";
import { authHandlers } from "@/mocks/handlers/auth";
import { metricsHandlers } from "@/mocks/handlers/metrics";
import { pipelineHandlers } from "@/mocks/handlers/pipeline";
import { profileHandlers } from "@/mocks/handlers/profile";

export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...applicationsHandlers,
  ...metricsHandlers,
  ...pipelineHandlers,
  ...analyticsHandlers,
];
