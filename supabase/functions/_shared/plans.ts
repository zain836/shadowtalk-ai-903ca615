// Shared plan mapping for Stripe and LemonSqueezy

export type PlanId = 'free' | 'pro' | 'premium' | 'elite' | 'enterprise';

// Stripe product IDs -> internal plan IDs
export const STRIPE_PRODUCTS: Record<PlanId, string | null> = {
  free: null,
  // ShadowTalk Pro
  pro: 'prod_TZocSSpPddFCH1',
  // ShadowTalk Premium
  premium: 'prod_TbiuwlUUg3F17C',
  // ShadowTalk Elite
  elite: 'prod_TbhEVUPSLMSF53',
  // ShadowTalk Enterprise (from AuthProvider)
  enterprise: 'prod_TbivJcOChrAcvq',
};

export function getPlanFromStripeProduct(productId: string | null | undefined): PlanId {
  if (!productId) return 'free';
  const entry = (Object.entries(STRIPE_PRODUCTS) as [PlanId, string | null][])
    .find(([, id]) => id === productId);
  if (!entry) {
    // Default unknown paid products to pro
    return 'pro';
  }
  return entry[0];
}

// LemonSqueezy variant IDs -> internal plan IDs
// Fill in actual variant IDs from your LemonSqueezy dashboard.
export const LEMONSQUEEZY_VARIANTS: Partial<Record<PlanId, string>> = {
  // example:
  // pro: '12345',
  // premium: '23456',
  // elite: '34567',
};

export function getPlanFromLemonVariant(variantId: string | number | null | undefined): PlanId {
  if (!variantId) return 'free';
  const variantAsString = String(variantId);
  const entry = (Object.entries(LEMONSQUEEZY_VARIANTS) as [PlanId, string][])
    .find(([, id]) => id === variantAsString);
  if (!entry) {
    // Default unknown paid variants to pro
    return 'pro';
  }
  return entry[0];
}
