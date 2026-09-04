"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UIMessage } from "ai";
import {
  ArrowRight,
  Calendar,
  Globe,
  Loader2,
  MessageSquarePlus,
  User,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ChatMessageItem } from "./ChatMessageItem";
import {
  useGetSharedChat,
  useContinueSharedChat,
} from "@/hooks/data/useSharedChats/useSharedChats";

interface PublicChatViewProps {
  shareId: string;
}

export function PublicChatView({ shareId }: PublicChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { data: sharedChat, isLoading, isError } = useGetSharedChat(shareId);
  const continueChat = useContinueSharedChat();
  const hasAutoContinuedRef = useRef(false);

  const isContinueAction = searchParams.get("action") === "continue";

  const handleContinueChat = useCallback(() => {
    if (status === "loading" || continueChat.isPending) return;

    if (status === "unauthenticated" || !session) {
      // Store callback in state/query param and redirect to auth
      const callbackPath = `/share/${shareId}?action=continue`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
      return;
    }

    // User is authenticated, proceed with importing snapshot into private session
    continueChat.mutate(shareId, {
      onSuccess: (data) => {
        toast.success("Imported conversation to your private chats");
        router.push(`/chat/${data.sessionId}`);
      },
      onError: () => {
        toast.error("Failed to continue chat. Please try again.");
      },
    });
  }, [status, session, shareId, router, continueChat]);

  // Auto-redirect owner to their original session
  useEffect(() => {
    if (sharedChat?.isOwner && sharedChat.sessionId) {
      router.replace(`/chat/${sharedChat.sessionId}`);
    }
  }, [sharedChat, router]);

  // Auto-trigger continue if user just returned from OAuth with action=continue
  useEffect(() => {
    if (
      isContinueAction &&
      status === "authenticated" &&
      sharedChat &&
      !sharedChat.isOwner &&
      !hasAutoContinuedRef.current &&
      !continueChat.isPending
    ) {
      hasAutoContinuedRef.current = true;
      handleContinueChat();
    }
  }, [
    isContinueAction,
    status,
    sharedChat,
    handleContinueChat,
    continueChat.isPending,
  ]);

  const formattedMessages: UIMessage[] = useMemo(() => {
    if (!sharedChat?.messages) return [];
    return sharedChat.messages.map((msg) => {
      const isUser = msg.role === "user";
      const parts =
        msg.parts && msg.parts.length > 0
          ? (msg.parts as any)
          : [{ type: "text", text: msg.content }];

      return {
        id: msg.id,
        role: isUser ? "user" : "assistant",
        content: msg.content,
        parts,
        createdAt: new Date(msg.createdAt),
      } as UIMessage;
    });
  }, [sharedChat]);

  let formattedDate = "";
  if (sharedChat?.createdAt) {
    try {
      formattedDate = new Date(sharedChat.createdAt).toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );
    } catch {
      formattedDate = "";
    }
  }

  if (isLoading || (sharedChat?.isOwner && sharedChat.sessionId)) {
    return (
      <div className="bg-background flex h-screen w-full flex-col items-center justify-center gap-3">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {sharedChat?.isOwner
            ? "Opening your conversation..."
            : "Loading shared conversation..."}
        </p>
      </div>
    );
  }

  if (isError || !sharedChat) {
    return (
      <div className="bg-background flex h-screen w-full flex-col items-center justify-center gap-4 px-4">
        <div className="bg-destructive/10 text-destructive rounded-full p-3">
          <Globe className="h-8 w-8" />
        </div>
        <h1 className="text-foreground text-xl font-semibold">
          Shared Conversation Not Found
        </h1>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          This shared chat link may have expired, been revoked, or the URL is
          incorrect.
        </p>
        <Button onClick={() => router.push("/chat")} variant="default">
          Go to Home
        </Button>

        {/* Modal dialog when shared chat is deleted / revoked */}
        <Dialog open={true} onOpenChange={() => router.push("/chat")}>
          <DialogContent className="sm:max-w-sm" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Conversation has been deleted.</DialogTitle>
              <DialogDescription>Start a new chat.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => router.push("/chat")}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
      {/* Public Header: Logo | Shared Conversation (on larger screens), and title to the far right */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-40 flex h-14 w-full items-center justify-between gap-2 border-b px-3.5 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <Logo />
          <div className="xs:flex border-border/60 hidden items-center border-l pl-2.5 sm:flex sm:pl-3">
            <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
              Shared Conversation
            </span>
          </div>
        </div>

        <div className="flex min-w-0 shrink items-center gap-2">
          <span className="text-muted-foreground xs:max-w-[200px] max-w-[140px] truncate text-xs font-medium sm:max-w-[320px] md:max-w-[450px]">
            {sharedChat.title || "Untitled Conversation"}
          </span>
        </div>
      </header>

      {/* Context Bar */}
      <div className="border-border/30 bg-muted/15 border-b px-3.5 py-2 sm:px-6 sm:py-2.5">
        <div className="text-muted-foreground mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {sharedChat.authorName && (
              <span className="text-foreground/90 inline-flex items-center gap-1.5 truncate font-medium">
                <User className="text-primary h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[140px] truncate sm:max-w-none">
                  Shared by {sharedChat.authorName}
                </span>
              </span>
            )}
            {sharedChat.authorName && formattedDate && (
              <span className="text-muted-foreground/40">&bull;</span>
            )}
            {formattedDate && (
              <span className="text-muted-foreground/80 inline-flex shrink-0 items-center gap-1">
                <Calendar className="text-muted-foreground/70 h-3 w-3" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="bg-muted/60 text-muted-foreground border-border/40 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
              {sharedChat.messageCount} messages
            </span>
          </div>
        </div>
      </div>

      {/* Main Conversation Messages */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 pb-24 sm:px-6">
        <div className="flex flex-col gap-6">
          {formattedMessages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} isStreaming={false} />
          ))}
        </div>
      </main>

      {/* Floating Continue in Chat button on bottom right */}
      <div className="fixed right-6 bottom-6 z-50 md:right-8 md:bottom-8">
        <Button
          type="button"
          size="default"
          onClick={handleContinueChat}
          disabled={continueChat.isPending}
          className="group shadow-primary/20 hover:shadow-primary/30 border-primary/20 h-11 gap-2.5 rounded-full border px-5 text-xs font-medium shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          {continueChat.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          <span>Continue in chat</span>
          <ArrowRight className="text-primary-foreground/70 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
