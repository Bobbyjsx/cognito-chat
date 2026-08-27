import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { AppConfig } from "@/types";

export const appConfigQueryKey = ["app-config"] as const;

export async function fetchAppConfig() {
  const { data } = await api.get<AppConfig>("/config");
  return data;
}

export function useGetConfig() {
  return useQuery({
    queryKey: appConfigQueryKey,
    queryFn: fetchAppConfig,
    staleTime: 5 * 60 * 1000,
  });
}
