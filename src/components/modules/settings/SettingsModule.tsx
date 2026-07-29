"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { getQuotaSnapshot } from "@/lib/quota";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Zap,
  Calendar,
  LogOut,
  UserCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

export function SettingsModule() {
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const userEmail = profile?.email || session?.user?.email || "developer@example.com";
  const userName = session?.user?.name || userEmail.split("@")[0];
  const q = getQuotaSnapshot(profile, nowMs, "long");

  return (
    <motion.div
      className="mx-auto w-full max-w-[800px] px-4 py-8 md:px-8 md:py-12"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="mb-8">
        <h1 className="text-headline-lg font-semibold tracking-tight-editorial text-on-surface">
          Account & Plan
        </h1>
        <p className="mt-1.5 text-body-md text-gray-medium">
          Manage your account profile, authentication details, and token usage limits.
        </p>
      </motion.header>

      {/* Account & Plan Content */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
          <h2 className="text-headline-md font-semibold text-on-surface">
            Profile Overview
          </h2>
          <Badge variant="outline" className="border-[rgba(0,0,0,0.08)] bg-white text-on-surface uppercase">
            Free Tier
          </Badge>
        </div>

        <Card className="p-6 md:p-8">
          {/* User Info Header */}
          <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[rgba(0,0,0,0.06)] pb-8 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border border-[rgba(0,0,0,0.06)]">
                <AvatarFallback className="bg-surface-container text-headline-md font-semibold text-on-surface uppercase">
                  {userName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-body-lg text-body-lg font-medium text-on-surface">
                  {userEmail}
                </h3>
                <p className="mt-0.5 text-body-md text-gray-medium">
                  Cognito Member
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("Profile details synced with account authentication")}
                  className="mt-2 inline-flex items-center gap-1.5 text-body-md font-medium text-gray-medium hover:text-on-surface transition-colors underline underline-offset-4"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Account Verified
                </button>
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-error hover:bg-error/5 hover:text-error md:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quota Usage Box */}
          <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-surface-container-low p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                Current Usage & Quotas
              </h4>
              <span className="font-code-sm text-code-sm text-gray-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Real-time tracking
              </span>
            </div>

            <div className="space-y-6">
              {/* 6-Hour Window */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-label-md font-medium">
                  <span className="flex items-center gap-1.5 text-gray-medium">
                    <Zap className="h-3.5 w-3.5 text-on-surface/70" /> 6-Hour Quota Window
                  </span>
                  <span className="font-semibold text-on-surface">
                    {q.used6h.toLocaleString()} / {q.limit6h.toLocaleString()} ({q.pct6h}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-on-surface transition-all duration-500"
                    style={{ width: `${q.pct6h}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-medium text-gray-medium italic">
                  ⏱ 6-Hour limit {q.reset6hText}
                </div>
              </div>

              {/* Weekly Window */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-label-md font-medium">
                  <span className="flex items-center gap-1.5 text-gray-medium">
                    <Calendar className="h-3.5 w-3.5 text-on-surface/70" /> Weekly Quota Cap
                  </span>
                  <span className="font-semibold text-on-surface">
                    {q.usedWeekly.toLocaleString()} / {q.limitWeekly.toLocaleString()} ({q.pctWeekly}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-on-surface/80 transition-all duration-500"
                    style={{ width: `${q.pctWeekly}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-medium text-gray-medium italic">
                  ⏱ Weekly limit {q.resetWeeklyText}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <Button
                type="button"
                onClick={() => toast.info("Pro plan upgrades available soon")}
                className="flex-1"
              >
                Upgrade to Pro
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.info("Free plan includes 60k tokens / 6h and 300k weekly")}
                className="flex-1"
              >
                View Usage Limits
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
