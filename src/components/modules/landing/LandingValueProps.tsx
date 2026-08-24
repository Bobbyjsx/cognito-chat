"use client";

import {
  Cpu,
  RefreshCcw,
  SplitSquareVertical,
  History,
  FolderArchive,
  Sparkles,
} from "lucide-react";
import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

const CARDS = [
  {
    icon: Cpu,
    title: "Choose the right model for the job.",
    subtitle: "Multiple Models",
    description:
      "Different models have different strengths. Cognito lets you move between leading AI models without opening another app, creating another account, or paying for another subscription.",
  },
  {
    icon: RefreshCcw,
    title: "Change models without starting over.",
    subtitle: "Switch Anytime",
    description:
      "Your conversation doesn't disappear when you change models. Switch models in the middle of a conversation and keep the context, attachments, and history intact.",
    highlight: "Same conversation. Different intelligence.",
  },
  {
    icon: SplitSquareVertical,
    title: "Don't settle for a single answer.",
    subtitle: "Compare Answers",
    description:
      "When you're unsure, ask another model. Compare different responses side by side and decide which answer makes the most sense for you.",
    highlight: "More perspectives. Better decisions.",
  },
  {
    icon: History,
    title: "Everything you ask. One place.",
    subtitle: "One History",
    description:
      "Stop searching through three different AI apps to find something you asked last month. Cognito gives you a unified conversation history across your models.",
  },
  {
    icon: FolderArchive,
    title: "Your files travel with you.",
    subtitle: "One File Library",
    description:
      "Upload a document once and use it across your conversations. Whether you're analyzing a PDF, reviewing a document, studying, or working on a project, your files stay organized inside your workspace.",
  },
  {
    icon: Sparkles,
    title: "One workspace for everything.",
    subtitle: "Built for Everyday AI",
    description:
      "Research. Writing. Coding. Learning. Brainstorming. Planning. Analysis. Cognito gives you a single place to work with AI, whatever you're working on.",
    tags: [
      "Research",
      "Writing",
      "Coding",
      "Learning",
      "Brainstorming",
      "Planning",
      "Analysis",
    ],
  },
];

export function LandingValueProps() {
  return (
    <section
      id="value-props"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="blur-fade">
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            One subscription. More intelligence.
          </h2>
        </MotionReveal>
      </div>

      {/* Gapless Dense Bento Grid */}
      <StaggerContainer className="grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={idx}>
              <HoverLift className="h-full">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[rgba(0,0,0,0.12)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] text-[#111111]">
                        <Icon size={20} />
                      </div>
                      <span className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-2.5 py-0.5 font-mono text-[11px] tracking-wider text-[#787774] uppercase">
                        {card.subtitle}
                      </span>
                    </div>

                    <h3 className="text-lg leading-snug font-bold tracking-tight text-[#111111]">
                      {card.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#787774]">
                      {card.description}
                    </p>

                    {card.tags && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-2 py-0.5 text-xs text-[#5a5a57]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {card.highlight && (
                    <div className="mt-5 border-t border-[rgba(0,0,0,0.06)] pt-4">
                      <p className="flex items-center gap-2 text-xs font-semibold text-[#111111] sm:text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
                        {card.highlight}
                      </p>
                    </div>
                  )}
                </div>
              </HoverLift>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
