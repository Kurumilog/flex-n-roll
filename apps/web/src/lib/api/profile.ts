import type { ProfileResponse, UpdateProfileRequest } from "@flex-n-roll/shared-types";
import {
  ProfileResponseSchema,
  UpdateProfileRequestSchema,
} from "@flex-n-roll/shared-types";

import { apiRequest, isMockMode } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mockGetProfile, mockUpdateProfile } from "@/lib/api/mock-api";

export async function getProfile() {
  if (isMockMode()) {
    return mockGetProfile();
  }

  const response = await apiRequest<ProfileResponse>(API_ENDPOINTS.profile.detail);
  return ProfileResponseSchema.parse(response);
}

export async function updateProfile(payload: UpdateProfileRequest) {
  if (isMockMode()) {
    return mockUpdateProfile(payload);
  }

  const validated = UpdateProfileRequestSchema.parse(payload);
  const response = await apiRequest<ProfileResponse>(API_ENDPOINTS.profile.detail, {
    method: "PATCH",
    body: validated,
  });

  return ProfileResponseSchema.parse(response);
}
