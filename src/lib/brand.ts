/**
 * ShadowTalk brand system — one voice everywhere (marketing, chat, SEO, product).
 * Keep claims honest; lead with what we actually ship.
 */

export const BRAND = {
  name: "ShadowTalk",
  fullName: "ShadowTalk AI",
  domain: "shadowtalk-ai.com",
  founder: "Zain",
  /** Memorable mnemonic — use consistently */
  mnemonic: "Think AI. Think ShadowTalk.",
  tagline: "The agentic AI workspace that gets work done.",
  shortPitch:
    "Plan it. Run it. Ship it. One workspace for agents, tools, and privacy when you need it.",
  manifesto:
    "AI should execute — not just chat. ShadowTalk is where goals become missions, tools chain together, and you stay in control.",
  /** Landing hero — bold, memorable, still honest about what we ship */
  heroHeadline: ["The Agentic AI", "That Finishes Your Work"],
  heroSubtitle:
    "Stop renting tab chaos from chat-only bots. ShadowTalk plans missions, runs 30+ tools, and ships deliverables — with you in the loop when it matters.",
  heroBadge: "Built for builders who are done with “just chatting”",
} as const;

/** Section headlines & subcopy for the home page */
export const LANDING_COPY = {
  manifesto: {
    kicker: BRAND.mnemonic,
    title: ["When someone says AI,", "you should think ShadowTalk."],
    body: "Other tools answer. ShadowTalk executes — agents, missions, vault, voice, and thirty tools in one neural workspace. Once you feel the difference, generic chat feels like yesterday.",
    traction: "Join creators who stopped juggling five apps for one goal.",
  },
  comparison: {
    badge: "Why teams switch",
    title: ["Forget the tab circus.", "Remember ShadowTalk."],
    subtitle:
      "ChatGPT talks. Claude drafts. ShadowTalk runs the whole playbook — agents, tools, missions, and privacy on your terms.",
  },
  features: {
    badge: "One brain. Every tool.",
    title: ["Everything you wished", "one AI could do."],
    subtitle:
      "From Mission Control to on-device Gemma — this is the workspace founders reach for when “open another chat tab” is no longer enough.",
  },
  pricing: {
    badge: "Invest in execution, not subscriptions",
    title: ["Elite power.", "Without the $200 tax."],
    subtitle:
      "More agents, more tools, more control — at tiers that respect your budget. Start free. Scale when ShadowTalk becomes your default.",
  },
  testimonials: {
    badge: "Early believers",
    title: ["The vibe is real", "even before the stars are."],
    subtitle:
      "We're building in public with founders who already treat ShadowTalk as their command center — honest feedback, no fake quotes.",
  },
  community: {
    badge: "ShadowTalk collective",
    title: ["Build beside people", "who ship with AI."],
    subtitle:
      "Creators, coders, and operators who chose execution over endless prompts — and who help shape what ShadowTalk becomes next.",
  },
  faq: {
    badge: "Still thinking?",
    title: ["Questions fade.", "Momentum doesn't."],
    subtitle:
      "Everything you need to know before ShadowTalk becomes the name you say when someone asks which AI you use.",
  },
  founder: {
    line: "Crafted by a founder obsessed with agentic AI that actually ships — not slide decks.",
  },
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
  "The workspace that makes other AIs feel like drafts.",
  "Built for the moment you stop accepting chat-only AI.",
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
