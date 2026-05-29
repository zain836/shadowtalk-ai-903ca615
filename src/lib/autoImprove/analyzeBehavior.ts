import type { BehaviorEvent, LearnedProfile, ImprovementApplied } from "./types";
import { EMPTY_PROFILE } from "./types";

const MODE_ALIASES: Record<string, string> = {
  general: "general",
  code: "code",
  debug: "debug",
  research: "research",
  translate: "translate",
  summarize: "summarize",
  brainstorm: "brainstorm",
  image: "image",
  explain: "explain",
  creative: "creative",
  email: "email",
  math: "math",
};

function countMap(entries: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const e of entries) {
    if (!e) continue;
    m[e] = (m[e] || 0) + 1;
  }
  return m;
}

function topKey(m: Record<string, number>, minShare = 0.28): string | undefined {
  const total = Object.values(m).reduce((a, b) => a + b, 0);
  if (total < 5) return undefined;
  const sorted = Object.entries(m).sort((a, b) => b[1] - a[1]);
  const [key, count] = sorted[0];
  if (count / total >= minShare) return key;
  return undefined;
}

export function analyzeBehavior(
  events: BehaviorEvent[],
  previous: LearnedProfile = EMPTY_PROFILE
): { profile: LearnedProfile; newImprovements: ImprovementApplied[] } {
  const modes: string[] = [];
  const personalities: string[] = [];
  const categories: string[] = [];
  const hours: number[] = new Array(24).fill(0);
  let seeLaunches = 0;
  let regenerates = 0;
  let chatSends = 0;

  for (const e of events) {
    const hour = new Date(e.ts).getHours();
    hours[hour] += 1;

    switch (e.type) {
      case "chat_send": {
        chatSends += 1;
        const mode = String(e.payload?.mode || e.payload?.inferredCategory || "");
        const cat = String(e.payload?.category || e.payload?.inferredCategory || "general");
        if (mode) modes.push(MODE_ALIASES[mode] || mode);
        categories.push(cat);
        if (e.payload?.personality) personalities.push(String(e.payload.personality));
        break;
      }
      case "mode_change":
        modes.push(String(e.payload?.mode || ""));
        break;
      case "personality_change":
        personalities.push(String(e.payload?.personality || ""));
        break;
      case "see_launch":
        seeLaunches += 1;
        break;
      case "regenerate":
        regenerates += 1;
        break;
      default:
        break;
    }
  }

  const preferredMode = topKey(countMap(modes), 0.32);
  const preferredPersonality = topKey(countMap(personalities), 0.35);
  const topCategories = Object.entries(countMap(categories))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const peakHour = hours.indexOf(Math.max(...hours));
  const eventCount = events.length;
  const confidence = Math.min(0.95, eventCount / 40);

  const preferSeeRouting = seeLaunches >= 2 && seeLaunches / Math.max(chatSends, 1) >= 0.15;

  let systemHintAddon: string | undefined;
  if (topCategories[0] === "code" || topCategories[0] === "debug") {
    systemHintAddon = "User often works on code and debugging; be precise and include runnable examples when helpful.";
  } else if (topCategories[0] === "research") {
    systemHintAddon = "User frequently requests research; structure answers with sources and clear sections.";
  } else if (regenerates >= 4 && regenerates / Math.max(chatSends, 1) > 0.2) {
    systemHintAddon = "User often regenerates responses; provide thorough first answers with structure up front.";
  }

  const profile: LearnedProfile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    eventCount,
    confidence,
    preferredMode,
    preferredPersonality,
    preferSeeRouting,
    topCategories,
    peakHour: eventCount >= 10 ? peakHour : undefined,
    systemHintAddon,
    recentImprovements: [...(previous.recentImprovements || [])].slice(-8),
  };

  const newImprovements: ImprovementApplied[] = [];
  const now = new Date().toISOString();

  if (preferredMode && preferredMode !== previous.preferredMode && confidence >= 0.45) {
    newImprovements.push({
      id: `mode-${preferredMode}`,
      label: `Default chat mode → ${preferredMode}`,
      appliedAt: now,
      reason: `You use ${preferredMode} mode most often`,
    });
  }
  if (preferredPersonality && preferredPersonality !== previous.preferredPersonality && confidence >= 0.45) {
    newImprovements.push({
      id: `personality-${preferredPersonality}`,
      label: `Personality → ${preferredPersonality}`,
      appliedAt: now,
      reason: `Your conversations favor the ${preferredPersonality} tone`,
    });
  }
  if (preferSeeRouting && !previous.preferSeeRouting && confidence >= 0.35) {
    newImprovements.push({
      id: "see-routing",
      label: "Smarter S.E.E. routing for complex tasks",
      appliedAt: now,
      reason: "You often run multi-step missions",
    });
  }
  if (systemHintAddon && systemHintAddon !== previous.systemHintAddon && confidence >= 0.5) {
    newImprovements.push({
      id: "hint-addon",
      label: "Response style tuned to your topics",
      appliedAt: now,
      reason: `Top topics: ${topCategories.join(", ") || "general"}`,
    });
  }

  if (newImprovements.length > 0) {
    profile.recentImprovements = [...profile.recentImprovements, ...newImprovements].slice(-12);
  }

  return { profile, newImprovements };
}
