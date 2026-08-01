import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  UserCreateRequest,
  PasswordResetRequest,
  UserProfile,
} from "@/types";

export function useSignup() {
  return useMutation({
    mutationFn: async (request: UserCreateRequest) => {
      const { data } = await api.post<UserProfile>("/auth/signup", request);
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (request: PasswordResetRequest) => {
      const { data } = await api.post<{ message: string }>(
        "/auth/reset-password",
        request,
      );
      return data;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get<UserProfile>("/auth/me");
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
