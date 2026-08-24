"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/site";
import { MotionReveal } from "./LandingMotion";

export function LandingFaq() {
  return (
    <section
      id="faq"
      className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mb-14 text-center">
        <MotionReveal variant="fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#F7F6F3] px-3 py-1">
            <span className="text-xs font-semibold tracking-wider text-[#5a5a57] uppercase">
              Frequently Asked Questions
            </span>
          </div>
        </MotionReveal>

        <MotionReveal variant="blur-fade" delay={0.08}>
          <h2 className="text-3xl leading-[1.12] font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl">
            Questions, answered.
          </h2>
        </MotionReveal>
      </div>

      <MotionReveal variant="scale-up" delay={0.15} className="w-full">
        <div className="w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-8">
          <Accordion
            defaultValue={["what-is-cognito"]}
            className="w-full space-y-2"
          >
            {FAQS.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="w-full border-b border-[rgba(0,0,0,0.06)] py-1 last:border-b-0"
              >
                <AccordionTrigger className="flex w-full items-center justify-between py-3.5 text-left text-sm font-medium text-[#111111] transition-colors hover:text-[#5a5a57] hover:no-underline sm:text-base">
                  <span className="pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="w-full pb-4 text-xs leading-relaxed text-[#5a5a57] sm:text-sm">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </MotionReveal>
    </section>
  );
}
