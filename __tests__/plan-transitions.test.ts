import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLAN_HIERARCHY,
  PAID_PLANS,
  normalizeTier,
  isPaidTier,
  type PlanTier,
} from "../src/lib/plans";

describe("Plan Hierarchy & Transition Logic", () => {
  it("maintains strict hierarchy ordering: free < go < premium", () => {
    assert.equal(PLAN_HIERARCHY.free, 0);
    assert.equal(PLAN_HIERARCHY.go, 1);
    assert.equal(PLAN_HIERARCHY.premium, 2);

    assert.ok(PLAN_HIERARCHY.premium > PLAN_HIERARCHY.go);
    assert.ok(PLAN_HIERARCHY.go > PLAN_HIERARCHY.free);
  });

  it("identifies upgrade button condition when user is subscribed to a lower package", () => {
    const currentTier: PlanTier = "go";
    const isActivePaid = true;

    // Evaluate for each paid plan
    const evaluations = PAID_PLANS.map((plan) => {
      const isCurrent = currentTier === plan.id && isActivePaid;
      const isDowngrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[currentTier];
      const isUpgrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] > PLAN_HIERARCHY[currentTier];

      return {
        id: plan.id,
        name: plan.name,
        isCurrent,
        isDowngrade,
        isUpgrade,
        buttonText: isCurrent
          ? "Current plan"
          : isDowngrade
            ? `Downgrade to ${plan.name}`
            : isUpgrade
              ? `Upgrade to ${plan.name}`
              : `Subscribe to ${plan.name}`,
      };
    });

    const goEval = evaluations.find((e) => e.id === "go");
    const premiumEval = evaluations.find((e) => e.id === "premium");

    // Go should be current plan
    assert.ok(goEval);
    assert.equal(goEval.isCurrent, true);
    assert.equal(goEval.isUpgrade, false);
    assert.equal(goEval.buttonText, "Current plan");

    // Premium should show Upgrade button
    assert.ok(premiumEval);
    assert.equal(premiumEval.isCurrent, false);
    assert.equal(premiumEval.isUpgrade, true);
    assert.equal(premiumEval.isDowngrade, false);
    assert.equal(premiumEval.buttonText, "Upgrade to Premium");
  });

  it("identifies downgrade button condition when user is subscribed to premium", () => {
    const currentTier: PlanTier = "premium";
    const isActivePaid = true;

    const evaluations = PAID_PLANS.map((plan) => {
      const isCurrent = currentTier === plan.id && isActivePaid;
      const isDowngrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[currentTier];
      const isUpgrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] > PLAN_HIERARCHY[currentTier];

      return {
        id: plan.id,
        isCurrent,
        isDowngrade,
        isUpgrade,
        buttonText: isCurrent
          ? "Current plan"
          : isDowngrade
            ? `Downgrade to ${plan.name}`
            : isUpgrade
              ? `Upgrade to ${plan.name}`
              : `Subscribe to ${plan.name}`,
      };
    });

    const goEval = evaluations.find((e) => e.id === "go");
    const premiumEval = evaluations.find((e) => e.id === "premium");

    assert.ok(premiumEval);
    assert.equal(premiumEval.isCurrent, true);
    assert.equal(premiumEval.buttonText, "Current plan");

    assert.ok(goEval);
    assert.equal(goEval.isDowngrade, true);
    assert.equal(goEval.isUpgrade, false);
    assert.equal(goEval.buttonText, "Downgrade to Go");
  });

  it("identifies subscribe buttons when user is on free tier", () => {
    const currentTier: PlanTier = "free";
    const isActivePaid = false;

    const evaluations = PAID_PLANS.map((plan) => {
      const isCurrent = currentTier === plan.id && isActivePaid;
      const isDowngrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[currentTier];
      const isUpgrade =
        isActivePaid && PLAN_HIERARCHY[plan.id] > PLAN_HIERARCHY[currentTier];

      return {
        id: plan.id,
        isCurrent,
        isDowngrade,
        isUpgrade,
        buttonText: isCurrent
          ? "Current plan"
          : isDowngrade
            ? `Downgrade to ${plan.name}`
            : isUpgrade
              ? `Upgrade to ${plan.name}`
              : `Subscribe to ${plan.name}`,
      };
    });

    const goEval = evaluations.find((e) => e.id === "go");
    const premiumEval = evaluations.find((e) => e.id === "premium");

    assert.ok(goEval);
    assert.equal(goEval.buttonText, "Subscribe to Go");
    assert.ok(premiumEval);
    assert.equal(premiumEval.buttonText, "Subscribe to Premium");
  });
});
