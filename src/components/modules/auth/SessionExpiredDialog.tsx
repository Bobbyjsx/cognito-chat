"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface SessionExpiredDialogProps {
  isOpen?: boolean;
}

export function SessionExpiredDialog({ isOpen: explicitOpen }: SessionExpiredDialogProps) {
  const { data: session } = useSession();

  const isSessionError = (session as unknown as { error?: string })?.error === "RefreshAccessTokenError";
  const open = Boolean(explicitOpen || isSessionError);

  const handleReauthenticate = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-3 text-center sm:text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Your authentication session has expired or could not be refreshed automatically. Please sign in again to continue using Cognito Chat.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            onClick={handleReauthenticate}
            className="w-full sm:w-auto"
            variant="default"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign In Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
