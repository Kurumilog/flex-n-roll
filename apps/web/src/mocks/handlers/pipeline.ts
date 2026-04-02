import { HttpResponse, delay, http } from "msw";

import { pipelineHistory, pipelineStatus } from "@/mocks/data/metrics";

export const pipelineHandlers = [
  http.get("/api/pipeline/status", async () => {
    await delay(220);
    return HttpResponse.json(pipelineStatus);
  }),
  http.get("/api/pipeline/history", async () => {
    await delay(240);
    return HttpResponse.json({ items: pipelineHistory });
  }),
];
