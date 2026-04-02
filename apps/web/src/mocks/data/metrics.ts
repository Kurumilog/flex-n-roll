import type {
  AnalyticsCategoriesResponse,
  PipelineStatusResponse,
  TodayMetrics,
} from "@flex-n-roll/shared-types";

export const todayMetrics: TodayMetrics = {
  totalProcessed: 12,
  aiConfidenceAvg: 94,
  autoRouted: 10,
  manualReview: 2,
  slaCompliance: 100,
};

export const pipelineStatus: PipelineStatusResponse = {
  steps: [
    { id: "step-1", label: "Webhook Received", status: "done", duration: 84 },
    { id: "step-2", label: "AI Parsing", status: "done", duration: 620 },
    { id: "step-3", label: "Intent Classification", status: "active", duration: 410 },
    { id: "step-4", label: "Bitrix24 Sync", status: "idle" },
  ],
};

export const pipelineHistory = [
  { id: "hist-1", finishedAt: "2026-04-02T11:02:14.000Z", durationMs: 14000 },
  { id: "hist-2", finishedAt: "2026-04-02T11:11:17.000Z", durationMs: 17000 },
  { id: "hist-3", finishedAt: "2026-04-02T11:25:22.000Z", durationMs: 22000 },
];

export const categoriesAnalytics: AnalyticsCategoriesResponse = {
  items: [
    { category: "commercial", value: 6 },
    { category: "support", value: 4 },
    { category: "technical", value: 2 },
  ],
};

export const escalations = [
  {
    id: "esc-451",
    dealId: "BX-1455",
    message: "Manager did not reply in 4h. Escalated to production supervisor.",
    createdAt: "2026-04-02T11:58:00.000Z",
  },
];
