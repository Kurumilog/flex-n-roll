import { HttpResponse, delay, http } from "msw";

import { mockApplications } from "@/mocks/data/applications";

export const applicationsHandlers = [
  http.get("/api/applications", async () => {
    await delay(280);

    return HttpResponse.json({
      items: mockApplications,
      total: mockApplications.length,
    });
  }),
];
