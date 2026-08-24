"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MotionReveal } from "./LandingMotion";

export function LandingFinalCta() {
  return (
    <section className="w-full border-y border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <MotionReveal variant="blur-fade">
          <h2 className="text-3xl leading-[1.1] font-bold tracking-[-0.035em] text-balance text-[#111111] sm:text-5xl md:text-6xl">
            One subscription. <br className="hidden sm:inline" />
            Every model you need.
          </h2>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.08}>
          <p className="mx-auto max-w-xl text-base leading-relaxed font-normal text-balance text-[#5a5a57] sm:text-xl">
            Stop paying for separate AI subscriptions just to get different
            perspectives. Bring your AI conversations, models, files, and ideas
            into one place.
          </p>
        </MotionReveal>

        <MotionReveal variant="fade-up" delay={0.16}>
          <div className="flex w-full flex-col items-center justify-center gap-3 pt-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-7 py-3.5 text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98] sm:w-auto"
            >
              <span>Start using Cognito</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </MotionReveal>

        <MotionReveal variant="fade-in" delay={0.24}>
          <p className="pt-4 text-xs font-semibold tracking-tight text-[#787774]">
            Your AI. Your workspace. One subscription.
          </p>
        </MotionReveal>
      </div>
    </section>
  );
}
