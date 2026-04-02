"use client";

import type { UpdateProfileRequest } from "@flex-n-roll/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getProfile, updateProfile } from "@/lib/api/profile";
import { queryKeys } from "@/lib/query-keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: getProfile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfile(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.profile.detail, response);
      queryClient.setQueryData(queryKeys.auth.me, { user: response.profile });
    },
  });
}
