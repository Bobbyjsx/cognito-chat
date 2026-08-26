"use client";

import Link from "next/link";
import { FileText, FolderUp, History, ArrowRight } from "lucide-react";
import { MotionReveal } from "./LandingMotion";

export function LandingFilesAndHistory() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Section 10: Files */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <MotionReveal variant="slide-left" className="space-y-5 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Your Files. Your AI.
            </span>
          </div>

          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl">
            Give your AI something to work with.
          </h2>

          <p className="text-base leading-relaxed font-normal text-[#5a5a57] sm:text-lg">
            Upload the documents, PDFs, and files you already work with. Then
            ask questions, extract information, summarize content, analyze
            documents, or continue the conversation with another model.
          </p>

          <p className="text-sm leading-relaxed font-medium text-[#787774]">
            Your files become part of your workspace instead of disappearing
            into a single conversation.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-6 py-3 text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.98]"
            >
              <span>Bring your files to Cognito</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </MotionReveal>

        {/* Files Mock Card */}
        <MotionReveal variant="slide-right" delay={0.1}>
          <div className="space-y-3.5 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3.5">
              <span className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                <FolderUp className="size-4 text-[#111111]" />
                Central File Library
              </span>
              <span className="font-mono text-xs text-[#787774]">
                Sync across all models
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-3.5">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-[#111111]" />
                  <div>
                    <div className="text-sm font-semibold text-[#111111]">
                      Q3-Financial-Report.pdf
                    </div>
                    <div className="text-xs text-[#787774]">
                      14.2 MB • Ready for Claude & Gemini
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-medium text-[#346538]">
                  Attached
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-3.5">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-[#111111]" />
                  <div>
                    <div className="text-sm font-semibold text-[#111111]">
                      System-Architecture-Spec.md
                    </div>
                    <div className="text-xs text-[#787774]">
                      2.4 MB • Analyzed by 3 models
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-medium text-[#346538]">
                  Attached
                </span>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>

      {/* Section 11: History */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        {/* History Mock Card */}
        <MotionReveal
          variant="slide-left"
          delay={0.1}
          className="order-2 lg:order-1"
        >
          <div className="space-y-3.5 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3.5">
              <span className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                <History className="size-4 text-[#111111]" />
                Unified Searchable History
              </span>
              <span className="font-mono text-xs text-[#787774]">
                Search by topic or model
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-3 text-xs sm:text-sm">
                <span className="font-medium text-[#111111]">
                  Postgres partitioning vs Clickhouse OLAP
                </span>
                <span className="text-xs text-[#787774]">Yesterday</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-3 text-xs sm:text-sm">
                <span className="font-medium text-[#111111]">
                  Series A Investor Pitch deck feedback
                </span>
                <span className="text-xs text-[#787774]">3 days ago</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] p-3 text-xs sm:text-sm">
                <span className="font-medium text-[#111111]">
                  TypeScript Distributed Rate-Limiter RFC
                </span>
                <span className="text-xs text-[#787774]">Last week</span>
              </div>
            </div>
          </div>
        </MotionReveal>

        <MotionReveal
          variant="slide-right"
          className="order-1 space-y-5 text-left lg:order-2"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Never Lose The Thread
            </span>
          </div>

          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl">
            Your conversations belong to you.
          </h2>

          <p className="text-base leading-relaxed font-normal text-[#5a5a57] sm:text-lg">
            Every conversation has a place. Keep your previous questions, ideas,
            research, decisions, and work organized in one unified history. Come
            back days or weeks later and pick up where you left off.
          </p>

          <div className="border-l-2 border-[#111111] pt-2 pl-4">
            <p className="text-sm font-bold text-[#111111] sm:text-base">
              Less searching. Less repetition. More continuity.
            </p>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
