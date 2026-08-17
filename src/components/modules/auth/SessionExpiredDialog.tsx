"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { initiateOAuth } from "@/lib/actions/oauth";

interface SessionExpiredDialogProps {
  isOpen?: boolean;
}

export function SessionExpiredDialog({
  isOpen: explicitOpen,
}: SessionExpiredDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const isSessionError =
    (session as unknown as { error?: string })?.error ===
    "RefreshAccessTokenError";
  const open = Boolean(explicitOpen || isSessionError);

  const handleReauthenticate = async () => {
    setIsLoading(true);
    try {
      await initiateOAuth();
    } catch (err) {
      // If initiateOAuth redirects, it will throw NEXT_REDIRECT. If it fails, we catch.
      console.error(err);
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-3 text-center sm:text-left">
          <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-sm">
            Your authentication session has expired or could not be refreshed
            automatically. Please sign in again to continue using Cognito Chat.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            onClick={handleReauthenticate}
            className="w-full sm:w-auto"
            variant="default"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Redirecting..." : "Sign In Again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
