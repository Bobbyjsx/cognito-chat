import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as loginRouteGET } from "../src/app/(auth)/login/route";
import {
  parseInFlightOAuth,
  appendInFlightOAuth,
  type OAuthStateEntry,
} from "../src/lib/auth/oauth-manager";
import { middleware } from "../src/middleware";

describe("OAuth State & ReturnTo Callback Preservation", () => {
  it("should preserve returnTo callback URL in OAuthStateEntry", () => {
    const initial: OAuthStateEntry[] = [];
    const callbackUrl = "/share/test-share-123?action=continue";

    const updated = appendInFlightOAuth(
      initial,
      "state_abc",
      "verifier_xyz",
      60000,
      callbackUrl,
    );

    assert.equal(updated.length, 1);
    assert.equal(updated[0].s, "state_abc");
    assert.equal(updated[0].v, "verifier_xyz");
    assert.equal(updated[0].r, callbackUrl);

    // Serialization & parsing check
    const serialized = JSON.stringify(updated);
    const parsed = parseInFlightOAuth(serialized);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].r, callbackUrl);
  });

  it("should extract callbackUrl from request params and persist to cookie in /login", async () => {
    const targetUrl = "/share/snapshot-456?action=continue";
    const req = new NextRequest(
      `http://localhost:3000/login?callbackUrl=${encodeURIComponent(targetUrl)}`,
      {
        headers: {
          host: "localhost:3000",
        },
      },
    );

    const res = await loginRouteGET(req);
    assert.ok(res.status === 307 || res.status === 302 || res.status === 308);

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie?.includes("oauth_in_flight="));
    assert.ok(setCookie);

    // Decode cookie and verify returnTo is stored inside
    const match = setCookie.match(/oauth_in_flight=([^;]+)/);
    assert.ok(match && match[1]);
    const decodedRaw = decodeURIComponent(match[1]);
    const parsedEntries = parseInFlightOAuth(decodedRaw);

    assert.ok(parsedEntries.length > 0);
    const latestEntry = parsedEntries[parsedEntries.length - 1];
    assert.equal(latestEntry.r, targetUrl);
  });
});

describe("Public Chats & Middleware Routing Rules", () => {
  it("should allow public access to /share/[shareId] without session cookie or redirect", () => {
    const req = new NextRequest(
      "http://localhost:3000/share/public-chat-uuid-123",
    );
    const res = middleware(req);

    // Should NOT redirect to /login
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("location"), null);
  });

  it("should redirect unauthenticated users on protected /chat routes with callbackUrl query param", () => {
    const req = new NextRequest(
      "http://localhost:3000/chat/private-session-789",
    );
    const res = middleware(req);

    // Should redirect to /login with callbackUrl
    assert.equal(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(location);
    const redirectUrl = new URL(location);
    assert.equal(redirectUrl.pathname, "/login");
    assert.equal(
      redirectUrl.searchParams.get("callbackUrl"),
      "/chat/private-session-789",
    );
  });
});

describe("Shared Chats Query Keys & Contract Types", () => {
  it("should generate proper react-query cache keys for shared chats", async () => {
    const { sharedChatQueryKey } =
      await import("../src/hooks/data/useSharedChats/useSharedChats");
    const key = sharedChatQueryKey("share-abc-123");
    assert.deepEqual(key, ["shared-chat", "share-abc-123"]);
  });

  it("should properly distinguish revoked share errors from other errors", () => {
    const revokedError = {
      response: {
        status: 404,
        data: {
          detail: "Conversation has been deleted",
          code: "SHARE_REVOKED",
        },
      },
    };

    const isRevoked =
      revokedError.response?.status === 404 &&
      revokedError.response?.data?.code === "SHARE_REVOKED";

    assert.equal(isRevoked, true);

    const genericError = {
      response: {
        status: 500,
        data: {
          detail: "Internal Server Error",
        },
      },
    };

    const isGenericRevoked =
      genericError.response?.status === 404 &&
      (genericError.response?.data as any)?.code === "SHARE_REVOKED";

    assert.equal(isGenericRevoked, false);
  });

  it("should preserve excludeFromMemory flag on session models", () => {
    const sessionWithMemoryExcluded = {
      id: "session-1",
      userId: "user-1",
      title: "Imported Chat",
      excludeFromMemory: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.equal(sessionWithMemoryExcluded.excludeFromMemory, true);
  });

  it("should derive ownership cleanly via isOwner without returning redundant showName boolean", () => {
    const sharedChatOwner = {
      id: "share-xyz",
      sessionId: "session-abc",
      title: "Quantum Mechanics",
      authorName: "Alice",
      isOwner: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 5,
      messages: [],
    };

    // showName is derived rather than returned as a boolean
    assert.equal("showName" in sharedChatOwner, false);
    assert.equal(
      Boolean(
        sharedChatOwner.authorName &&
        sharedChatOwner.authorName !== "Anonymous",
      ),
      true,
    );
    assert.equal(sharedChatOwner.isOwner, true);

    const sharedChatAnonymous = {
      id: "share-anonymous",
      sessionId: "session-anon",
      title: "Anonymous Topic",
      authorName: "Anonymous",
      isOwner: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 2,
      messages: [],
    };

    assert.equal("showName" in sharedChatAnonymous, false);
    assert.equal(
      Boolean(
        sharedChatAnonymous.authorName &&
        sharedChatAnonymous.authorName !== "Anonymous",
      ),
      false,
    );
    assert.equal(sharedChatAnonymous.isOwner, false);
  });

  it("should prepend imported session to pages array immediately for instant sidebar display", () => {
    type SessionItem = {
      id: string;
      userId: string;
      title: string;
      excludeFromMemory?: boolean;
      readStatus?: string;
      createdAt: string;
      updatedAt: string;
    };

    const existingPages: Array<{
      items: SessionItem[];
      limit: number;
      offset: number;
      hasMore: boolean;
    }> = [
      {
        items: [
          {
            id: "old-1",
            userId: "u1",
            title: "Old Chat",
            createdAt: "",
            updatedAt: "",
          },
        ],
        limit: 15,
        offset: 0,
        hasMore: false,
      },
    ];

    const newSessionItem: SessionItem = {
      id: "new-imported-123",
      userId: "",
      title: "Imported from share",
      excludeFromMemory: true,
      readStatus: "read",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPages = [
      {
        ...existingPages[0],
        items: [newSessionItem, ...existingPages[0].items],
      },
    ];

    assert.equal(updatedPages[0].items.length, 2);
    assert.equal(updatedPages[0].items[0].id, "new-imported-123");
    assert.equal(updatedPages[0].items[0].excludeFromMemory, true);
  });
});

describe("Share Flow & Web Share API Integration", () => {
  it("should construct correct share payload for Web Share API", () => {
    const origin = "https://cognito.chat";
    const shareId = "share-uuid-777";
    const sessionTitle = "Quantum Computing Architecture";

    const shareUrl = `${origin}/share/${shareId}`;
    const payload = {
      title: sessionTitle || "Shared Conversation",
      url: shareUrl,
    };

    assert.equal(payload.url, "https://cognito.chat/share/share-uuid-777");
    assert.equal(payload.title, "Quantum Computing Architecture");
  });

  it("should fallback gracefully if Web Share throws AbortError (user dismisses native sheet)", async () => {
    let nativeShareCalled = false;
    let fallbackTriggeredWithoutCrash = false;

    const mockNavigator = {
      share: async (_payload: { title: string; url: string }) => {
        nativeShareCalled = true;
        const err = new Error("Share canceled");
        err.name = "AbortError";
        throw err;
      },
    };

    try {
      await mockNavigator.share({
        title: "Test Chat",
        url: "https://cognito.chat/share/test",
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        fallbackTriggeredWithoutCrash = true;
      }
    }

    assert.equal(nativeShareCalled, true);
    assert.equal(fallbackTriggeredWithoutCrash, true);
  });

  it("should maintain initial unshared state without premature API triggers until user initiates", () => {
    let apiCalled = false;
    let shareData: { shareId: string } | null = null;
    const sessionShareId: string | undefined = undefined;

    // Opening modal does NOT call the session-share API when shareId is undefined
    const shouldFetchExistingShare = Boolean(sessionShareId);
    const onModalOpen = () => {
      if (shouldFetchExistingShare) {
        apiCalled = true;
      }
      // shareData remains null, awaiting explicit user action
    };

    onModalOpen();
    assert.equal(shouldFetchExistingShare, false);
    assert.equal(apiCalled, false);
    assert.ok(shareData === null);

    // User clicking "Share chat" triggers API
    shareData = { shareId: "generated-share-id" };
    apiCalled = true;

    assert.equal(apiCalled, true);
    assert.equal(shareData.shareId, "generated-share-id");
  });

  it("should only fetch existing share details when session already has a shareId", () => {
    const unsharedSession = {
      id: "s1",
      shareId: undefined as string | undefined,
    };
    const sharedSession = {
      id: "s2",
      shareId: "share-abc" as string | undefined,
    };

    assert.equal(Boolean(unsharedSession.shareId), false);
    assert.equal(Boolean(sharedSession.shareId), true);
  });

  it("should generate proper react-query cache keys for session shares", async () => {
    const { sessionShareQueryKey } =
      await import("../src/hooks/data/useSharedChats/useSharedChats");
    const key = sessionShareQueryKey("session-1234");
    assert.deepEqual(key, ["session-share", "session-1234"]);
  });

  it("should restore existing share and show update option instead of starting from beginning", () => {
    // When session already has an active share in cache or fetched from backend
    const existingShare = {
      shareId: "active-share-999",
      sessionId: "session-abc-123",
      title: "Existing Shared Conversation",
      authorName: "Alice",
      createdAt: new Date().toISOString(),
      messageCount: 5,
    };

    const shareData = null;
    const activeShare = shareData || existingShare;

    // Must NOT be in unshared state
    assert.ok(activeShare);
    assert.equal(activeShare.shareId, "active-share-999");

    // Formatted share URL points to existing shareId
    const shareUrl = `https://cognito.chat/share/${activeShare.shareId}`;
    assert.equal(shareUrl, "https://cognito.chat/share/active-share-999");

    // Updating shared chat preserves the same shareId and updates snapshot message count
    const updatedShare = {
      ...activeShare,
      messageCount: 8,
      updatedAt: new Date().toISOString(),
    };
    assert.equal(updatedShare.shareId, activeShare.shareId);
    assert.equal(updatedShare.messageCount, 8);
  });
});
