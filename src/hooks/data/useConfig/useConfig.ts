import { useQuery } from "@tanstack/react-query";
import { getConfigAction } from "@/lib/actions/config";

export function useGetConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: () => getConfigAction(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
