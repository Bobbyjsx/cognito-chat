"use client";

import { Check, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useLoginRedirect } from "@/hooks/useLoginRedirect";
import { MotionReveal, HoverLift, GsapMagnetic } from "./LandingMotion";

export function LandingPricingCta() {
  const { isLoggingIn, login } = useLoginRedirect();
  return (
    <section
      id="pricing"
      className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              One Subscription
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl md:text-5xl">
            Stop paying for AI three times.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <p className="mt-6 text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-lg">
            Get access to multiple leading AI models from one workspace. No more
            choosing which AI subscription to keep. No more switching between
            apps. No more scattered conversations.
          </p>
        </MotionReveal>
      </div>

      {/* Plan Showcase Card */}
      <MotionReveal variant="scale-up" delay={0.15}>
        <HoverLift>
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] sm:p-10">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider text-[#787774] uppercase">
                All-Inclusive Membership
              </span>
              <h3 className="text-2xl font-bold text-[#111111] sm:text-3xl">
                Cognito Pro
              </h3>
              <p className="mx-auto max-w-sm text-xs text-[#787774] sm:text-sm">
                Everything you need to work seamlessly across Claude, Gemini,
                and ChatGPT.
              </p>
            </div>

            <div className="my-6 flex items-center justify-center gap-2 border-y border-[rgba(0,0,0,0.06)] py-5">
              <span className="text-4xl font-extrabold text-[#111111] sm:text-5xl">
                $20
              </span>
              <div className="text-left">
                <span className="block text-xs font-semibold text-[#111111] sm:text-sm">
                  / month
                </span>
                <span className="block text-xs text-[#787774]">
                  Single subscription
                </span>
              </div>
            </div>

            <div className="mx-auto mb-8 max-w-md space-y-3 text-left text-xs text-[#5a5a57] sm:text-sm">
              <div className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0 text-[#346538]" />
                <span>
                  Full access to Claude 3.7 Sonnet, Gemini 3.7 Flash, and
                  GPT-4.5 / GPT-4o
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0 text-[#346538]" />
                <span>Instant mid-conversation model switching</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0 text-[#346538]" />
                <span>Unified searchable timeline & prompt archive</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0 text-[#346538]" />
                <span>
                  Central file library with document context synchronization
                </span>
              </div>
            </div>

            <GsapMagnetic strength={0.3} className="w-full">
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] py-3 text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98] disabled:opacity-70"
              >
                {isLoggingIn ? (
                  <Spinner className="size-4" />
                ) : (
                  <>
                    <span>Start with Cognito</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </GsapMagnetic>

            <p className="mt-4 text-xs text-[#787774]">
              Cancel anytime. Your conversations stay organized in one place.
            </p>
          </div>
        </HoverLift>
      </MotionReveal>
    </section>
  );
}
