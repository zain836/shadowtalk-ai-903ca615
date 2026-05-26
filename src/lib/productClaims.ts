/**
 * Single source of truth for product limits and honest marketing copy.
 * Import from here in UI, monetization, Stripe plan text, and enforcement hooks.
 */

export const FREE_TIER_DAILY = {
  messages: 50,
  fileUploads: 3,
  codeGenerations: 5,
  imageGenerations: 4,
  webSearches: 5,
  deepResearch: 5,
  voiceSessions: 3,
} as const;

export type DailyLimitAction = keyof typeof FREE_TIER_DAILY;

export const DAILY_LIMITS = {
  free: { ...FREE_TIER_DAILY },
  pro: {
    messages: Infinity,
    fileUploads: 50,
    codeGenerations: Infinity,
    imageGenerations: 20,
    webSearches: 50,
    deepResearch: 20,
    voiceSessions: Infinity,
  },
  premium: {
    messages: Infinity,
    fileUploads: Infinity,
    codeGenerations: Infinity,
    imageGenerations: 50,
    webSearches: Infinity,
    deepResearch: 50,
    voiceSessions: Infinity,
  },
  elite: {
    messages: Infinity,
    fileUploads: Infinity,
    codeGenerations: Infinity,
    imageGenerations: Infinity,
    webSearches: Infinity,
    deepResearch: Infinity,
    voiceSessions: Infinity,
  },
  lifetime: {
    messages: Infinity,
    fileUploads: Infinity,
    codeGenerations: Infinity,
    imageGenerations: Infinity,
    webSearches: Infinity,
    deepResearch: Infinity,
    voiceSessions: Infinity,
  },
} as const;

/** Guest (unsigned) caps — stricter than signed-in free tier */
export const GUEST_LIMITS = {
  chats: 10,
  images: 3,
  deepResearch: 2,
} as const;

/** Community metrics — update when analytics change (last verified May 2026) */
export const COMMUNITY_METRICS = {
  totalUsers: 1_500,
  dailyActiveUsers: 104,
} as const;

export const COMMUNITY_HIGHLIGHTS = [
  {
    label: "ShadowTalk users",
    value: "1.5K+",
    description: `${COMMUNITY_METRICS.totalUsers.toLocaleString()} creators and teams on the platform.`,
  },
  {
    label: "Daily active users",
    value: "104+",
    description: "People who use ShadowTalk every day — real usage, not vanity signups.",
  },
  {
    label: "Templates & tools",
    value: "Growing",
    description: "Shared prompts, agents, and workflows from the community and team.",
  },
  {
    label: "Ship cadence",
    value: "Weekly",
    description: "Features and fixes driven by what you actually use.",
  },
] as const;

export const PRIVACY_COPY = {
  /** Cloud chat default */
  cloudDefault:
    "Cloud chat uses secure servers. Sensitive work can use Stealth Vault, BYOK, or optional on-device Gemma.",
  /** When offline / local mode is active */
  localMode:
    "In on-device mode, inference runs in your browser. Prompts for that session are not sent to our servers.",
  /** Vault / E2EE */
  vault:
    "Stealth Vault encrypts data client-side. Only you hold the keys.",
  /** Short tagline for cards */
  privacyNative:
    "Privacy-native: vault, BYOK, and optional on-device AI — you choose cloud vs local.",
} as const;

export function formatFreeLimitLine(
  key: DailyLimitAction,
  plan: keyof typeof DAILY_LIMITS = "free"
): string {
  const limit = DAILY_LIMITS[plan][key];
  const labels: Record<DailyLimitAction, string> = {
    messages: "messages",
    fileUploads: "file uploads",
    codeGenerations: "code generations",
    imageGenerations: "image generations",
    webSearches: "web searches",
    deepResearch: "deep research queries",
    voiceSessions: "voice sessions",
  };
  if (limit === Infinity) return `Unlimited ${labels[key]}`;
  return `${limit} ${labels[key]}/day`;
}

export const FREE_TIER_MARKETING = {
  messages: formatFreeLimitLine("messages"),
  images: formatFreeLimitLine("imageGenerations"),
  deepResearch: formatFreeLimitLine("deepResearch"),
  voice: formatFreeLimitLine("voiceSessions"),
} as const;

export const isWithinLimit = (
  plan: keyof typeof DAILY_LIMITS,
  action: DailyLimitAction,
  currentCount: number
): boolean => {
  const limit = DAILY_LIMITS[plan][action];
  return limit === Infinity || currentCount < limit;
};
