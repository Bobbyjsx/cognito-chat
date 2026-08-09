import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { AttachmentSchema, PaginatedResponse } from "@/types";

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<AttachmentSchema>(
        "/agent/attachments",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
  });
}

export function useGetSessionAttachments(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-attachments", sessionId],
    queryFn: async () => {
      const { data } = await api.get<AttachmentSchema[]>("/agent/attachments", {
        params: { session_id: sessionId },
      });
      return data;
    },
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const { data } = await api.delete<{ message: string }>(
        `/agent/attachments/${attachmentId}`,
      );
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-attachments"] });
    },
  });
}

export function useGetLibraryAttachments(type?: string, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ["attachments-library", type || "all"],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: pageParam.toString(),
      });
      if (type) {
        params.append("type", type);
      }
      const { data } = await api.get<PaginatedResponse<AttachmentSchema>>(
        `/agent/attachments?${params.toString()}`,
      );
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
    initialPageParam: 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
