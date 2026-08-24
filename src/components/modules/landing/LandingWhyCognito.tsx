"use client";

import { Check, X } from "lucide-react";
import { MotionReveal } from "./LandingMotion";

const COMPARISONS = [
  {
    feature: "Subscriptions",
    traditional: "Multiple monthly bills ($60+/mo)",
    cognito: "One unified subscription ($20/mo)",
  },
  {
    feature: "Apps & Tabs",
    traditional: "Juggling 3+ open browser tabs",
    cognito: "One streamlined workspace",
  },
  {
    feature: "Conversation History",
    traditional: "Separate histories across websites",
    cognito: "Unified searchable timeline",
  },
  {
    feature: "File Libraries",
    traditional: "Re-uploading files into each app",
    cognito: "Centralized file workspace",
  },
  {
    feature: "Model Selection",
    traditional: "Locked into one model per account",
    cognito: "Choose from multiple leading models",
  },
  {
    feature: "Compare Outputs",
    traditional: "Copy-pasting between websites",
    cognito: "Compare seamlessly in one place",
  },
  {
    feature: "Context Continuity",
    traditional: "Re-explaining context from scratch",
    cognito: "Keep the conversation flowing",
  },
];

export function LandingWhyCognito() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="blur-fade">
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            One place changes how you use AI.
          </h2>
        </MotionReveal>
      </div>

      {/* Comparison Table */}
      <MotionReveal variant="scale-up" delay={0.1}>
        <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-12 border-b border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] p-4 text-xs font-bold tracking-wider uppercase sm:p-5">
            <div className="col-span-4 text-[#787774]">Capability</div>
            <div className="col-span-4 text-[#787774]">Traditional AI</div>
            <div className="col-span-4 text-[#111111]">Cognito</div>
          </div>

          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            {COMPARISONS.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center p-4 text-xs transition-colors hover:bg-[#FBFBFA] sm:p-5 sm:text-sm"
              >
                <div className="col-span-4 font-semibold text-[#111111]">
                  {item.feature}
                </div>
                <div className="col-span-4 flex items-center gap-2 text-[#787774]">
                  <X className="hidden size-3.5 shrink-0 text-[#eb5757] sm:inline" />
                  <span>{item.traditional}</span>
                </div>
                <div className="col-span-4 flex items-center gap-2 font-medium text-[#111111]">
                  <Check className="hidden size-3.5 shrink-0 text-[#346538] sm:inline" />
                  <span>{item.cognito}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MotionReveal>

      {/* Closing Statement */}
      <MotionReveal
        variant="fade-up"
        delay={0.2}
        className="mt-12 space-y-1.5 text-center"
      >
        <p className="text-base text-[#787774] sm:text-lg">
          Cognito isn&apos;t another AI model.
        </p>
        <p className="text-xl font-bold tracking-tight text-[#111111] sm:text-2xl">
          It&apos;s the place where your AI models come together.
        </p>
      </MotionReveal>
    </section>
  );
}
