"use client";

import { useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  Globe,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import {
  useCreateSharedChat,
  useRevokeSharedChat,
  useGetSessionShare,
  sessionShareQueryKey,
} from "@/hooks/data/useSharedChats/useSharedChats";
import type { CreateSharedChatResponse } from "@/types";

function subscribeNoop() {
  return () => {};
}

function getCanNativeShare() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

interface ShareChatModalProps {
  sessionId: string | null;
  sessionTitle?: string | null;
  /** From the session row; when undefined/null the existing-share lookup is skipped. */
  shareId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareChatModal({
  sessionId,
  sessionTitle,
  shareId,
  open,
  onOpenChange,
}: ShareChatModalProps) {
  const queryClient = useQueryClient();
  const [shareData, setShareData] = useState<CreateSharedChatResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [showNameOverride, setShowNameOverride] = useState<boolean | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const createShare = useCreateSharedChat();
  const revokeShare = useRevokeSharedChat();
  const canNativeShare = useSyncExternalStore(
    subscribeNoop,
    getCanNativeShare,
    () => false,
  );

  // Only hit the share endpoint when the session already has a shareId —
  // unshared conversations skip the request entirely.
  const { data: existingShare, isLoading: isLoadingExisting } =
    useGetSessionShare(sessionId, open && Boolean(shareId));

  const activeShare = shareData || existingShare || null;

  const authorName =
    profile?.fullName || session?.user?.name || profile?.email || "You";

  const showName =
    showNameOverride ??
    (activeShare ? activeShare.authorName !== "Anonymous" : true);

  const setShowName = (value: boolean) => setShowNameOverride(value);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShareData(null);
      setCopied(false);
      setShowNameOverride(null);
      setIsDeleteDialogOpen(false);
    }
    onOpenChange(newOpen);
  };

  const triggerNativeShare = async (url: string, title?: string | null) => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      return;
    }
    try {
      const sharePayload = {
        title: title || "Shared Conversation",
        url,
      };
      if (typeof navigator.canShare === "function") {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
        }
      } else {
        await navigator.share(sharePayload);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.debug("Web Share API error or dismiss:", err);
    }
  };

  const handleCreateShare = () => {
    if (!sessionId || createShare.isPending) return;

    createShare.mutate(
      { sessionId, title: sessionTitle, showName },
      {
        onSuccess: (data) => {
          setShareData(data);
          const generatedUrl = `${window.location.origin}/share/${data.shareId}`;
          triggerNativeShare(generatedUrl, sessionTitle);
        },
        onError: () => {
          toast.error("Failed to generate share link");
        },
      },
    );
  };

  const handleUpdateShare = () => {
    if (!sessionId || createShare.isPending) return;

    createShare.mutate(
      { sessionId, title: sessionTitle, showName },
      {
        onSuccess: (data) => {
          setShareData(data);
          toast.success("Shared chat updated");
        },
        onError: () => {
          toast.error("Failed to update shared chat");
        },
      },
    );
  };

  const handleToggleShowName = (checked: boolean) => {
    setShowName(checked);
    if (sessionId && activeShare && !createShare.isPending) {
      createShare.mutate(
        { sessionId, title: sessionTitle, showName: checked },
        {
          onSuccess: (data) => {
            setShareData(data);
            toast.success("Share preference updated");
          },
          onError: () => {
            toast.error("Failed to update share preferences");
          },
        },
      );
    }
  };

  const handleDeleteShare = () => {
    if (!activeShare?.shareId || revokeShare.isPending) return;
    revokeShare.mutate(activeShare.shareId, {
      onSuccess: () => {
        setShareData(null);
        if (sessionId) {
          queryClient.setQueryData(sessionShareQueryKey(sessionId), null);
        }
        setIsDeleteDialogOpen(false);
        toast.success("Shared link deleted");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to delete shared link");
      },
    });
  };

  const shareUrl =
    typeof window !== "undefined" && activeShare?.shareId
      ? `${window.location.origin}/share/${activeShare.shareId}`
      : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link to clipboard");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-border/70 bg-background/95 flex max-h-[min(90vh,600px)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop-blur-xl sm:max-w-[440px]">
          {/* Header */}
          <div className="border-border/40 relative shrink-0 border-b px-5 pt-5 pr-12 pb-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary border-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-xs">
                <Share2 className="h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-col text-left">
                <DialogTitle className="text-foreground truncate text-sm font-semibold tracking-tight sm:text-base">
                  Share conversation
                </DialogTitle>
                <DialogDescription className="text-muted-foreground truncate text-xs leading-relaxed">
                  Create a public link to this point in the chat
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 space-y-3.5 overflow-x-hidden overflow-y-auto px-5 py-4 sm:px-6">
            {/* Identity / Author visibility card */}
            <div
              onClick={() => handleToggleShowName(!showName)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggleShowName(!showName);
                }
              }}
              className={cn(
                "group flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200 select-none",
                showName
                  ? "border-primary/25 bg-primary/5 hover:bg-primary/[0.08]"
                  : "border-border/60 bg-muted/25 hover:bg-muted/40",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    showName
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground border-border/70",
                  )}
                >
                  <User className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="text-foreground truncate text-xs font-semibold">
                    {showName ? "Share my name" : "Anonymous share"}
                  </span>
                  <span className="text-muted-foreground truncate text-[11px]">
                    {showName
                      ? `Shared by ${authorName}`
                      : "Your name is hidden"}
                  </span>
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Switch
                  checked={showName}
                  onCheckedChange={handleToggleShowName}
                  disabled={createShare.isPending}
                />
              </div>
            </div>

            {/* Fluid transition between Loading, Unshared, and Shared */}
            <AnimatePresence mode="wait" initial={false}>
              {isLoadingExisting && !activeShare ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-muted-foreground flex items-center justify-center py-6"
                >
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                </motion.div>
              ) : !activeShare ? (
                <motion.div
                  key="unshared"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 space-y-3"
                >
                  <p className="text-muted-foreground px-0.5 text-[11px] leading-normal">
                    Anyone with this link can view this conversation snapshot.
                    Future messages in this thread remain private.
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateShare}
                    disabled={createShare.isPending || !sessionId}
                    className="h-10 w-full gap-2 rounded-xl text-xs font-medium shadow-xs transition-transform active:scale-[0.98]"
                  >
                    {createShare.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating link...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        <span>Share chat</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="shared"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 space-y-3"
                >
                  {/* Elevated Link Box (no focus ring on copy/click, contained) */}
                  <div className="border-border/70 bg-muted/30 flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border p-1.5 pl-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                      <Globe className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <input
                        readOnly
                        value={shareUrl}
                        className="text-foreground w-full min-w-0 flex-1 truncate border-none bg-transparent font-mono text-xs ring-0 outline-none select-all focus:ring-0 focus:outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-medium focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="text-muted-foreground h-3.5 w-3.5" />
                          <span>Copy link</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Action Buttons: Update snapshot & Share via */}
                  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateShare}
                      disabled={createShare.isPending || !sessionId}
                      className="hover:bg-muted/80 h-10 min-w-0 flex-1 gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          createShare.isPending && "animate-spin",
                        )}
                      />
                      <span className="truncate">
                        {createShare.isPending
                          ? "Updating snapshot..."
                          : "Update shared chat"}
                      </span>
                    </Button>

                    {canNativeShare && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          triggerNativeShare(shareUrl, sessionTitle)
                        }
                        className="h-10 shrink-0 gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium"
                      >
                        <Share2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Share...</span>
                      </Button>
                    )}
                  </div>

                  {/* Sub-status and Delete Link */}
                  <div className="border-border/40 flex min-w-0 items-center justify-between gap-2 border-t pt-2">
                    <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 truncate text-[11px]">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="truncate">
                        Snapshot &bull; {activeShare.messageCount ?? 0} msgs
                      </span>
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={revokeShare.isPending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 shrink-0 gap-1 rounded-lg px-2 text-xs transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Delete link</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete shared link confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete shared link?</DialogTitle>
            <DialogDescription>
              Anyone using this link will no longer be able to view this shared
              conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={revokeShare.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteShare}
              disabled={revokeShare.isPending}
              className="gap-1.5"
            >
              {revokeShare.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
