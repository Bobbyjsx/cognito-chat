import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "@/components/ui/toast";
import { useRouter, usePathname } from "next/navigation";
import {
  api,
  registerActiveSession,
  unregisterActiveSession,
} from "@/lib/axios";
import { useGetSessions, getGenerationPollInterval } from "./useChats";

export function useBackgroundGenerationsEngine() {
  const { data: sessionPages } = useGetSessions("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // Extract all active generation IDs from current sidebar (memoized)
  const activeGens = useMemo(
    () =>
      (sessionPages?.pages || []).flatMap((page) =>
        (page.items || [])
          .filter((s) => s.activeGenerationId)
          .map((s) => ({
            sessionId: s.id,
            title: s.title || "New Chat",
            generationId: s.activeGenerationId!,
          })),
      ),
    [sessionPages],
  );

  // Sync active sessions with Axios cache busting registry
  useEffect(() => {
    activeGens.forEach((g) => registerActiveSession(g.sessionId));
  }, [activeGens]);

  // Track which sessions HAD an activeGenerationId in the previous render.
  // Key: sessionId → { generationId, title }
  const prevActiveRef = useRef<
    Record<string, { generationId: string; title: string }>
  >({});
  // Track which generation IDs we've already toasted for (to avoid duplicates)
  const toastedRef = useRef<Set<string>>(new Set());

  // Build current active map for quick lookup
  const currentActiveMap = useMemo(
    () => Object.fromEntries(activeGens.map((g) => [g.sessionId, g])),
    [activeGens],
  );

  // Helper to trigger success/failure toast with action button
  const notifyGenerationResult = (
    status: string,
    generationId: string,
    sessionId: string,
    title: string,
    errorDetail?: string,
  ) => {
    if (toastedRef.current.has(generationId)) return;
    toastedRef.current.add(generationId);

    // Generation is done — resume standard caching for this session
    unregisterActiveSession(sessionId);

    // Suppress notification if user is currently inside this chat
    const isCurrentChat =
      Boolean(sessionId) &&
      (pathname === `/chat/${sessionId}` ||
        pathname.startsWith(`/chat/${sessionId}/`));

    if (!isCurrentChat) {
      if (status === "completed") {
        toast.success("Response ready", {
          description: `Agent has finished generating for "${title}"`,
          action: {
            label: "View response",
            onClick: () => router.push(`/chat/${sessionId}`),
          },
        });
      } else if (status === "failed") {
        toast.error("Generation failed", {
          description: errorDetail || `Agent failed to respond for "${title}"`,
          action: {
            label: "View chat",
            onClick: () => router.push(`/chat/${sessionId}`),
          },
        });
      }
      // "cancelled" is silently ignored — it typically means the SSE client
      // disconnected (e.g. page reload/navigation), not a real failure.
    }

    queryClient.invalidateQueries({
      queryKey: ["chat-sessions"],
      refetchType: "all",
    });
    if (sessionId) {
      queryClient.invalidateQueries({
        queryKey: ["chat-session", sessionId],
        refetchType: "all",
      });
    }
  };

  // --- Strategy 1: detect completions by comparing prev vs current sessions list ---
  useEffect(() => {
    const prev = prevActiveRef.current;

    for (const [sessionId, { generationId, title }] of Object.entries(prev)) {
      if (
        !(sessionId in currentActiveMap) &&
        !toastedRef.current.has(generationId)
      ) {
        // Fetch generation record to accurately determine completed vs failed
        void (async () => {
          try {
            const { data } = await api.get(
              `/agent/generations/${generationId}`,
            );
            if (data?.status) {
              notifyGenerationResult(
                data.status,
                generationId,
                sessionId,
                title,
                data.error,
              );
            }
          } catch {
            notifyGenerationResult("completed", generationId, sessionId, title);
          }
        })();
      }
    }

    // Update prev to current
    prevActiveRef.current = currentActiveMap;
  }, [currentActiveMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Strategy 2: poll /agent/generations/:id as fallback for active background gens ---
  const queries = useQueries({
    queries: activeGens.map((gen) => ({
      queryKey: ["generation", gen.generationId],
      queryFn: async () => {
        const { data } = await api.get(
          `/agent/generations/${gen.generationId}`,
        );
        return data;
      },
      // Poll with exponential backoff after 7 polls (2s -> 3s -> 4.5s -> 6.75s -> 10s max)
      refetchInterval: (q: any) => getGenerationPollInterval(q),
    })),
  });

  const prevPollStatusRef = useRef<Record<string, string>>({});

  // Compute a stable signature of query results to prevent firing effect on every render
  const queriesSignature = queries
    .map((q) => `${q.data?.id ?? ""}:${q.data?.status ?? ""}`)
    .join("|");

  useEffect(() => {
    queries.forEach((q) => {
      const data = q.data;
      if (!data) return;

      const prev = prevPollStatusRef.current[data.id];
      const current = data.status;

      if (prev !== current) {
        prevPollStatusRef.current[data.id] = current;

        const genConf = activeGens.find((g) => g.generationId === data.id);
        const title = genConf?.title || "Chat";
        const sessionId =
          genConf?.sessionId || data.sessionId || data.session_id;

        if (
          current === "completed" ||
          current === "failed" ||
          current === "cancelled"
        ) {
          notifyGenerationResult(
            current,
            data.id,
            sessionId,
            title,
            data.error,
          );
        }
      }
    });
  }, [queriesSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  return queries;
}
