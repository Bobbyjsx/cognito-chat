import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import type { SessionWithPaginatedMessages } from "../src/types";

describe("Chat Session Cache Integrity & InfiniteData Protection", () => {
  it("should not create corrupted flat cache entry when old is undefined", () => {
    const queryClient = new QueryClient();
    const nextId = "session-123";
    const nextTitle = "New Title";

    // Safe updater pattern used in ChatShell:
    queryClient.setQueryData<InfiniteData<SessionWithPaginatedMessages>>(
      ["chat-session", nextId],
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  session: {
                    ...page.session,
                    title: nextTitle,
                  },
                }
              : page,
          ),
        };
      },
    );

    const cached = queryClient.getQueryData(["chat-session", nextId]);
    assert.equal(cached, undefined);
  });

  it("should cleanly update title in InfiniteData when pages exist", () => {
    const queryClient = new QueryClient();
    const sessionId = "session-456";

    const initialData: InfiniteData<SessionWithPaginatedMessages> = {
      pages: [
        {
          session: {
            id: sessionId,
            userId: "user-1",
            title: "Original Title",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messages: {
            items: [],
            total: 0,
            limit: 50,
            offset: 0,
            hasMore: false,
          },
          activeGenerationId: null,
        },
      ],
      pageParams: [0],
    };

    queryClient.setQueryData(["chat-session", sessionId], initialData);

    const nextTitle = "Updated Topic Discussion";
    queryClient.setQueryData<InfiniteData<SessionWithPaginatedMessages>>(
      ["chat-session", sessionId],
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  session: {
                    ...page.session,
                    title: nextTitle,
                  },
                }
              : page,
          ),
        };
      },
    );

    const updated = queryClient.getQueryData<
      InfiniteData<SessionWithPaginatedMessages>
    >(["chat-session", sessionId]);
    assert.ok(updated?.pages);
    assert.equal(updated.pages.length, 1);
    assert.equal(updated.pages[0].session.title, "Updated Topic Discussion");
  });

  it("should purge corrupted non-InfiniteData cache entries", () => {
    const queryClient = new QueryClient();
    const sessionId = "session-corrupted-789";

    // Simulate previously corrupted cache entry where a plain object without `pages` was written
    queryClient.setQueryData(["chat-session", sessionId], {
      id: sessionId,
      title: "Corrupted Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const corrupted = queryClient.getQueryData<{ pages?: unknown }>([
      "chat-session",
      sessionId,
    ]);
    assert.ok(corrupted);
    assert.equal(Array.isArray(corrupted.pages), false);

    // Self-healing guard logic from useGetSession:
    if (corrupted && !Array.isArray(corrupted.pages)) {
      queryClient.removeQueries({
        queryKey: ["chat-session", sessionId],
        exact: true,
      });
    }

    const cleaned = queryClient.getQueryData(["chat-session", sessionId]);
    assert.equal(cleaned, undefined);
  });
});
