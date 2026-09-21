import { Skeleton } from "@/components/ui/skeleton";

/**
 * Server-safe route loading skeletons (no client hooks).
 * Used by Next.js route loading files for instant navigation feedback.
 */

const Bone = Skeleton;

/** Full chat shell skeleton — sidebar + message canvas + composer. */
export function ChatShellLoading() {
  return (
    <div
      className="bg-background flex h-dvh overflow-hidden"
      aria-busy="true"
      aria-label="Loading chat"
    >
      {/* Desktop sidebar placeholder */}
      <aside className="bg-surface-container-low hidden h-dvh w-64 shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] p-4 md:flex">
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

      <main className="relative flex h-dvh min-w-0 flex-1 flex-col">
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

/** Settings layout skeleton matching SettingsModule structure. */
export function SettingsPageLoading() {
  return (
    <div
      className="bg-background flex h-dvh overflow-hidden"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <aside className="bg-surface-container-low hidden h-dvh w-64 shrink-0 border-r border-[rgba(0,0,0,0.06)] p-4 md:block">
        <Bone className="mb-6 h-8 w-28 rounded-lg" />
        <Bone className="mb-4 h-10 w-full rounded-lg" />
        <div className="space-y-2">
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-[85%] rounded-lg" />
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <div className="flex h-14 items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-4 sm:px-6">
          <Bone className="h-6 w-24 rounded" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-4 pb-28 sm:px-6 md:py-10 md:pb-12">
            {/* Header */}
            <div className="space-y-1">
              <Bone className="h-7 w-32 rounded-lg" />
              <Bone className="h-4 w-72 rounded" />
            </div>

            {/* Profile Card */}
            <div className="flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
              <div className="flex items-center gap-3.5">
                <Bone className="h-13 w-13 rounded-full" />
                <div className="space-y-2">
                  <Bone className="h-4 w-44 rounded" />
                  <Bone className="h-3 w-28 rounded" />
                </div>
              </div>
              <Bone className="h-8 w-20 rounded-lg" />
            </div>

            {/* Plan & billing Card */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:p-6">
              <div className="space-y-2">
                <Bone className="h-4 w-28 rounded" />
                <Bone className="h-3 w-64 rounded" />
              </div>
              <div className="flex gap-2">
                <Bone className="h-9 w-28 rounded-lg" />
                <Bone className="h-9 w-20 rounded-lg" />
              </div>
            </div>

            {/* Custom Instructions Card */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-xs sm:flex-row sm:items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Bone className="h-4 w-36 rounded" />
                  <Bone className="h-4 w-16 rounded-full" />
                </div>
                <Bone className="h-3 w-80 rounded" />
              </div>
              <Bone className="h-8 w-28 rounded-lg" />
            </div>

            {/* Usage Card */}
            <div className="space-y-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                <div className="space-y-1">
                  <Bone className="h-4 w-20 rounded" />
                  <Bone className="h-3 w-52 rounded" />
                </div>
                <Bone className="h-4 w-28 rounded" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Bone className="h-3 w-28 rounded" />
                  <Bone className="h-3 w-16 rounded" />
                </div>
                <Bone className="h-2.5 w-full rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Bone className="h-3 w-28 rounded" />
                  <Bone className="h-3 w-16 rounded" />
                </div>
                <Bone className="h-2.5 w-full rounded-full" />
              </div>
            </div>

            {/* Push Notifications Card */}
            <div className="space-y-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                <div className="space-y-1">
                  <Bone className="h-4 w-32 rounded" />
                  <Bone className="h-3 w-60 rounded" />
                </div>
                <Bone className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Billing layout skeleton matching BillingPage structure. */
export function BillingPageLoading() {
  return (
    <div
      className="bg-background flex h-dvh overflow-hidden"
      aria-busy="true"
      aria-label="Loading billing"
    >
      <aside className="bg-surface-container-low hidden h-dvh w-64 shrink-0 border-r border-[rgba(0,0,0,0.06)] p-4 md:block">
        <Bone className="mb-6 h-8 w-28 rounded-lg" />
        <Bone className="mb-4 h-10 w-full rounded-lg" />
        <div className="space-y-2">
          <Bone className="h-8 w-full rounded-lg" />
          <Bone className="h-8 w-full rounded-lg" />
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <div className="flex h-14 items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-4 sm:px-6">
          <Bone className="h-6 w-24 rounded" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-4 pb-28 sm:px-6 md:py-10 md:pb-12">
            {/* Header with back link */}
            <div className="space-y-2">
              <Bone className="h-4 w-28 rounded" />
              <Bone className="h-7 w-52 rounded-lg" />
              <Bone className="h-4 w-72 rounded" />
            </div>

            {/* Current Plan Card */}
            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
              <Bone className="h-3 w-20 rounded uppercase" />
              <Bone className="mt-3 h-6 w-36 rounded" />
              <Bone className="mt-2 h-4 w-60 rounded" />
              <Bone className="mt-1 h-3.5 w-44 rounded" />
            </div>

            {/* Mobile Compare Plans toggle skeleton */}
            <div className="flex items-center justify-between md:hidden">
              <Bone className="h-4 w-24 rounded" />
              <Bone className="h-7 w-28 rounded-lg" />
            </div>

            {/* Paid Plans Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Plan Card 1 */}
              <div className="flex flex-col rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Bone className="h-4 w-12 rounded uppercase" />
                </div>
                <div className="flex items-end gap-1.5">
                  <Bone className="h-8 w-24 rounded" />
                  <Bone className="mb-1 h-4 w-14 rounded" />
                </div>
                <Bone className="mt-2 h-3.5 w-full rounded" />
                <div className="mt-6 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-44 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-36 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-52 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-40 rounded" />
                  </div>
                </div>
                <Bone className="mt-6 h-10 w-full rounded-xl" />
              </div>

              {/* Plan Card 2 */}
              <div className="flex flex-col rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <Bone className="h-4 w-16 rounded uppercase" />
                </div>
                <div className="flex items-end gap-1.5">
                  <Bone className="h-8 w-24 rounded" />
                  <Bone className="mb-1 h-4 w-14 rounded" />
                </div>
                <Bone className="mt-2 h-3.5 w-full rounded" />
                <div className="mt-6 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-48 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-40 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-44 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bone className="h-3.5 w-3.5 rounded-full" />
                    <Bone className="h-3.5 w-36 rounded" />
                  </div>
                </div>
                <Bone className="mt-6 h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
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
