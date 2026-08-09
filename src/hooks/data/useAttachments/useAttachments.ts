import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { AttachmentSchema } from "@/types";

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
