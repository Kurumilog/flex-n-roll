import { HttpResponse, delay, http } from "msw";

import { LoginRequestSchema } from "@flex-n-roll/shared-types";

import {
  createBitrixSession,
  createEmailSession,
  getUserBySession,
  revokeSession,
} from "@/mocks/data/auth";
import { getSessionIdFromRequest } from "@/mocks/handlers/session";

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(260);
    const payload = await request.json();
    const parsed = LoginRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return HttpResponse.json(
        {
          message: "Проверьте корректность email и пароля.",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    if (parsed.data.password !== "demo12345") {
      return HttpResponse.json(
        {
          message: "Неверный пароль. Для демо используйте demo12345.",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    const session = createEmailSession(parsed.data.email);
    return HttpResponse.json(session);
  }),

  http.post("/api/auth/bitrix", async () => {
    await delay(320);
    const session = createBitrixSession();
    return HttpResponse.json(session);
  }),

  http.get("/api/auth/me", async ({ request }) => {
    await delay(180);
    const sessionId = getSessionIdFromRequest(request);
    const user = getUserBySession(sessionId);

    if (!user) {
      return HttpResponse.json(
        { message: "Сессия не найдена.", statusCode: 401 },
        { status: 401 },
      );
    }

    return HttpResponse.json({ user });
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await delay(120);
    const sessionId = getSessionIdFromRequest(request);
    revokeSession(sessionId);
    return HttpResponse.json({ ok: true });
  }),
];
