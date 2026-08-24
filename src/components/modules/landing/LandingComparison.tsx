"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Code2, Search, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionReveal, GsapTextScrub } from "./LandingMotion";

const DOMAINS = [
  {
    id: "writing",
    label: "Writing",
    icon: PenTool,
    title: "Ask one model to write it. Ask another to refine it.",
    prompt: "Draft an announcement for our Series A funding milestone.",
    firstTake: {
      model: "Claude 3.7 Sonnet",
      role: "Narrative & Tone",
      tagBg: "bg-[#FBF3DB] text-[#956400]",
      text: "Crafts a thoughtful, compelling narrative that highlights company vision, team resilience, and customer trust without sounding like generic corporate PR.",
    },
    secondTake: {
      model: "GPT-4.5",
      role: "Clarity & Impact",
      tagBg: "bg-[#EDF3EC] text-[#346538]",
      text: "Tightens the prose, punches up the headline hooks for press distribution, and adds concise bullet points for investor readability.",
    },
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    title: "Get an implementation. Ask another model to review it.",
    prompt: "Implement a rate-limiter middleware for Next.js App Router.",
    firstTake: {
      model: "GPT-4.5",
      role: "Implementation",
      tagBg: "bg-[#EDF3EC] text-[#346538]",
      text: "Generates the token-bucket algorithm with Upstash Redis and Sliding Window algorithm with TypeScript types.",
    },
    secondTake: {
      model: "Claude 3.7 Sonnet",
      role: "Security & Edge Audit",
      tagBg: "bg-[#FBF3DB] text-[#956400]",
      text: "Audits IP spoofing attack vectors, verifies distributed edge clock drift, and adds secure headers with graceful fallback.",
    },
  },
  {
    id: "research",
    label: "Research",
    icon: Search,
    title: "Generate an answer. Then challenge it with another model.",
    prompt:
      "Analyze the long-term energy density potential of solid-state batteries vs lithium-sulfur.",
    firstTake: {
      model: "Gemini 3.7 Flash",
      role: "Synthesis & Patents",
      tagBg: "bg-[#E1F3FE] text-[#1F6C9F]",
      text: "Processes recent academic pre-prints, commercial roadmap timelines, and thermal degradation data across large context.",
    },
    secondTake: {
      model: "Claude 3.7 Sonnet",
      role: "Critical Challenge",
      tagBg: "bg-[#FBF3DB] text-[#956400]",
      text: "Challenges commercialization cost assumptions, dendrite formation hurdles, and manufacturing yield barriers.",
    },
  },
  {
    id: "decisions",
    label: "Decisions",
    icon: BrainCircuit,
    title: "Get one perspective. Then get another.",
    prompt:
      "Should our startup pursue self-serve PLG or direct enterprise sales first?",
    firstTake: {
      model: "Gemini 3.7 Flash",
      role: "Growth Perspective",
      tagBg: "bg-[#E1F3FE] text-[#1F6C9F]",
      text: "Analyzes viral loops, bottom-up developer adoption metrics, and lowest CAC expansion paths.",
    },
    secondTake: {
      model: "GPT-4.5",
      role: "Enterprise Perspective",
      tagBg: "bg-[#EDF3EC] text-[#346538]",
      text: "Examines ACV math, SOC2 compliance requirements, enterprise procurement cycles, and runway sustainability.",
    },
  },
];

export function LandingComparison() {
  const [activeTab, setActiveTab] = useState(DOMAINS[0]);

  return (
    <section
      id="compare"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Second Opinions, Built In
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            When the answer matters, ask more than one.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <p className="mt-6 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            AI models don&apos;t always agree. That&apos;s a feature, not a
            problem. Cognito makes it easy to compare responses from different
            models so you can spot differences, challenge assumptions, and
            choose the answer that works best for you.
          </p>
        </MotionReveal>
      </div>

      {/* Tabs */}
      <MotionReveal
        variant="fade-up"
        delay={0.12}
        className="mb-8 flex justify-center overflow-x-auto pb-2"
      >
        <div className="flex rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] p-1 shadow-inner">
          {DOMAINS.map((tab) => {
            const isSelected = activeTab.id === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className="relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] sm:text-sm"
              >
                {isSelected && (
                  <motion.div
                    layoutId="comparison-monochrome-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-white shadow-xs"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icon
                  className={cn(
                    "size-3.5",
                    isSelected ? "text-[#111111]" : "text-[#787774]",
                  )}
                />
                <span
                  className={cn(
                    isSelected
                      ? "text-[#111111]"
                      : "text-[#787774] hover:text-[#111111]",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </MotionReveal>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-8"
        >
          <div className="space-y-1 text-center">
            <h3 className="text-xl font-bold tracking-tight text-[#111111] sm:text-2xl">
              {activeTab.title}
            </h3>
            <p className="font-mono text-xs text-[#787774]">
              Prompt: &ldquo;{activeTab.prompt}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* First Take */}
            <div className="space-y-2.5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-5">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-2">
                <span className="text-sm font-bold text-[#111111]">
                  {activeTab.firstTake.model}
                </span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-[10px]",
                    activeTab.firstTake.tagBg,
                  )}
                >
                  {activeTab.firstTake.role}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#5a5a57]">
                {activeTab.firstTake.text}
              </p>
            </div>

            {/* Second Take */}
            <div className="space-y-2.5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-5">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-2">
                <span className="text-sm font-bold text-[#111111]">
                  {activeTab.secondTake.model}
                </span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-[10px]",
                    activeTab.secondTake.tagBg,
                  )}
                >
                  {activeTab.secondTake.role}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#5a5a57]">
                {activeTab.secondTake.text}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-14 text-center">
        <GsapTextScrub
          text="Same question. Different models. Better perspective."
          className="mx-auto max-w-2xl text-xl font-bold tracking-tight text-[#111111] sm:text-2xl md:text-3xl"
        />
        <p className="mt-2 text-sm font-medium text-[#787774]">
          AI is more useful when you have options.
        </p>
      </div>
    </section>
  );
}
