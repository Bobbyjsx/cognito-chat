import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { PromptItem } from "@/lib/prompt-library";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { normalizeTier } from "@/lib/plans";

export function usePrompts(
  query: string = "",
  category: string = "all",
  options?: { enabled?: boolean },
) {
  const { data: profile } = useProfile();
  const isPremium = normalizeTier(profile?.tier) === "premium";
  const isEnabled = (options?.enabled ?? true) && isPremium;

  return useQuery<PromptItem[]>({
    queryKey: ["prompts", query, category],
    queryFn: async () => {
      const res = await api.get("/prompts", { params: { q: query, category } });
      return res.data;
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      prompt: string;
      tags?: string[];
    }) => {
      const res = await api.post("/prompts", {
        ...data,
        category: "custom",
      });
      return res.data as PromptItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
