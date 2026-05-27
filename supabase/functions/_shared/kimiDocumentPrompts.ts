/** Kimi-class document prompts (Deno edge functions) — publication quality. */

export type KimiDocumentType =
  | "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter"
  | "book_extract" | "case_study" | "whitepaper" | "sop" | "creative_story"
  | "essay" | "memo" | "press_release" | "business_plan" | "thesis" | "contract";

export type KimiToneType = "professional" | "casual" | "academic" | "persuasive" | "creative";
export type KimiLengthType = "brief" | "short" | "medium" | "long" | "comprehensive" | "epic";

const LENGTH_GUIDE: Record<KimiLengthType, string> = {
  brief: "~150 words — one section, no TOC",
  short: "~500 words — 2–4 sections",
  medium: "~1,500 words — full structure with TOC",
  long: "~3,500 words — deep sections, tables, references",
  comprehensive: "~6,000 words — board-ready report",
  epic: "up to ~10,000 words — exhaustive, still tightly edited (no padding)",
};

export const PROFESSIONAL_DOCUMENT_STANDARDS = `
PUBLICATION-QUALITY STANDARDS (strict):
- Clear formal English. No emojis, no filler openers, no AI meta-commentary.
- Exactly one # title; subtitle on line 2 in *italics* if needed.
- ## Table of Contents for medium+ lengths (bullet list of section titles only).
- ## Executive Summary for reports/whitepapers (concise, factual).
- GFM tables with valid header/separator rows. Numbered lists for recommendations only.
- Citations [1] in body; ## References at end when citing facts.
- Output ONLY Markdown — no text before or after the document.`;

const TYPE_STRUCTURES: Record<KimiDocumentType, string> = {
  article: "Newsroom feature: # headline, deck (*italic*), ## sections, pull quote (>), conclusion.",
  email: "**Subject:** line, greeting, 2–4 short paragraphs, bullet action items, professional sign-off.",
  report: "# Title, *metadata*, ## Executive Summary, ## Key Findings (table), ## Analysis, ## Recommendations (numbered), ## Conclusion.",
  proposal: "# Title, ## Overview, ## Scope, ## Approach, timeline table, ## Investment, ## Next Steps.",
  blog: "# SEO title, intro hook, ## H2 sections, scannable bullets, single CTA closing.",
  resume: "# Name, *title*, contact line, ## Summary, ## Experience (metrics), ## Education, ## Skills.",
  letter: "Letterhead block, date, recipient, Re:, body paragraphs, closing.",
  book_extract: "Fiction only — chapter # title, prose, dialogue; creative tone allowed.",
  case_study: "## Client, ## Challenge, ## Solution, results table, ## Outcomes, testimonial (>).",
  whitepaper: "Abstract (> ), TOC, ## Introduction, ## Analysis (tables), ## Findings, ## Recommendations, ## References.",
  sop: "## Purpose, ## Scope, definitions table, numbered ## Procedure steps, checklist.",
  creative_story: "Literary fiction structure; creative tone allowed.",
  essay: "Thesis intro, argued ## sections, counterargument, synthesis conclusion.",
  memo: "TO/FROM/DATE/RE block, ## Summary, bullets, ## Action requested.",
  press_release: "FOR IMMEDIATE RELEASE, headline #, dateline, quotes, boilerplate, contact.",
  business_plan: "## Executive Summary, market, model, financials table, GTM, team.",
  thesis: "Abstract, ## Literature Review, ## Methodology, ## Results, ## Discussion, ## References.",
  contract: "Parties, recitals, numbered clauses — formal legal tone, no disclaimer prose.",
};

export function getKimiDocumentSystemPrompt(
  type: KimiDocumentType = "article",
  tone: KimiToneType = "professional",
  length: KimiLengthType = "medium"
): string {
  const allowCreative = type === "creative_story" || type === "book_extract" || tone === "creative";
  return `You are a senior document specialist at a top-tier consulting firm (McKinsey/BCG caliber). You produce documents that are immediately client-ready.

Document type: ${type}
Structure: ${TYPE_STRUCTURES[type]}
Tone: ${tone}${allowCreative ? " (literary devices allowed)" : " — formal, neutral, precise"}
Target length: ${LENGTH_GUIDE[length]}
${PROFESSIONAL_DOCUMENT_STANDARDS}`;
}

export const KIMI_CHAT_DOCUMENT_APPENDIX = `
## PROFESSIONAL DOCUMENT GENERATION (active)
When the user requests any document (report, email, proposal, whitepaper, etc.):
1. Output the **complete** client-ready Markdown document — never an outline or "I can help you draft..."
2. One # title only; use ## and ### for hierarchy; include TOC for medium+ length.
3. **No emojis**, no exclamation-heavy marketing tone unless user asked for casual/creative.
4. Use tables and numbered recommendations where appropriate; end with clear next steps or conclusion.
5. Write as if the reader is an executive: scannable headings, tight prose, specific facts (use reasonable illustrative figures if needed, labeled as illustrative).
6. Document must look clean when rendered to Word/PDF — consistent spacing, no broken markdown.`;
