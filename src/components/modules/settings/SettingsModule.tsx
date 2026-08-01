"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { getQuotaSnapshot } from "@/lib/quota";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
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

  const userEmail =
    profile?.email || session?.user?.email || "user@example.com";
  const userName = session?.user?.name || userEmail.split("@")[0];
  const q = getQuotaSnapshot(profile, nowMs, "long");

  return (
    <motion.div
      className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 md:py-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header & Back Navigation */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <Link
            href="/chat"
            className="text-gray-medium hover:bg-surface-container hover:text-on-surface mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Chat
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold tracking-tight">
            Account & Quota Settings
          </h1>
          <p className="text-body-md text-gray-medium mt-1">
            Manage your account details and view your token usage quotas.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-on-surface border-[rgba(0,0,0,0.08)] bg-white px-3 py-1 text-xs font-semibold shadow-sm"
        >
          <Sparkles className="text-primary mr-1.5 h-3.5 w-3.5" />
          Active Account
        </Badge>
      </motion.div>

      {/* Main Settings Body */}
      <motion.div variants={itemVariants} className="space-y-6">
        {/* Profile Card */}
        <Card className="border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-[rgba(0,0,0,0.08)] shadow-sm">
                <AvatarFallback className="bg-primary text-on-primary text-lg font-bold uppercase">
                  {userName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-body-lg text-on-surface font-bold">
                  {userEmail}
                </h2>
                <p className="text-gray-medium mt-0.5 text-xs">
                  Cognito Member
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border-error/20 text-error hover:bg-error/10 hover:text-error"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Card>

        {/* Real-time Usage & Quotas Card */}
        <Card className="space-y-6 border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
            <div>
              <h3 className="text-on-surface text-sm font-semibold">
                Token Quota & Usage
              </h3>
              <p className="text-gray-medium text-xs">
                Real-time usage across active API time windows.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Real-time tracking active</span>
            </div>
          </div>

          {/* 6-Hour Quota Window */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-medium flex items-center gap-1.5">
                <Zap className="text-primary h-3.5 w-3.5" /> 6-Hour Quota Window
              </span>
              <span className="text-on-surface">
                {q.used6h.toLocaleString()} / {q.limit6h.toLocaleString()} (
                {q.pct6h}%)
              </span>
            </div>
            <div className="bg-surface-container-high h-2.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  q.pct6h > 85
                    ? "bg-error"
                    : q.pct6h > 60
                      ? "bg-amber-500"
                      : "bg-primary",
                )}
                style={{ width: `${q.pct6h}%` }}
              />
            </div>
            <p className="text-gray-medium text-right text-[11px] italic">
              ⏱ Resets {q.reset6hText}
            </p>
          </div>

          {/* Weekly Quota Cap */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-medium flex items-center gap-1.5">
                <Calendar className="text-primary h-3.5 w-3.5" /> Weekly Quota
                Cap
              </span>
              <span className="text-on-surface">
                {q.usedWeekly.toLocaleString()} /{" "}
                {q.limitWeekly.toLocaleString()} ({q.pctWeekly}%)
              </span>
            </div>
            <div className="bg-surface-container-high h-2.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  q.pctWeekly > 85
                    ? "bg-error"
                    : q.pctWeekly > 60
                      ? "bg-amber-500"
                      : "bg-primary/80",
                )}
                style={{ width: `${q.pctWeekly}%` }}
              />
            </div>
            <p className="text-gray-medium text-right text-[11px] italic">
              ⏱ Resets {q.resetWeeklyText}
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
