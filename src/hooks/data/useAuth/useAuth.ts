import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateCustomInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customInstructions: string | null) => {
      const { data } = await api.put<{
        message: string;
        customInstructions: string | null;
      }>("/auth/custom-instructions", {
        customInstructions,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfile | undefined>(
        profileQueryKey,
        (old) => {
          if (!old) return old;
          return { ...old, customInstructions: data.customInstructions };
        },
      );
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}
