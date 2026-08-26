"use client";

import { LandingComparison } from "./LandingComparison";
import { LandingFaq } from "./LandingFaq";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHero } from "./LandingHero";
import { LandingMoney } from "./LandingMoney";
import { LandingNav } from "./LandingNav";
import { LandingPricingCta } from "./LandingPricingCta";
import { LandingProblem } from "./LandingProblem";
import { LandingValueProps } from "./LandingValueProps";
import { usePrewarmServices } from "@/hooks/usePrewarmServices";

// Preserved for Backward Compatibility (commented out to keep page punchy & fast):
// import { LandingSolution } from "./LandingSolution";
// import { LandingModelSwitching } from "./LandingModelSwitching";
// import { LandingUnifiedWorkspace } from "./LandingUnifiedWorkspace";
// import { LandingUseCases } from "./LandingUseCases";
// import { LandingFilesAndHistory } from "./LandingFilesAndHistory";
// import { LandingPremiumExperience } from "./LandingPremiumExperience";
// import { LandingWhyCognito } from "./LandingWhyCognito";

export function LandingPage() {
  // Silently wake up backend auth and API services during idle time
  usePrewarmServices();

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#FBFBFA] font-sans text-[#111111] antialiased selection:bg-[#111111]/10 selection:text-[#111111]">
      {/* 1. Translucent Navigation */}
      <LandingNav />

      {/* Streamlined High-Converting Content Flow */}
      <main className="flex flex-col">
        {/* Hero with live multi-model switcher */}
        <LandingHero />

        {/* The 3-Subscription Problem */}
        <LandingProblem />

        {/* Preserved Section: Solution */}
        {/* <LandingSolution /> */}

        {/* Benefits & Value Proposition Bento */}
        <LandingValueProps />

        {/* The Economic Argument & $480/yr Savings Math */}
        <LandingMoney />

        {/* Preserved Section: Model Switching Deep Dive */}
        {/* <LandingModelSwitching /> */}

        {/* Side-by-Side Multi-Model Comparison Matrix */}
        <LandingComparison />

        {/* Preserved Sections */}
        {/* <LandingUnifiedWorkspace /> */}
        {/* <LandingUseCases /> */}
        {/* <LandingFilesAndHistory /> */}
        {/* <LandingPremiumExperience /> */}
        {/* <LandingWhyCognito /> */}

        {/* All-Inclusive Membership Plan */}
        <LandingPricingCta />

        {/* Frequently Asked Questions */}
        <LandingFaq />

        {/* Final Conversion Chapter */}
        <LandingFinalCta />
      </main>

      {/* Apple-style Footer */}
      <LandingFooter />
    </div>
  );
}
