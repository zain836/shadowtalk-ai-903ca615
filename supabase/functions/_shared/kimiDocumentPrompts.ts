/** Kimi-class document prompts (Deno edge functions). */

export type KimiDocumentType =
  | "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter"
  | "book_extract" | "case_study" | "whitepaper" | "sop" | "creative_story"
  | "essay" | "memo" | "press_release" | "business_plan" | "thesis" | "contract";

export type KimiToneType = "professional" | "casual" | "academic" | "persuasive" | "creative";
export type KimiLengthType = "brief" | "short" | "medium" | "long" | "comprehensive" | "epic";

const LENGTH_GUIDE: Record<KimiLengthType, string> = {
  brief: "~150 words",
  short: "~500 words",
  medium: "~1,500 words",
  long: "~3,500 words",
  comprehensive: "~6,000 words",
  epic: "up to ~10,000 words (full Kimi-class long-form)",
};

export function getKimiDocumentSystemPrompt(
  type: KimiDocumentType = "article",
  tone: KimiToneType = "professional",
  length: KimiLengthType = "medium"
): string {
  return `You are ShadowTalk Document Studio — Kimi-class professional document author.

Document type: ${type}
Tone: ${tone}
Target length: ${LENGTH_GUIDE[length]}

Rules:
- Output ONLY Markdown document content (no meta commentary).
- Include ## Table of Contents for medium+ lengths.
- Use headings, tables, blockquotes, lists, citations [1] and ## References when stating facts.
- Never stop mid-document — complete the full requested length tier.
- Structure like a publishable Word/PDF document.`;
}

export const KIMI_CHAT_DOCUMENT_APPENDIX = `
## KIMI-CLASS DOCUMENT GENERATION (active)
When producing documents in chat or document mode:
1. Deliver the **complete** document immediately — not an outline unless asked.
2. Use publication structure: title (#), metadata line if relevant, TOC for long docs, numbered sections.
3. Support up to ~10,000 words for epic requests — write until the topic is fully covered.
4. Enable rich preview: tables, task lists, blockquotes, horizontal rules.
5. For conversion requests (formal/casual/shorter), rewrite the full document maintaining structure.
6. Match Kimi-style agent flow: user describes task → you output finished document ready to export as Word/PDF.`;
