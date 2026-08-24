"use client";

import Link from "next/link";
import { Check, X, Calculator } from "lucide-react";
import { MotionReveal, HoverLift } from "./LandingMotion";

export function LandingMoney() {
  return (
    <section
      id="money"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <Calculator className="size-3.5 text-[#111111]" />
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Do The Math
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            Why pay three times for AI?
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <p className="mt-6 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            You don&apos;t need three separate subscriptions to use three
            different AI models. With Cognito,{" "}
            <strong className="font-semibold text-[#111111]">
              one subscription gives you access to multiple leading models
            </strong>{" "}
            from one workspace.
          </p>
        </MotionReveal>
      </div>

      {/* Comparison Visual Side-by-Side */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* WITHOUT COGNITO */}
        <MotionReveal variant="slide-left" delay={0.1} className="h-full">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F6F3] p-7 sm:p-9">
            <div>
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-5">
                <div>
                  <span className="text-xs font-bold tracking-wider text-[#787774] uppercase">
                    The Old Way
                  </span>
                  <h3 className="mt-0.5 text-xl font-bold text-[#111111]">
                    Without Cognito
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#111111]">$60</span>
                  <span className="block text-xs text-[#787774]">
                    / mo ($720 / yr)
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3 font-mono text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 text-[#5a5a57]">
                  <span>Gemini subscription</span>
                  <span>$20 / mo</span>
                </div>
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 text-[#5a5a57]">
                  <span>Claude subscription</span>
                  <span>$20 / mo</span>
                </div>
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 text-[#5a5a57]">
                  <span>ChatGPT subscription</span>
                  <span>$20 / mo</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-xs text-[#787774] sm:text-sm">
                <div className="flex items-center gap-2">
                  <X className="size-3.5 shrink-0 text-[#eb5757]" />
                  <span>Three separate monthly credit card charges</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="size-3.5 shrink-0 text-[#eb5757]" />
                  <span>Three separate apps & browser tabs</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="size-3.5 shrink-0 text-[#eb5757]" />
                  <span>Three disconnected conversation histories</span>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-[rgba(0,0,0,0.06)] pt-5 text-center">
              <span className="text-xs font-semibold tracking-wider text-[#787774] uppercase">
                3 Subscriptions • 3 Apps • 3 Histories
              </span>
            </div>
          </div>
        </MotionReveal>

        {/* WITH COGNITO */}
        <MotionReveal variant="slide-right" delay={0.1} className="h-full">
          <HoverLift className="h-full">
            <div className="relative flex h-full flex-col justify-between rounded-2xl border-2 border-[#111111] bg-white p-7 shadow-sm sm:p-9">
              {/* Save Badge */}
              <div className="absolute -top-3 right-6 rounded-full bg-[#111111] px-3 py-0.5 text-[11px] font-semibold tracking-wider text-white uppercase">
                Save $480 / Year
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-5">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-[#5a5a57] uppercase">
                      The Smart Way
                    </span>
                    <h3 className="mt-0.5 text-xl font-bold text-[#111111]">
                      With Cognito
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-[#111111]">
                      $20
                    </span>
                    <span className="block text-xs text-[#787774]">
                      / mo ($240 / yr)
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 font-medium text-[#111111]">
                    <span className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#346538]" />
                      Gemini 3.7 Flash & 2.5 Pro access
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#346538]">
                      Included
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 font-medium text-[#111111]">
                    <span className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#346538]" />
                      Claude 3.7 Sonnet access
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#346538]">
                      Included
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-1.5 font-medium text-[#111111]">
                    <span className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#346538]" />
                      GPT-4.5 / GPT-4o access
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#346538]">
                      Included
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-xs text-[#5a5a57] sm:text-sm">
                  <div className="flex items-center gap-2 font-medium text-[#111111]">
                    <Check className="size-3.5 shrink-0 text-[#346538]" />
                    <span>One single monthly subscription</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-[#111111]">
                    <Check className="size-3.5 shrink-0 text-[#346538]" />
                    <span>Instant mid-conversation model switching</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-[#111111]">
                    <Check className="size-3.5 shrink-0 text-[#346538]" />
                    <span>Unified timeline history & central file library</span>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-[rgba(0,0,0,0.06)] pt-5">
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-[#111111] py-3 text-center text-sm font-medium text-white transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98]"
                >
                  Get Cognito
                </Link>
              </div>
            </div>
          </HoverLift>
        </MotionReveal>
      </div>

      {/* Closing Headline */}
      <MotionReveal variant="fade-up" delay={0.2} className="mt-12 text-center">
        <p className="text-lg font-bold tracking-tight text-[#111111] sm:text-xl">
          Spend less managing AI. Spend more time using it.
        </p>
      </MotionReveal>
    </section>
  );
}
