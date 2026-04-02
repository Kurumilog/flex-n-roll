import { HttpResponse, delay, http } from "msw";

import { escalations, todayMetrics } from "@/mocks/data/metrics";

export const metricsHandlers = [
  http.get("/api/metrics/today", async () => {
    await delay(240);
    return HttpResponse.json(todayMetrics);
  }),
  http.get("/api/escalations", async () => {
    await delay(200);
    return HttpResponse.json({ items: escalations });
  }),
];
