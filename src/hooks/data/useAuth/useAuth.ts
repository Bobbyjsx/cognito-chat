import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { UserProfile } from "@/types";

export const profileQueryKey = ["profile"] as const;

export async function fetchProfile() {
  const { data } = await api.get<UserProfile>("/auth/me");
  return data;
}

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
