"use client";

import {
  MessageSquareText,
  Layers,
  FolderClosed,
  LayoutDashboard,
} from "lucide-react";
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Unified conversations",
    description:
      "All your AI conversations in one searchable history across every model you use.",
  },
  {
    icon: Layers,
    title: "Persistent context",
    description:
      "Switch models without losing the conversation, documents, or reasoning thread you're working on.",
  },
  {
    icon: FolderClosed,
    title: "Centralized files",
    description:
      "Keep the documents you work with alongside your AI conversations in one persistent library.",
  },
  {
    icon: LayoutDashboard,
    title: "One workspace",
    description:
      "Everything you need to work with AI, without the tab overload and multi-app fatigue.",
  },
];

export function LandingUnifiedWorkspace() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Everything In One Place
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            Your AI life, without the fragmentation.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <div className="mt-6 space-y-4 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            <p>
              Your conversations shouldn&apos;t be scattered across different AI
              products.
            </p>
            <p>
              Your files shouldn&apos;t be trapped in different apps. And you
              shouldn&apos;t have to remember which model you used three weeks
              ago.
            </p>
            <p>
              Cognito brings your AI conversations, models, files, and history
              into one unified workspace.
            </p>
          </div>
        </MotionReveal>
      </div>

      <StaggerContainer className="grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-2">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <StaggerItem key={idx}>
              <HoverLift className="h-full">
                <div className="h-full space-y-3 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[rgba(0,0,0,0.12)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[#111111]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#787774]">
                    {feature.description}
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
