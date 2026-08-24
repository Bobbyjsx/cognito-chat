"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionReveal, TextScrubReveal } from "./LandingMotion";

const TURNS = [
  {
    step: 1,
    speaker: "You",
    content:
      "What is the best way to handle global cache invalidation for a high-frequency trading dashboard?",
    isUser: true,
  },
  {
    step: 2,
    speaker: "Claude 3.7 Sonnet",
    modelId: "claude",
    badge: "Architectural Strategy",
    badgeBg: "bg-[#FBF3DB] text-[#956400]",
    content:
      "Implement a hybrid L1/L2 cache: In-process ring buffers (L1) with microsecond reads, synced via a Redis Pub/Sub backplane (L2) with versioned epoch tags. Avoid broad wildcard invalidations.",
    isUser: false,
  },
  {
    step: 3,
    speaker: "You (Switched Model)",
    content:
      "Switch to Gemini 3.7 Flash: Challenge this architecture against high network partition scenarios.",
    isUser: true,
  },
  {
    step: 4,
    speaker: "Gemini 3.7 Flash",
    modelId: "gemini",
    badge: "Edge Case & Stress Analysis",
    badgeBg: "bg-[#E1F3FE] text-[#1F6C9F]",
    content:
      "If Redis partitions, local L1 caches risk serving stale price quotes. I recommend adding a heartbeat monotonic clock to each L1 node. If no heartbeat arrives within 50ms, auto-degrade L1 into passthrough mode.",
    isUser: false,
  },
];

export function LandingModelSwitching() {
  return (
    <section
      id="switching"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <ArrowLeftRight className="size-3.5 text-[#111111]" />
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              One Conversation. Multiple Minds.
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            Start anywhere. Switch whenever.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <div className="mt-6 space-y-4 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            <p>
              You don&apos;t always know which model will give you the best
              answer. And you shouldn&apos;t have to start a new conversation to
              find out.
            </p>
            <p>
              With Cognito, you can{" "}
              <strong className="font-semibold text-[#111111]">
                switch models right in the middle of a conversation.
              </strong>
            </p>
            <p>
              Ask one model to solve the problem. Switch to another to challenge
              the answer. Try another perspective. Keep the entire conversation
              intact.
            </p>
          </div>
        </MotionReveal>
      </div>

      {/* Interactive Mid-Conversation Thread Showcase */}
      <MotionReveal variant="scale-up" delay={0.15}>
        <div className="mx-auto max-w-4xl space-y-5 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] sm:p-8">
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-[#111111]" />
              <span className="text-sm font-semibold text-[#111111]">
                Multi-Model Active Thread
              </span>
            </div>
            <span className="rounded-md bg-[#EDF3EC] px-2.5 py-0.5 font-mono text-xs font-medium text-[#346538]">
              Context Preserved
            </span>
          </div>

          <div className="space-y-3.5">
            {TURNS.map((turn, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl p-4",
                  turn.isUser
                    ? "ml-auto max-w-xl border border-[rgba(0,0,0,0.04)] bg-[#F7F6F3] text-right"
                    : "mr-auto max-w-2xl border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] text-left",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-semibold",
                    turn.isUser
                      ? "justify-end text-[#5a5a57]"
                      : "text-[#111111]",
                  )}
                >
                  <span>{turn.speaker}</span>
                  {turn.badge && (
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 font-mono text-[10px]",
                        turn.badgeBg,
                      )}
                    >
                      {turn.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed font-normal text-[#111111]">
                  {turn.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </MotionReveal>

      {/* Large Callout Quote with Scrubbing Reveal */}
      <div className="mt-12 text-center">
        <blockquote className="mx-auto max-w-3xl text-xl font-bold tracking-tight text-[#111111] sm:text-2xl md:text-3xl">
          <TextScrubReveal text="Same question. Different models. Better perspective." />
        </blockquote>
      </div>
    </section>
  );
}
