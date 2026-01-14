// Lemon Squeezy Configuration
// Add your variant IDs after setting up products in Lemon Squeezy dashboard

export const LEMONSQUEEZY_CONFIG = {
  // Replace these placeholder IDs with your actual Lemon Squeezy variant IDs
  variants: {
    pro: "PLACEHOLDER_PRO_VARIANT_ID", // $9.99/month
    premium: "PLACEHOLDER_PREMIUM_VARIANT_ID", // $29.99/month
    elite: "PLACEHOLDER_ELITE_VARIANT_ID", // $49.99/month
  },
  products: {
    pro: "PLACEHOLDER_PRO_PRODUCT_ID",
    premium: "PLACEHOLDER_PREMIUM_PRODUCT_ID",
    elite: "PLACEHOLDER_ELITE_PRODUCT_ID",
  },
} as const;

export type PlanName = keyof typeof LEMONSQUEEZY_CONFIG.variants;

export const getPlanVariantId = (plan: PlanName): string => {
  return LEMONSQUEEZY_CONFIG.variants[plan];
};

export const getPlanProductId = (plan: PlanName): string => {
  return LEMONSQUEEZY_CONFIG.products[plan];
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
    ],
  },
} as const;
