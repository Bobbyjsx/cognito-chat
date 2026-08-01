import { AuthErrorContent } from "@/components/modules/auth/AuthErrorContent";
import { Suspense } from "react";

export const runtime = "edge";

export default function AuthErrorPage() {
  return (
    <div className="bg-surface-container-low flex min-h-[100dvh] w-full items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm">
            Loading error details...
          </div>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
