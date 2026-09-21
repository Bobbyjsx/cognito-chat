"use client";

import { ArrowRight, Check, Zap } from "lucide-react";
import { GsapMagnetic } from "@/components/modules/landing/LandingMotion";
import { MotionReveal } from "@/components/modules/landing/LandingMotion";
import { HoverLift } from "@/components/modules/landing/LandingMotion";
import { useLoginRedirect } from "@/hooks/useLoginRedirect";
import { Spinner } from "@/components/ui/spinner";
import { PLANS, billingCallbackUrl, formatNgn } from "@/lib/plans";

const GO_FEATURES = PLANS.go.features;
const PREMIUM_FEATURES = PLANS.premium.features;

export function LandingPricingCta() {
  const { login, isLoggingIn } = useLoginRedirect();

  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
    >
      {/* Header */}
      <MotionReveal variant="fade-up" className="mb-4 text-center">
        <span className="text-xs font-bold tracking-wider text-[#787774] uppercase">
          Simple pricing
        </span>
      </MotionReveal>

      <MotionReveal variant="fade-up" delay={0.05} className="mb-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
          Pick your plan
        </h2>
      </MotionReveal>

      <MotionReveal variant="fade-up" delay={0.1} className="mb-14 text-center">
        <p className="mx-auto max-w-lg text-sm text-[#787774] sm:text-base">
          One subscription. Every frontier model. Cancel anytime.
        </p>
      </MotionReveal>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── Go ── */}
        <MotionReveal variant="slide-left" delay={0.1} className="h-full">
          <HoverLift className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <div className="mb-6">
                <span className="text-xs font-bold tracking-wider text-[#787774] uppercase">
                  Go
                </span>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-[#111111]">
                    {formatNgn(PLANS.go.priceNgn)}
                  </span>
                  <span className="mb-1 text-sm text-[#787774]">/ month</span>
                </div>
                <p className="mt-2 text-xs text-[#787774]">{PLANS.go.blurb}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {GO_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-[#5a5a57]"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#346538]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <GsapMagnetic strength={0.2} className="w-full">
                <button
                  type="button"
                  onClick={(e) => login(e, billingCallbackUrl("go"))}
                  disabled={isLoggingIn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#111111] bg-white py-3 text-sm font-medium text-[#111111] transition-all duration-150 hover:bg-[#f5f5f5] active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <Spinner className="size-4" />
                  ) : (
                    <>
                      <span>{PLANS.go.cta}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </GsapMagnetic>
            </div>
          </HoverLift>
        </MotionReveal>

        {/* ── Premium ── */}
        <MotionReveal variant="slide-right" delay={0.1} className="h-full">
          <HoverLift className="h-full">
            <div className="relative flex h-full flex-col rounded-2xl border-2 border-[#111111] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#111111] px-4 py-1 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white uppercase">
                Most popular
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-[#111111] uppercase">
                    Premium
                  </span>
                  <Zap className="size-3.5 fill-[#f0a500] text-[#f0a500]" />
                </div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-[#111111]">
                    {formatNgn(PLANS.premium.priceNgn)}
                  </span>
                  <span className="mb-1 text-sm text-[#787774]">/ month</span>
                </div>
                <p className="mt-2 text-xs text-[#787774]">
                  {PLANS.premium.blurb}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {PREMIUM_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-[#5a5a57]"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#346538]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <GsapMagnetic strength={0.25} className="w-full">
                <button
                  type="button"
                  onClick={(e) => login(e, billingCallbackUrl("premium"))}
                  disabled={isLoggingIn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <Spinner className="size-4" />
                  ) : (
                    <>
                      <span>{PLANS.premium.cta}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </GsapMagnetic>

              <p className="mt-3 text-center text-xs text-[#787774]">
                Cancel anytime
              </p>
            </div>
          </HoverLift>
        </MotionReveal>
      </div>

      {/* Free note */}
      <MotionReveal variant="fade-up" delay={0.2} className="mt-8 text-center">
        <p className="text-xs text-[#787774]">
          Try Cognito free — no card required.{" "}
          <button
            type="button"
            onClick={login}
            className="font-semibold text-[#111111] underline-offset-2 hover:underline"
          >
            Sign up
          </button>{" "}
          and upgrade when you&apos;re ready.
        </p>
      </MotionReveal>
    </section>
  );
}
