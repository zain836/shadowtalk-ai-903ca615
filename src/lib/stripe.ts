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

// Plan display information
export const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "50 queries per day",
      "Basic legal/financial info",
      "Simple document checklists",
      "Basic translation (10 languages)",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: 9.99,
    features: [
      "Unlimited queries",
      "Full Universal Regulation Mapping (URM)",
      "Cross-jurisdictional comparisons",
      "Code generation & debugging",
      "Chat export & history",
      "Priority support (< 4h)",
      "No advertisements",
      "100+ language translation",
      "📍 Geographic insights dashboard",
      "🕐 Timezone-based analytics",
    ],
  },
  premium: {
    name: "Premium",
    price: 29.99,
    features: [
      "Everything in Pro",
      "Proactive Context Engine (PCE)",
      "Multi-Step Workflow Executor (MWE)",
      "Guided application walkthroughs",
      "Tax break & benefit recommendations",
      "Life event proactive suggestions",
      "Document generation (contracts, NDAs)",
      "Real-time collaboration",
      "Priority support (< 2h)",
      "🗺️ User journey tracking & visualization",
      "📊 Export analytics (CSV/JSON)",
    ],
  },
  elite: {
    name: "Elite",
    price: 49.99,
    features: [
      "Everything in Premium",
      "Offline mode (works anywhere)",
      "Stealth mode & encrypted vault",
      "AI agents & workflow automation",
      "Custom model fine-tuning",
      "White-label solutions",
      "24/7 phone support",
      "Early beta access",
      "Advanced analytics dashboard",
      "🚨 Real-time admin alerts",
      "🌍 Global heatmap visualization",
      "📈 Traffic anomaly detection",
    ],
  },
} as const;
