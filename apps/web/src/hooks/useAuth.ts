"use client";

import type { BitrixLoginRequest, LoginRequest } from "@flex-n-roll/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, login, loginWithBitrix, logout } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";

export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    retry: false,
    enabled,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.me, { user: response.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail });
    },
  });
}

export function useBitrixLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: BitrixLoginRequest) => loginWithBitrix(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.me, { user: response.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      queryClient.removeQueries({ queryKey: queryKeys.profile.detail });
    },
  });
}
