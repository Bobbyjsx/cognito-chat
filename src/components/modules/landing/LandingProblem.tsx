"use client";

import { XCircle, AlertTriangle } from "lucide-react";
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

export function LandingProblem() {
  return (
    <section
      id="problem"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <AlertTriangle className="size-3.5 text-[#787774]" />
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              AI Shouldn&apos;t Be This Expensive
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            You shouldn&apos;t need three subscriptions to get the best AI.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <div className="mt-6 space-y-4 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            <p>
              You&apos;ve probably already noticed that{" "}
              <strong className="font-semibold text-[#111111]">
                no single AI model is the best at everything.
              </strong>
            </p>
            <p>
              You might prefer Gemini for one task, Claude for another, and
              ChatGPT for something else entirely. So you subscribe to all
              three.
            </p>
            <p>
              Now you&apos;re paying multiple monthly subscriptions, switching
              between different websites, managing separate accounts, and
              watching your conversations become scattered across different
              platforms.
            </p>
          </div>
        </MotionReveal>
      </div>

      {/* 3 Fragmented Apps Visual Grid with Gapless dense flow */}
      <StaggerContainer className="mb-10 grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-3">
        {/* Fragmented Gemini Card */}
        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E1F3FE] text-sm font-bold text-[#1F6C9F]">
                    G
                  </div>
                  <span className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-2.5 py-0.5 font-mono text-xs font-medium text-[#787774]">
                    $20 / mo
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#111111]">
                  Gemini 3.7 Flash
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Great for real-time synthesis and hybrid reasoning, but locked
                  into its own isolated chat history.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[rgba(0,0,0,0.06)] pt-4 text-xs text-[#787774]">
                <XCircle className="size-3.5 shrink-0 text-[#eb5757]" />
                <span>Separate account & billing</span>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>

        {/* Fragmented Claude Card */}
        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF3DB] text-sm font-bold text-[#956400]">
                    C
                  </div>
                  <span className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-2.5 py-0.5 font-mono text-xs font-medium text-[#787774]">
                    $20 / mo
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#111111]">
                  Claude 3.7 Sonnet
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Exceptional hybrid thinking and coding, but none of your
                  previous Gemini attachments travel with it.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[rgba(0,0,0,0.06)] pt-4 text-xs text-[#787774]">
                <XCircle className="size-3.5 shrink-0 text-[#eb5757]" />
                <span>Isolated files & prompts</span>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>

        {/* Fragmented ChatGPT Card */}
        <StaggerItem>
          <HoverLift className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDF3EC] text-sm font-bold text-[#346538]">
                    O
                  </div>
                  <span className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-2.5 py-0.5 font-mono text-xs font-medium text-[#787774]">
                    $20 / mo
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#111111]">
                  ChatGPT (GPT-4.5 / o3)
                </h3>
                <p className="text-sm leading-relaxed text-[#787774]">
                  Superb logic and reasoning, but switching models means
                  manually copy-pasting your thread.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-[rgba(0,0,0,0.06)] pt-4 text-xs text-[#787774]">
                <XCircle className="size-3.5 shrink-0 text-[#eb5757]" />
                <span>Context lost on tab switch</span>
              </div>
            </div>
          </HoverLift>
        </StaggerItem>
      </StaggerContainer>

      {/* Highlight Box */}
      <MotionReveal variant="scale-up" delay={0.1}>
        <div className="mx-auto max-w-5xl rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] p-7 text-center sm:p-9">
          <p className="text-lg font-bold tracking-tight text-[#111111] sm:text-xl md:text-2xl">
            Three subscriptions. Three apps. Three histories. One unnecessarily
            expensive AI stack.
          </p>
          <p className="mt-3 text-sm font-medium text-[#5a5a57] sm:text-base">
            Cognito brings them together.
          </p>
        </div>
      </MotionReveal>
    </section>
  );
}
