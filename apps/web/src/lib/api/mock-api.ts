import type {
  AnalyticsCategoriesResponse,
  ApplicationsResponse,
  AuthMeResponse,
  AuthSessionResponse,
  BitrixLoginRequest,
  LoginRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from "@flex-n-roll/shared-types";

import { mockApplications } from "@/mocks/data/applications";
import {
  categoriesAnalytics,
  pipelineStatus,
  todayMetrics,
} from "@/mocks/data/metrics";
import {
  createBitrixSession,
  createEmailSession,
  getProfileBySession,
  getUserBySession,
  revokeSession,
  updateProfileBySession,
} from "@/mocks/data/auth";
import { getMockSessionCookie, setMockSessionCookie, clearMockSessionCookie } from "@/lib/auth/session";

export async function mockLogin(payload: LoginRequest): Promise<AuthSessionResponse> {
  const session = createEmailSession(payload.email);
  setMockSessionCookie(session.sessionId);
  return session;
}

export async function mockLoginWithBitrix(
  _payload: BitrixLoginRequest = {},
): Promise<AuthSessionResponse> {
  const session = createBitrixSession();
  setMockSessionCookie(session.sessionId);
  return session;
}

export async function mockGetMe(): Promise<AuthMeResponse> {
  const user = getUserBySession(getMockSessionCookie());
  if (!user) {
    throw new Error("Сессия не найдена.");
  }

  return { user };
}

export async function mockLogout() {
  revokeSession(getMockSessionCookie());
  clearMockSessionCookie();
  return { ok: true };
}

export async function mockGetProfile(): Promise<ProfileResponse> {
  const profile = getProfileBySession(getMockSessionCookie());
  if (!profile) {
    throw new Error("Сессия не найдена.");
  }

  return { profile };
}

export async function mockUpdateProfile(
  payload: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const profile = updateProfileBySession(getMockSessionCookie(), payload);
  if (!profile) {
    throw new Error("Сессия не найдена.");
  }

  return { profile };
}

export async function mockGetApplications(): Promise<ApplicationsResponse> {
  return {
    items: mockApplications,
    total: mockApplications.length,
  };
}

export async function mockGetTodayMetrics() {
  return todayMetrics;
}

export async function mockGetPipelineStatus() {
  return pipelineStatus;
}

export async function mockGetCategoryAnalytics(): Promise<AnalyticsCategoriesResponse> {
  return categoriesAnalytics;
}
