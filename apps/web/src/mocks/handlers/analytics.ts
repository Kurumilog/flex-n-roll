import { HttpResponse, delay, http } from "msw";

import { categoriesAnalytics } from "@/mocks/data/metrics";

export const analyticsHandlers = [
  http.get("/api/analytics/categories", async () => {
    await delay(260);
    return HttpResponse.json(categoriesAnalytics);
  }),
  http.get("/api/analytics/deal/:id", async ({ params }) => {
    await delay(260);

    return HttpResponse.json({
      id: params.id,
      totalDurationMinutes: 42,
      departments: [
        { name: "Sales", durationMinutes: 18 },
        { name: "Production", durationMinutes: 14 },
        { name: "Support", durationMinutes: 10 },
      ],
      outcome: "won",
    });
  }),
];
