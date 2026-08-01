/**
 * Server-safe route loading skeletons (no client hooks).
 * Used by Next.js route loading files for instant navigation feedback.
 */

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[rgba(0,0,0,0.06)] ${className ?? ""}`}
      aria-hidden
    />
  );
}

/** Full chat shell skeleton — sidebar + message canvas + composer. */
export function ChatShellLoading() {
  return (
    <div
      className="bg-background flex h-screen overflow-hidden"
      aria-busy="true"
      aria-label="Loading chat"
    >
      {/* Desktop sidebar placeholder */}
      <aside className="bg-surface-container-low hidden h-screen w-64 shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] p-4 md:flex">
        <Bone className="mb-6 h-8 w-28" />
        <Bone className="mb-6 h-10 w-full rounded-lg" />
        <div className="space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-[85%] rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
        </div>
      </aside>

      <main className="relative flex h-screen min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-3 md:hidden">
          <Bone className="h-8 w-8 rounded-lg" />
          <Bone className="h-6 w-24" />
          <Bone className="h-8 w-8 rounded-lg" />
        </div>

        <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col gap-8 px-4 pt-6 pb-8">
          <div className="flex flex-col items-end gap-2">
            <Bone className="h-16 w-[70%] rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="h-6 w-6 rounded" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-[92%]" />
            <Bone className="h-3.5 w-[78%]" />
            <Bone className="h-3.5 w-[48%]" />
          </div>
        </div>

        <div className="border-t border-[rgba(0,0,0,0.06)] px-3 py-3 sm:px-4 md:p-6">
          <div className="mx-auto max-w-[800px]">
            <Bone className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Centered auth card skeleton. */
export function AuthPageLoading() {
  return (
    <div
      className="bg-surface-container-low flex min-h-[100dvh] w-full items-center justify-center px-4 py-12"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Bone className="h-10 w-10 rounded-xl" />
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Settings layout skeleton. */
export function SettingsPageLoading() {
  return (
    <div
      className="bg-background flex h-screen overflow-hidden"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <aside className="bg-surface-container-low hidden h-screen w-64 shrink-0 border-r border-[rgba(0,0,0,0.06)] p-4 md:block">
        <Bone className="mb-6 h-8 w-28" />
        <Bone className="mb-4 h-10 w-full rounded-lg" />
        <div className="space-y-2">
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[800px] space-y-6">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-72" />
          <Bone className="h-48 w-full rounded-xl" />
          <Bone className="h-32 w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}

/** Generic full-page pulse (root fallback). */
export function RootLoading() {
  return (
    <div
      className="bg-background flex min-h-[100dvh] items-center justify-center"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <Bone className="h-10 w-10 rounded-xl" />
        <Bone className="h-3 w-24" />
      </div>
    </div>
  );
}
