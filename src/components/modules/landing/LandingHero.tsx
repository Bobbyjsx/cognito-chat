"use client";

import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "./LandingMotion";

export function LandingHero() {
  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-28 md:pt-48 lg:px-8">
      {/* 1. Top Centered Eyebrow: ------ The AI Workspace ------ */}
      <MotionReveal isHero variant="fade-up" duration={0.45}>
        <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
          <span className="h-px w-8 bg-[rgba(0,0,0,0.12)] sm:w-12" />
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Your AI Workspace
            </span>
          </div>
          <span className="h-px w-8 bg-[rgba(0,0,0,0.12)] sm:w-12" />
        </div>
      </MotionReveal>

      {/* 2. Top Centered Headline: All your AI. One subscription. */}
      <MotionReveal
        isHero
        variant="blur-fade"
        delay={0.08}
        duration={0.55}
        className="w-full max-w-5xl text-center"
      >
        <h1 className="text-4xl leading-[1.08] font-bold tracking-[-0.035em] text-balance text-[#111111] sm:text-6xl md:text-7xl">
          All your AI. One subscription.
        </h1>
      </MotionReveal>

      {/* 3. Split Below Headline: [desc text] (Left) and [image] (Right) */}
      <div className="mt-12 grid w-full grid-cols-1 items-center gap-10 sm:mt-16 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        {/* Left (50%): Description text & conversion actions */}
        <div className="flex flex-col items-start text-left lg:col-span-6">
          <MotionReveal isHero variant="fade-up" delay={0.16} duration={0.5}>
            <p className="text-base leading-relaxed font-normal text-pretty text-[#5a5a57] sm:text-lg md:text-xl">
              <strong className="font-semibold text-[#111111]">
                Why pay for Gemini, Claude, and ChatGPT separately?
              </strong>{" "}
              Cognito brings the world&apos;s leading AI models into one
              workspace, so you can choose the right model for every task
              without juggling multiple subscriptions, apps, and conversation
              histories.
            </p>
          </MotionReveal>

          {/* Model feature badges */}
          <MotionReveal
            isHero
            variant="fade-up"
            delay={0.22}
            duration={0.5}
            className="mt-6 w-full"
          >
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#5a5a57] sm:text-sm">
              <span className="flex items-center gap-1.5 font-medium text-[#111111]">
                <Check className="size-3.5 text-[#346538]" />
                Gemini 3.7 Flash
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#111111]">
                <Check className="size-3.5 text-[#346538]" />
                Claude 5 Sonnet
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#111111]">
                <Check className="size-3.5 text-[#346538]" />
                GPT-5.6 Sol
              </span>
            </div>
          </MotionReveal>

          {/* Action Buttons */}
          <MotionReveal
            isHero
            variant="fade-up"
            delay={0.28}
            duration={0.5}
            className="mt-8 w-full sm:w-auto"
          >
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-7 py-3.5 text-base font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98] sm:w-auto"
              >
                <span>Start using Cognito</span>
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#problem"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-6 py-3.5 text-base font-medium text-[#111111] transition-all duration-150 hover:bg-[#EAEAEA] active:scale-[0.98] sm:w-auto"
              >
                <span>See how it works</span>
              </a>
            </div>
          </MotionReveal>

          {/* Microcopy */}
          <MotionReveal isHero variant="fade-in" delay={0.34} duration={0.4}>
            <p className="mt-4 text-xs font-medium text-[#787774]">
              One subscription • Instant model switching • Unified history
            </p>
          </MotionReveal>
        </div>

        {/* Right (50%): Phone Mockup Cropped to First Half (Matching Text Height) */}
        <div className="relative flex w-full items-center justify-center lg:col-span-6">
          <MotionReveal
            isHero
            variant="scale-up"
            delay={0.25}
            duration={0.65}
            className="relative flex w-full items-center justify-center"
          >
            <div className="relative mx-auto flex max-h-[300px] w-full max-w-[270px] flex-col items-center overflow-hidden rounded-t-[44px] bg-inherit sm:max-h-[340px] sm:max-w-[310px] sm:rounded-t-[52px] md:max-h-[370px] md:max-w-[330px] lg:max-h-[390px] lg:max-w-[350px]">
              <Image
                src="/images/landing/phone-mock.png"
                alt="Cognito Mobile Workspace"
                width={800}
                height={1600}
                priority
                sizes="(max-width: 768px) 270px, 350px"
                className="drop-shadow-[0_15px_35px_rgba(0,0,0,0.12)]- h-auto w-full object-cover object-top transition-transform duration-500 select-none hover:scale-[1.02]"
              />
              {/* Seamless Bottom Gradient Fade into Canvas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#FBFBFA] via-[#FBFBFA]/80 to-transparent sm:h-28"
              />
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
