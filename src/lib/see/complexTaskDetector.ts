import type { ComplexTaskDetection } from "./types";

const EXPLICIT_SEE =
  /\b(s\.?e\.?e\.?|sovereign execution|mission control|autonomous mission|background mission|multi[- ]step mission)\b/i;

const MULTI_STEP_PHRASES = [
  /\b(step[- ]by[- ]step|end[- ]to[- ]end|full workflow|complete workflow)\b/i,
  /\b(research .{5,80} (and|then) (write|create|draft|build|send|email|report))\b/i,
  /\b(find .{5,60} (and|then) (verify|email|contact|outreach))\b/i,
  /\b(audit .{5,60} (and|then) (fix|report|remediate))\b/i,
  /\b(compare .{5,60} (and|then) (recommend|report|summarize))\b/i,
  /\b(scrape|crawl|extract .{5,40} from .{5,40})\b/i,
  /\b(launch|run|execute) (a )?(full |complete )?(campaign|mission|project)\b/i,
];

const COMPLEX_ACTIONS =
  /\b(comprehensive|detailed|in[- ]depth|multi[- ]source|competitive analysis|market research|lead generation|seo audit|security audit|go[- ]to[- ]market|pitch deck|due diligence)\b/i;

const ACTION_VERBS =
  /\b(research|analyze|audit|compare|scrape|find|verify|draft|generate|build|compile|orchestrate|automate)\b/gi;

export function detectComplexTask(message: string): ComplexTaskDetection {
  const text = message.trim();
  if (text.length < 24) {
    return { useSEE: false, confidence: 0, reason: "Too short for autonomous mission" };
  }

  if (EXPLICIT_SEE.test(text)) {
    return { useSEE: true, confidence: 0.98, reason: "Explicit S.E.E. / mission request" };
  }

  let score = 0;

  if (text.length > 180) score += 0.2;
  if (text.length > 320) score += 0.15;

  const verbMatches = text.match(ACTION_VERBS);
  if (verbMatches && verbMatches.length >= 2) score += 0.25;
  if (verbMatches && verbMatches.length >= 3) score += 0.15;

  if (COMPLEX_ACTIONS.test(text)) score += 0.25;

  for (const pattern of MULTI_STEP_PHRASES) {
    if (pattern.test(text)) {
      score += 0.35;
      break;
    }
  }

  if (/\b(and then|after that|next,?|finally|first,|second,|third,)\b/i.test(text)) {
    score += 0.2;
  }

  if (/\b\d+\s+(steps|tasks|phases)\b/i.test(text)) score += 0.2;

  const listLike = (text.match(/,\s/g) || []).length >= 3;
  if (listLike && verbMatches && verbMatches.length >= 2) score += 0.15;

  const useSEE = score >= 0.55;

  return {
    useSEE,
    confidence: Math.min(0.99, score),
    reason: useSEE
      ? "Multi-step goal detected — S.E.E. will plan, execute real tools, and deliver proof"
      : "Single-turn chat is sufficient",
  };
}
