import { useQuery } from "@tanstack/react-query";
import { getConfigAction } from "@/lib/actions/config";
import { isServerError } from "@/lib/server-error";

export function useGetConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      const res = await getConfigAction();
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });
}
