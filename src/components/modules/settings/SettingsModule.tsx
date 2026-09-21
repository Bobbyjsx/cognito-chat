"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";
import { SettingsPageLoading } from "@/components/loading/page-skeletons";
import { PaywallDialog } from "@/components/modules/billing/PaywallDialog";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { Navbar } from "@/components/modules/chat/Navbar";
import { BottomNav } from "@/components/modules/settings/BottomNav";
import { CustomInstructionsCard } from "@/components/modules/settings/CustomInstructionsCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { normalizeTier, PLANS, type PlanTier } from "@/lib/plans";
import { getQuotaSnapshot } from "@/lib/quota";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

export function SettingsModule() {
  const { data: session } = useSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const {
    isSupported,
    permission,
    isGranted,
    requestPermission,
    sendTestNotification,
  } = useNotifications();

  const handleRequestPermission = async () => {
    setIsRequestingPerm(true);
    try {
      await requestPermission();
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (isProfileLoading && !profile) {
    return <SettingsPageLoading />;
  }

  const userEmail = profile?.email || session?.user?.email || "user@gmail.com";
  const userName = session?.user?.name || userEmail.split("@")[0];
  const q = getQuotaSnapshot(profile, nowMs, "long");
  const planTier: PlanTier = normalizeTier(profile?.tier);
  const plan = PLANS[planTier];

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        {/* Mobile top header with logo and menu */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Main scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28 sm:px-6 md:py-10 md:pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Top context header */}
            <motion.div variants={itemVariants} className="mb-6">
              <div className="flex items-center justify-end md:justify-between">
                <Link
                  href="/chat"
                  className="text-gray-medium hover:text-on-surface hover:bg-surface-container -ml-2 hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors md:inline-flex"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Chat</span>
                </Link>
                <Badge
                  variant="outline"
                  className="border-[rgba(0,0,0,0.08)] bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs"
                >
                  {plan.name} Plan
                </Badge>
              </div>

              <div className="mt-3">
                <h1 className="text-headline-lg text-on-surface font-bold tracking-tight">
                  Settings
                </h1>
                <p className="text-gray-medium mt-1 text-sm">
                  Manage your account identity, plan allowances, and
                  preferences.
                </p>
              </div>
            </motion.div>

            {/* Main Content Flow */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Profile Card */}
              <Card className="border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="h-13 w-13 border border-[rgba(0,0,0,0.08)] shadow-2xs">
                      <AvatarFallback className="bg-[#2f3437] text-base font-bold text-white uppercase">
                        {userName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="text-on-surface truncate text-base font-semibold">
                        {userName}
                      </h2>
                      <p className="text-gray-medium truncate text-xs">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignOutDialogOpen(true)}
                    className="border-error/25 text-error hover:bg-error/5 hover:text-error self-end text-xs sm:self-auto"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                </div>
              </Card>

              {/* Plan & Billing Section */}
              <Card className="border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-on-surface text-sm font-semibold">
                        Plan & Billing
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-neutral-100 text-[10px] font-semibold tracking-wide text-neutral-700 uppercase"
                      >
                        {plan.name}
                      </Badge>
                    </div>
                    <p className="text-gray-medium text-xs leading-relaxed">
                      {planTier === "free"
                        ? "You are currently on the starter allowance. Upgrade to Go or Premium for higher usage limits."
                        : planTier === "go"
                          ? "You are on Go. Upgrade to Premium for 1.5× higher rolling limits and custom instructions."
                          : "You are on Premium — maximum capacity, priority demand, and custom instructions."}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end pt-1 sm:self-auto sm:pt-0">
                    <Link
                      href="/settings/billing"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 text-xs font-medium",
                      )}
                    >
                      Manage Billing
                    </Link>
                    {planTier !== "premium" && (
                      <Button
                        size="sm"
                        onClick={() => setPaywallOpen(true)}
                        className="h-8 text-xs font-medium"
                      >
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Real-time Usage & Quotas */}
              <Card
                id="usage-section"
                className="scroll-mt-6 border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6"
              >
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                  <div>
                    <h3 className="text-on-surface text-sm font-semibold">
                      Usage Quotas
                    </h3>
                    <p className="text-gray-medium text-xs">
                      Rolling window tracking across all models.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Real-time</span>
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  {/* 6-Hour Quota Window */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-on-surface flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-neutral-700" />
                        6-Hour Window
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {q.pct6h}% used
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          q.pct6h > 85
                            ? "bg-red-500"
                            : q.pct6h > 60
                              ? "bg-amber-500"
                              : "bg-[#2f3437]",
                        )}
                        style={{ width: `${Math.min(q.pct6h, 100)}%` }}
                      />
                    </div>
                    <p className="text-gray-medium text-right text-[11px]">
                      {q.reset6hText.toLowerCase().startsWith("resets")
                        ? q.reset6hText
                        : `Resets in ${q.reset6hText}`}
                    </p>
                  </div>

                  {/* Weekly Quota Cap */}
                  <div className="space-y-2 border-t border-[rgba(0,0,0,0.04)] pt-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-on-surface flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-neutral-700" />
                        Weekly Window
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {q.pctWeekly}% used
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          q.pctWeekly > 85
                            ? "bg-red-500"
                            : q.pctWeekly > 60
                              ? "bg-amber-500"
                              : "bg-[#2f3437]",
                        )}
                        style={{ width: `${Math.min(q.pctWeekly, 100)}%` }}
                      />
                    </div>
                    <p className="text-gray-medium text-right text-[11px]">
                      {q.resetWeeklyText.toLowerCase().startsWith("resets")
                        ? q.resetWeeklyText
                        : `Resets in ${q.resetWeeklyText}`}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Custom Instructions */}
              <div id="instructions-section" className="scroll-mt-6">
                <CustomInstructionsCard
                  onUpgradeClick={() => setPaywallOpen(true)}
                />
              </div>

              {/* Push & In-App Notifications (if device supports) */}
              {isSupported && (
                <Card
                  id="notifications-section"
                  className="scroll-mt-6 border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                    <div>
                      <h3 className="text-on-surface text-sm font-semibold">
                        Push Notifications
                      </h3>
                      <p className="text-gray-medium text-xs">
                        Alerts when generations finish in background tabs.
                      </p>
                    </div>
                    <div>
                      {isGranted ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                          Enabled
                        </Badge>
                      ) : permission === "denied" ? (
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50 text-[11px] font-semibold text-red-700"
                        >
                          Blocked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-[rgba(0,0,0,0.08)] bg-neutral-50 text-[11px] font-semibold text-neutral-600"
                        >
                          Not enabled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 text-xs">
                    <div className="flex flex-col gap-3 rounded-xl border border-[rgba(0,0,0,0.04)] bg-neutral-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <p className="text-on-surface flex items-center gap-1.5 font-medium">
                          <BellRing className="h-3.5 w-3.5 text-neutral-700" />
                          Background Completion Alerts
                        </p>
                        <p className="text-gray-medium text-[11px] leading-relaxed">
                          Receive system notifications when models finish large
                          responses.
                        </p>
                      </div>

                      {!isGranted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRequestPermission}
                          disabled={isRequestingPerm || permission === "denied"}
                          className="h-8 shrink-0 self-end text-xs font-medium sm:self-auto"
                        >
                          {isRequestingPerm ? (
                            <Spinner className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Bell className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Enable Push
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-medium text-[11px]">
                        Send a quick test push to confirm device delivery.
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendTestNotification()}
                        className="text-gray-medium hover:text-on-surface h-7 self-end px-2 text-xs font-medium sm:self-auto"
                      >
                        Send Test Notification
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <BottomNav />
      </main>

      {/* Paywall Modal */}
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="upgrade"
        highlightPlan={planTier === "go" ? "premium" : "go"}
      />

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Sign Out</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to sign out of your Cognito account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignOutDialogOpen(false)}
              disabled={isSigningOut}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs"
            >
              {isSigningOut ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  Signing out...
                </>
              ) : (
                "Sign Out"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
