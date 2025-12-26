"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import type { LoginData, RegisterData, UserResponse } from "@/types";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
  });
}

export function useMe(enabled = true) {
  return useQuery<UserResponse>({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled,
  });
}
