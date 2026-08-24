"use client";

import {
  MotionReveal,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "./LandingMotion";

const STEPS = [
  {
    step: "01",
    title: "Select a model",
    desc: "Choose Gemini, Claude, or ChatGPT with a single click.",
  },
  {
    step: "02",
    title: "Start talking",
    desc: "Ask questions, attach documents, or brainstorm ideas instantly.",
  },
  {
    step: "03",
    title: "Switch when you want",
    desc: "Change intelligence mid-sentence without losing any context.",
  },
  {
    step: "04",
    title: "Zero distraction",
    desc: "Everything else stays effortlessly out of your way.",
  },
];

export function LandingPremiumExperience() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Designed To Disappear
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            Powerful AI shouldn&apos;t feel complicated.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <p className="mt-6 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            Cognito isn&apos;t designed to make you think about AI
            infrastructure. You shouldn&apos;t have to worry about which website
            you&apos;re on, which account you&apos;re using, or where your
            previous conversation lives.
          </p>
        </MotionReveal>
      </div>

      <StaggerContainer className="grid grid-flow-dense grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, idx) => (
          <StaggerItem key={idx}>
            <HoverLift className="h-full">
              <div className="relative h-full space-y-3 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <span className="block font-mono text-2xl font-bold text-[#787774]/40">
                  {s.step}
                </span>
                <h3 className="text-base font-bold tracking-tight text-[#111111]">
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed text-[#787774] sm:text-sm">
                  {s.desc}
                </p>
              </div>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <MotionReveal variant="fade-up" delay={0.2} className="mt-12 text-center">
        <p className="text-base font-bold tracking-tight text-[#5a5a57] sm:text-lg">
          The complexity stays behind the interface.
        </p>
      </MotionReveal>
    </section>
  );
}
