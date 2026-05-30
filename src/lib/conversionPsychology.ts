import { PLAN_DETAILS } from "@/lib/stripe";

/** Primary monthly plan we steer most users toward (decoy pricing: Elite makes this look fair). */
export const RECOMMENDED_MONTHLY_PLAN = "premium" as const;

export type MonthlyPlanId = "pro" | "premium" | "elite";

export const MONTHLY_PLANS: MonthlyPlanId[] = ["pro", "premium", "elite"];

export const COMPETITOR_ANCHORS = {
  chatgptPlus: 20,
  chatgptPro: 200,
} as const;

export function dailyPrice(monthlyUsd: number): string {
  const perDay = monthlyUsd / 30;
  return perDay < 1 ? `$${perDay.toFixed(2)}` : `$${perDay.toFixed(0)}`;
}

export function getPlanPsychology(planId: MonthlyPlanId) {
  const details = PLAN_DETAILS[planId];
  return {
    id: planId,
    name: details.name,
    price: details.price,
    daily: dailyPrice(details.price),
    comparison: details.comparison,
    topFeatures: details.features.slice(1, 5),
  };
}

export function getLossAversionMessage(used: number, limit: number, unit = "messages"): string {
  const remaining = Math.max(0, limit - used);
  if (remaining === 0) {
    return `You've hit today's ${limit} free ${unit}. Upgrade to keep your flow — waiting resets at midnight.`;
  }
  if (remaining <= 5) {
    return `Only ${remaining} free ${unit} left today. Pro members never pause mid-thought.`;
  }
  const pct = Math.round((used / limit) * 100);
  return `You're at ${pct}% of today's free ${unit}. Power users upgrade before they hit the wall.`;
}

export function getEndowmentMessage(conversationCount: number): string {
  if (conversationCount <= 0) {
    return "Your workspace is ready — unlock unlimited messages before your next deep session.";
  }
  if (conversationCount === 1) {
    return "You've started building context in ShadowTalk. Don't lose momentum to daily caps.";
  }
  return `You've got ${conversationCount} conversations here. Premium keeps history, speed, and tools unlocked.`;
}

export function getSocialProofLine(creatorCount?: number | null): string {
  if (creatorCount && creatorCount >= 100) {
    return `Join ${creatorCount >= 1000 ? `${Math.floor(creatorCount / 100) / 10}K+` : `${creatorCount}+`} builders on ShadowTalk`;
  }
  return "Built for founders who ship with AI daily";
}

export function getRiskReversalBullets(): string[] {
  return [
    "Cancel anytime — no lock-in",
    "30-day money-back guarantee",
    "Instant activation after payment",
    "Keep your chats & settings",
  ];
}

export function getValueAnchorLine(planId: MonthlyPlanId): string {
  if (planId === "pro") {
    return `Less than ${dailyPrice(PLAN_DETAILS.pro.price)}/day · 4× cheaper than ChatGPT Plus`;
  }
  if (planId === "premium") {
    return `Same price tier as ChatGPT Plus — more agentic tools included`;
  }
  return `90% less than ChatGPT Pro ($${COMPETITOR_ANCHORS.chatgptPro}/mo)`;
}
