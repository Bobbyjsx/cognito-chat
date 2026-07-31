import { AuthErrorContent } from "@/components/modules/auth/AuthErrorContent";
import { Suspense } from "react";

export const runtime = "edge";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-surface-container-low px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading error details...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
