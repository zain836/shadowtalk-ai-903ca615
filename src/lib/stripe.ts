// Stripe Configuration for ShadowTalk AI

export const STRIPE_CONFIG = {
  prices: {
    pro: "price_1ScezZInnwEWcho15wMKeOMU", // $9.99/month
    premium: "price_1SeVSbInnwEWcho1EILyNsK4", // $29.99/month
    elite: "price_1SeTpoInnwEWcho1ETYh5Udy", // $49.99/month
  },
  products: {
    pro: "prod_TZocSSpPddFCH1",
    premium: "prod_TbiuwlUUg3F17C",
    elite: "prod_TbhEVUPSLMSF53",
  },
} as const;

export type PlanName = keyof typeof STRIPE_CONFIG.prices;

export const getPlanPriceId = (plan: PlanName): string => {
  return STRIPE_CONFIG.prices[plan];
};

export const getPlanProductId = (plan: PlanName): string => {
  return STRIPE_CONFIG.products[plan];
};

// Get plan name from product ID
export const getPlanFromProductId = (productId: string): PlanName | 'free' => {
  const entry = Object.entries(STRIPE_CONFIG.products).find(
    ([, id]) => id === productId
  );
  return entry ? (entry[0] as PlanName) : 'free';
};

// Plan display information - BETTER THAN CHATGPT!
// ChatGPT: Free=limited, Go=$5/mo, Plus=$20/mo, Pro=$200/mo
// ShadowTalk: More features at every tier!
export const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "50 messages per day",
      "🖼️ 4 image generations/day (ChatGPT: ~3)",
      "🔬 5 Deep Research queries/day (ChatGPT: ~3)",
      "Basic code generation",
      "10+ language translation",
      "Community support",
    ],
    comparison: "More generous than ChatGPT Free!",
  },
  pro: {
    name: "Pro",
    price: 9.99,
    features: [
      "Unlimited messages",
      "🖼️ 20 image generations/day",
      "🔬 20 Deep Research queries/day",
      "Advanced code generation & debugging",
      "Chat export & full history",
      "100+ language translation",
      "No advertisements",
      "Priority support (< 4h)",
      "📍 Geographic insights dashboard",
    ],
    comparison: "Half the price of ChatGPT Plus ($20)!",
  },
  premium: {
    name: "Premium",
    price: 29.99,
    features: [
      "Everything in Pro",
      "🖼️ 50 image generations/day",
      "🔬 50 Deep Research queries/day",
      "Proactive Context Engine (PCE)",
      "Multi-Step Workflow Executor",
      "Document generation (contracts, NDAs)",
      "Real-time collaboration",
      "Priority support (< 2h)",
      "🗺️ User journey tracking",
      "📊 Export analytics (CSV/JSON)",
    ],
    comparison: "Premium features at ChatGPT Plus price!",
  },
  elite: {
    name: "Elite",
    price: 49.99,
    features: [
      "Everything in Premium",
      "🖼️ Unlimited image generations",
      "🔬 Unlimited Deep Research",
      "✈️ Offline mode (works anywhere)",
      "🔒 Stealth Vault (E2E encrypted)",
      "AI agents & workflow automation",
      "Custom model fine-tuning",
      "White-label solutions",
      "24/7 phone support",
      "🌍 Global analytics & heatmaps",
    ],
    comparison: "75% cheaper than ChatGPT Pro ($200)!",
  },
  lifetime: {
    name: "Lifetime Deal",
    price: 99,
    period: "one-time",
    features: [
      "🔥 EVERYTHING in Elite - FOREVER",
      "No monthly payments ever",
      "All future updates included",
      "Priority lifetime support",
      "First 100 users only!",
    ],
    comparison: "Pay once, use forever!",
  },
} as const;
