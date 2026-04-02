import type {
  AuthMeResponse,
  AuthSessionResponse,
  BitrixLoginRequest,
  LoginRequest,
} from "@flex-n-roll/shared-types";
import {
  AuthMeResponseSchema,
  AuthSessionResponseSchema,
} from "@flex-n-roll/shared-types";

import { apiRequest, isMockMode } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  mockGetMe,
  mockLogin,
  mockLoginWithBitrix,
  mockLogout,
} from "@/lib/api/mock-api";

export async function login(payload: LoginRequest) {
  if (isMockMode()) {
    return mockLogin(payload);
  }

  const response = await apiRequest<AuthSessionResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: payload,
  });
  const parsed = AuthSessionResponseSchema.parse(response);

  return parsed;
}

export async function loginWithBitrix(payload: BitrixLoginRequest = {}) {
  if (isMockMode()) {
    return mockLoginWithBitrix(payload);
  }

  const response = await apiRequest<AuthSessionResponse>(API_ENDPOINTS.auth.bitrix, {
    method: "POST",
    body: payload,
  });
  const parsed = AuthSessionResponseSchema.parse(response);

  return parsed;
}

export async function getMe() {
  if (isMockMode()) {
    return mockGetMe();
  }

  const response = await apiRequest<AuthMeResponse>(API_ENDPOINTS.auth.me);
  return AuthMeResponseSchema.parse(response);
}

export async function logout() {
  if (isMockMode()) {
    return mockLogout();
  }

  await apiRequest<{ ok: boolean }>(API_ENDPOINTS.auth.logout, {
    method: "POST",
  });
}
