import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/axios";
import type {
  AttachmentSchema,
  PaginatedResponse,
  PresignedUploadResponse,
} from "@/types";

export async function uploadFileDirectly(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<AttachmentSchema> {
  const { data: ticket } = await api.post<PresignedUploadResponse>(
    "/agent/attachments/upload-url",
    {
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    },
  );

  const headers = ticket.headers ?? {};
  const isAbsolute =
    ticket.uploadUrl.startsWith("http://") ||
    ticket.uploadUrl.startsWith("https://");
  const uploadClient = isAbsolute ? axios : api;

  await uploadClient.put(ticket.uploadUrl, file, {
    headers: {
      ...headers,
      "Content-Type": file.type || "application/octet-stream",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const p = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress?.(Math.min(p, 99));
      }
    },
  });

  onProgress?.(100);
  return ticket.attachment;
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFileDirectly(file),
    onSuccess: () => {
      // Invalidate library view so the new permanent attachment shows up immediately
      queryClient.invalidateQueries({ queryKey: ["attachments-library"] });
      queryClient.invalidateQueries({ queryKey: ["chat-attachments"] });
    },
  });
}

export function useGetSessionAttachments(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-attachments", sessionId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AttachmentSchema>>(
        "/agent/attachments",
        {
          params: { session_id: sessionId },
        },
      );
      return data.items;
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
      queryClient.invalidateQueries({ queryKey: ["attachments-library"] });
    },
  });
}

export function useGetLibraryAttachments(
  type?: string,
  query?: string,
  limit: number = 15,
) {
  return useInfiniteQuery({
    queryKey: ["attachments-library", type || "all", query || ""],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: pageParam.toString(),
      });
      if (type) {
        params.append("type", type);
      }
      if (query) {
        params.append("query", query);
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

/**
 * Checks if a signed URL is expired or about to expire within the buffer window.
 * @param urlExpiresAt ISO string or Date timestamp
 * @param bufferMs Safety buffer in milliseconds (defaults to 60,000ms = 1 minute)
 */
export function isUrlExpired(
  urlExpiresAt?: string | Date | null,
  bufferMs = 60_000,
): boolean {
  if (!urlExpiresAt) return false;
  const expiryTime =
    urlExpiresAt instanceof Date
      ? urlExpiresAt.getTime()
      : new Date(urlExpiresAt).getTime();
  if (isNaN(expiryTime)) return false;
  return Date.now() + bufferMs >= expiryTime;
}

/**
 * Fetches a single attachment with a fresh signed URL from the backend.
 */
export async function fetchFreshAttachmentUrl(
  attachmentId: string,
): Promise<AttachmentSchema> {
  const { data } = await api.get<AttachmentSchema>(
    `/agent/attachments/${attachmentId}`,
  );
  return data;
}

export function useGetAttachment(attachmentId: string | null) {
  return useQuery({
    queryKey: ["attachment", attachmentId],
    queryFn: () =>
      attachmentId ? fetchFreshAttachmentUrl(attachmentId) : null,
    enabled: Boolean(attachmentId),
    staleTime: 5 * 60 * 1000,
  });
}
