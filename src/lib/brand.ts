/**
 * ShadowTalk brand system — one voice everywhere (marketing, chat, SEO, product).
 * Keep claims honest; lead with what we actually ship.
 */

export const BRAND = {
  name: "ShadowTalk",
  fullName: "ShadowTalk AI",
  domain: "shadowtalk-ai.com",
  /** Memorable mnemonic — use consistently */
  mnemonic: "Think AI. Think ShadowTalk.",
  tagline: "The agentic AI workspace that gets work done.",
  shortPitch:
    "Plan it. Run it. Ship it. One workspace for agents, tools, and privacy when you need it.",
  manifesto:
    "AI should execute — not just chat. ShadowTalk is where goals become missions, tools chain together, and you stay in control.",
} as const;

/** Real traction — sync with productClaims COMMUNITY_METRICS */
export const BRAND_TRACTION = {
  usersLabel: "1.5K+ creators",
  dailyLabel: "104+ daily active",
} as const;

export const BRAND_PILLARS = [
  {
    title: "Agents that finish",
    description: "Multi-step missions with Mission Control — not one-shot replies.",
    emoji: "🎯",
  },
  {
    title: "30+ tools, one sentence",
    description: "Research, code, vault, voice, docs — triggered from natural language.",
    emoji: "⚡",
  },
  {
    title: "You approve the edge",
    description: "Human-in-the-loop when stakes are high. Auto-run when you trust the flow.",
    emoji: "🛡️",
  },
  {
    title: "Privacy on your terms",
    description: "Cloud power by default. Vault, BYOK, and on-device Gemma when it matters.",
    emoji: "🔒",
  },
  {
    title: "Every surface",
    description: "Web, PWA, and desktop software — same brain, deeper device access on install.",
    emoji: "🖥️",
  },
] as const;

/** Rotating hero / chat hooks — memorable, specific */
export const BRAND_HOOKS = [
  "When you need AI that ships, not just chats.",
  "Your goals. Our agents. Real deliverables.",
  "ChatGPT talks. ShadowTalk executes.",
  "One workspace. Thirty tools. Zero tab chaos.",
  "Think AI. Think ShadowTalk.",
] as const;

export const CHAT_WELCOME_LINES = [
  "Think AI. Think ShadowTalk. What are we building today?",
  "Your agentic workspace is live. Give me a goal — I'll plan the steps.",
  "Mission-ready. Drop a task, research question, or 'run this for me'.",
  "Encrypted vault unlocked. Let's turn intent into output.",
] as const;

export const CHAT_EMPTY_HEADLINE = "What should ShadowTalk execute for you?";

export function pickBrandHook(seed?: number): string {
  const i = seed ?? Math.floor(Math.random() * BRAND_HOOKS.length);
  return BRAND_HOOKS[i % BRAND_HOOKS.length];
}

export function pickChatWelcome(seed?: number): string {
  const i = seed ?? Math.floor(Math.random() * CHAT_WELCOME_LINES.length);
  return CHAT_WELCOME_LINES[i % CHAT_WELCOME_LINES.length];
}
