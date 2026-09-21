"use client";

import {
  Lock,
  Code2,
  PenTool,
  Briefcase,
  Lightbulb,
  MessageSquare,
  Layers,
  BookMarked,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, formatNgn } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface PromptLibraryLockedViewProps {
  onUnlock: () => void;
}

const SAMPLE_PROMPTS = [
  {
    id: "sample-1",
    title: "Senior Code Review & Security Audit",
    category: "Engineering",
    categoryBg: "bg-[#E1F3FE]",
    categoryText: "text-[#1F6C9F]",
    icon: Code2,
    description:
      "Inspect a diff for vulnerability patterns, performance bottlenecks, and architectural regression.",
    prompt:
      "You are a Principal Software Architect & Staff Security Engineer. Review this code changeset:\n1. Security: audit against OWASP Top 10, sanitization, and concurrency leaks.\n2. Performance: flag O(n²) loops, excessive allocations, and unindexed queries.\n3. Quality: recommend idiomatic refinements with targeted minimal diffs.",
    tags: ["Security", "Architecture", "Code Review"],
  },
  {
    id: "sample-2",
    title: "Executive 1-Page Decision Memo",
    category: "Product",
    categoryBg: "bg-[#EDF3EC]",
    categoryText: "text-[#346538]",
    icon: Briefcase,
    description:
      "Distill complex technical briefs, customer research, or incidents into an actionable executive briefing.",
    prompt:
      "Synthesize this context into a strict 1-page executive decision memo:\n• Context & Impact: What is broken or changing, and who is affected?\n• Options Considered: Two viable paths with resource and timeline trade-offs.\n• Recommendation: High-conviction next step, decision deadline, and DRI.",
    tags: ["Strategy", "Decisions", "Executive"],
  },
  {
    id: "sample-3",
    title: "First-Principles Architecture Teardown",
    category: "Thinking",
    categoryBg: "bg-[#FBF3DB]",
    categoryText: "text-[#956400]",
    icon: Lightbulb,
    description:
      "Deconstruct complex technical dilemmas to basic physical and system constraints.",
    prompt:
      "Deconstruct this engineering challenge to first principles:\n1. What are the physical, mathematical, and business constraints that cannot change?\n2. What conventions or legacy assumptions are we artificially upholding?\n3. Reconstruct the optimal architecture from foundational primitives.",
    tags: ["First Principles", "Systems", "Reasoning"],
  },
  {
    id: "sample-4",
    title: "Publication Technical Documentation",
    category: "Writing",
    categoryBg: "bg-[#F7F6F3]",
    categoryText: "text-[#5A5A57]",
    icon: PenTool,
    description:
      "Turn rough implementation notes and schemas into crisp, developer-facing documentation.",
    prompt:
      "Transform these raw implementation notes into publication-ready developer docs:\n• Overview & Architecture: Plain language problem statement and component graph.\n• Quickstart: Copy-paste runnable code examples with error handling.\n• Gotchas: Critical failure modes and debugging steps.",
    tags: ["Documentation", "API", "Developer Experience"],
  },
];

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: "Instant Keyboard Summoning",
    description:
      "Type @ while chatting with any model to instantly inject formatted instructions without leaving your composer.",
  },
  {
    icon: Layers,
    title: "Curated Workflows",
    description:
      "Battle-tested templates across system design, code inspection, executive decision memos, and technical writing.",
  },
  {
    icon: BookMarked,
    title: "Personal Template Archive",
    description:
      "Save custom multi-step prompts, tag them by project, and reuse them across every conversation in your workspace.",
  },
];

export function PromptLibraryLockedView({
  onUnlock,
}: PromptLibraryLockedViewProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2">
      {/* ── 1. Editorial Masthead ── */}
      <div className="relative rounded-2xl border border-[#EAEAEA] bg-white p-6 text-center sm:p-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-[#EAEAEA] bg-[#FBFBFA] px-2.5 py-1 text-xs font-medium text-[#111111]">
            <Lock className="h-3.5 w-3.5 text-[#111111]" />
            <span>Cognito Premium Feature</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#111111] sm:text-3xl">
            Battle-tested prompts, ready at your keyboard.
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-[#787774] sm:text-sm">
            Upgrade to Cognito Premium to unlock our curated repository of
            engineering directives, architectural teardowns, and drafting
            frameworks. Summon and run them with{" "}
            <kbd className="rounded border border-[#EAEAEA] bg-[#FBFBFA] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#111111] shadow-2xs">
              @
            </kbd>{" "}
            inside any chat.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={onUnlock}
              className="h-10 w-full rounded-md bg-[#111111] px-6 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-[#222222] sm:w-auto"
            >
              Unlock Prompt Library
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="mt-3 text-xs text-[#787774]">
            Included in Cognito Premium at {formatNgn(PLANS.premium.priceNgn)} /
            month · Cancel anytime
          </p>
        </div>
      </div>

      {/* ── 2. Capability Highlights (Operate Pillar) ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {CAPABILITIES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-[#EAEAEA] bg-white p-4.5 transition-colors"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F6F3] text-[#111111]">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-semibold tracking-tight text-[#111111]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#787774]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 3. Interactive Catalog Preview Showcase ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-[#111111] uppercase">
              Curated Prompt Preview
            </span>
            <span className="rounded bg-[#F7F6F3] px-1.5 py-0.5 text-xs font-medium text-[#787774]">
              4 of 40+ Included
            </span>
          </div>

          <button
            type="button"
            onClick={onUnlock}
            className="text-xs font-medium text-[#111111] underline-offset-4 hover:underline"
          >
            Unlock All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SAMPLE_PROMPTS.map((sample) => {
            const Icon = sample.icon;
            return (
              <Card
                key={sample.id}
                onClick={onUnlock}
                className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-[#EAEAEA] bg-white p-4.5 transition-all hover:border-[#CCCCCC]"
              >
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                        sample.categoryBg,
                        sample.categoryText,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{sample.category}</span>
                    </div>

                    <span className="flex items-center gap-1 rounded border border-[#EAEAEA] bg-[#FBFBFA] px-1.5 py-0.5 text-xs font-medium text-[#787774]">
                      <Lock className="h-2.5 w-2.5" />
                      Locked
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold tracking-tight text-[#111111]">
                    {sample.title}
                  </h4>
                  <p className="mt-1 mb-3 text-xs leading-relaxed text-[#787774]">
                    {sample.description}
                  </p>

                  {/* Template snippet box with subtle mask */}
                  <div className="relative mb-3 rounded-md border border-[#EAEAEA] bg-[#FBFBFA] p-2.5 font-mono text-xs leading-relaxed text-[#555555]">
                    <div className="line-clamp-3 whitespace-pre-line">
                      {sample.prompt}
                    </div>
                    {/* Subtle fade gradient at bottom of snippet */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#FBFBFA] to-transparent" />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1">
                    {sample.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#F7F6F3] px-1.5 py-0.5 font-mono text-xs text-[#787774]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer action hint */}
                <div className="mt-3.5 flex items-center justify-between border-t border-[#EAEAEA] pt-2.5 text-xs text-[#787774]">
                  <span className="text-xs">Click to unlock template</span>
                  <span className="flex items-center gap-1 font-medium text-[#111111] group-hover:underline">
                    Unlock <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── 4. Bottom Value Footer ── */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#EAEAEA] bg-[#F7F6F3] p-4 sm:flex-row sm:p-5">
        <div className="flex items-center gap-2.5 text-left">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#111111] shadow-2xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#111111]">
              Ready to enhance your AI workspace?
            </div>
            <div className="text-xs text-[#787774]">
              Access the curated prompt library, 6-hour rolling limits, and
              custom templates.
            </div>
          </div>
        </div>

        <Button
          onClick={onUnlock}
          size="sm"
          className="h-8.5 w-full shrink-0 rounded-md bg-[#111111] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#222222] sm:w-auto"
        >
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
}
