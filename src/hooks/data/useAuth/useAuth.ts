import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { UserProfile } from "@/types";

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
