import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { AppConfig } from "@/types";

export function useGetConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      const { data } = await api.get<AppConfig>("/config");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
