import { HttpResponse, delay, http } from "msw";

import { UpdateProfileRequestSchema } from "@flex-n-roll/shared-types";

import {
  getProfileBySession,
  updateProfileBySession,
} from "@/mocks/data/auth";
import { getSessionIdFromRequest } from "@/mocks/handlers/session";

export const profileHandlers = [
  http.get("/api/profile", async ({ request }) => {
    await delay(220);
    const sessionId = getSessionIdFromRequest(request);
    const profile = getProfileBySession(sessionId);

    if (!profile) {
      return HttpResponse.json(
        { message: "Сессия не найдена.", statusCode: 401 },
        { status: 401 },
      );
    }

    return HttpResponse.json({ profile });
  }),

  http.patch("/api/profile", async ({ request }) => {
    await delay(260);
    const sessionId = getSessionIdFromRequest(request);
    const payload = await request.json();
    const parsed = UpdateProfileRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return HttpResponse.json(
        { message: "Проверьте данные профиля.", statusCode: 400 },
        { status: 400 },
      );
    }

    const profile = updateProfileBySession(sessionId, parsed.data);

    if (!profile) {
      return HttpResponse.json(
        { message: "Сессия не найдена.", statusCode: 401 },
        { status: 401 },
      );
    }

    return HttpResponse.json({ profile });
  }),
];
