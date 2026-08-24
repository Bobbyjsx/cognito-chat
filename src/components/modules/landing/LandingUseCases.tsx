"use client";

import {
  BookOpen,
  PenTool,
  Code2,
  GraduationCap,
  Map,
  MessageCircleQuestion,
} from "lucide-react";
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

const USE_CASES = [
  {
    icon: BookOpen,
    title: "Research",
    description:
      "Explore ideas, summarize information, analyze documents, and challenge answers with different AI models.",
  },
  {
    icon: PenTool,
    title: "Writing",
    description:
      "Draft emails, articles, proposals, reports, and ideas. Then use another model to refine them.",
  },
  {
    icon: Code2,
    title: "Coding",
    description:
      "Debug code, design systems, review implementations, and get a second opinion when you're stuck.",
  },
  {
    icon: GraduationCap,
    title: "Learning",
    description:
      "Ask questions, upload study material, break down difficult concepts, and learn at your own pace.",
  },
  {
    icon: Map,
    title: "Planning",
    description:
      "Plan projects, trips, businesses, products, or your next big idea with multiple AI perspectives.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Everyday Questions",
    description:
      "From quick questions to deep conversations, Cognito is ready whenever you are.",
  },
];

export function LandingUseCases() {
  return (
    <section
      id="use-cases"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Made For Whatever You&apos;re Working On
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            One workspace. Every kind of work.
          </h2>
        </MotionReveal>
      </div>

      <StaggerContainer className="grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((uc, idx) => {
          const Icon = uc.icon;
          return (
            <StaggerItem key={idx}>
              <HoverLift className="h-full">
                <div className="h-full space-y-3 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:bg-[#F7F6F3]/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-[#111111]">
                    {uc.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    {uc.description}
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
