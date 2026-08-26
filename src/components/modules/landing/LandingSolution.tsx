"use client";

import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
  FolderGit2,
  Sparkles,
  Sliders,
} from "lucide-react";
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

export function LandingSolution() {
  return (
    <section
      id="solution"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <Sparkles className="size-3.5 text-[#111111]" />
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Meet Cognito
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            The AI workspace built around you, not a single model.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <div className="mt-6 space-y-4 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            <p>
              Cognito gives you access to{" "}
              <strong className="font-semibold text-[#111111]">
                multiple leading AI models from one place.
              </strong>
            </p>
            <p>
              Instead of deciding which AI subscription to pay for, you get the
              freedom to use the right model for the job.
            </p>
            <p>
              Start a conversation with one model. Switch to another when you
              need a different perspective. Compare responses when the answer
              matters. Your conversations, files, and history stay in one place.
            </p>
          </div>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.24} className="mt-8">
          <Link
            href="/login"
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-6 py-3 text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98]"
          >
            <span>Explore Cognito</span>
            <ArrowRight className="size-4" />
          </Link>
        </MotionReveal>
      </div>

      {/* 3 Pillars with Dense Flow & Stagger */}
      <StaggerContainer className="grid grid-flow-dense grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                  <Sliders className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  Freedom to choose
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Use Claude for nuanced writing, Gemini for massive 2M
                  documents, and ChatGPT for intricate code pipelines—all inside
                  one subscription.
                </p>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>

        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                  <RefreshCw className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  Mid-Thread Switching
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Change models in the middle of an existing conversation
                  without losing attachments, context, or previous prompt turns.
                </p>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>

        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                  <FolderGit2 className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111]">
                  Unified Knowledge
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  One searchable history across every model and one central file
                  library so your documents travel with you wherever you go.
                </p>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
