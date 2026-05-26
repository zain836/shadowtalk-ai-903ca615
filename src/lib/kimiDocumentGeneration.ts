/**
 * Kimi-style long-form document generation for ShadowTalk.
 * Structured markdown, TOC, tables, citations, up to ~10k words.
 */

export type KimiDocumentType =
  | "article"
  | "email"
  | "report"
  | "proposal"
  | "blog"
  | "resume"
  | "letter"
  | "book_extract"
  | "case_study"
  | "whitepaper"
  | "sop"
  | "creative_story"
  | "essay"
  | "memo"
  | "press_release"
  | "business_plan"
  | "thesis"
  | "contract";

export type KimiToneType =
  | "professional"
  | "casual"
  | "academic"
  | "persuasive"
  | "creative";

export type KimiLengthType =
  | "brief"
  | "short"
  | "medium"
  | "long"
  | "comprehensive"
  | "epic";

export const KIMI_DOCUMENT_TYPES: { type: KimiDocumentType; label: string }[] = [
  { type: "article", label: "Article" },
  { type: "email", label: "Email" },
  { type: "report", label: "Report" },
  { type: "proposal", label: "Proposal" },
  { type: "blog", label: "Blog Post" },
  { type: "resume", label: "Resume / CV" },
  { type: "letter", label: "Formal Letter" },
  { type: "essay", label: "Essay" },
  { type: "memo", label: "Memo" },
  { type: "press_release", label: "Press Release" },
  { type: "whitepaper", label: "Whitepaper" },
  { type: "case_study", label: "Case Study" },
  { type: "business_plan", label: "Business Plan" },
  { type: "book_extract", label: "Book Chapter" },
  { type: "thesis", label: "Research / Thesis" },
  { type: "sop", label: "SOP / Guide" },
  { type: "contract", label: "Contract Draft" },
  { type: "creative_story", label: "Creative Story" },
];

export const KIMI_LENGTHS: { value: KimiLengthType; label: string; words: string }[] = [
  { value: "brief", label: "Brief", words: "~150 words" },
  { value: "short", label: "Short", words: "~500 words" },
  { value: "medium", label: "Medium", words: "~1,500 words" },
  { value: "long", label: "Long", words: "~3,500 words" },
  { value: "comprehensive", label: "Comprehensive", words: "~6,000 words" },
  { value: "epic", label: "Epic (Kimi)", words: "up to ~10,000 words" },
];

const LENGTH_GUIDE: Record<KimiLengthType, string> = {
  brief: "Target approximately 150 words. One focused section only.",
  short: "Target approximately 500 words with clear sections.",
  medium: "Target approximately 1,500 words with multiple sections and examples.",
  long: "Target approximately 3,500 words. Deep coverage with subsections, tables, and citations where appropriate.",
  comprehensive:
    "Target approximately 6,000 words. Publication-grade depth: TOC, multiple H2/H3 sections, data tables, and references.",
  epic:
    "Target up to 10,000 words (Kimi-class long-form). Full professional document: title page metadata, Table of Contents, numbered sections, tables, footnote-style citations [1], appendices if needed. Write continuously until the topic is exhaustively covered.",
};

const TONE_GUIDE: Record<KimiToneType, string> = {
  professional: "Professional, authoritative, precise. Suitable for executives and clients.",
  casual: "Conversational and approachable while remaining clear.",
  academic: "Scholarly tone with formal structure and citation-style references.",
  persuasive: "Compelling arguments with evidence and clear calls to action.",
  creative: "Vivid, engaging prose with literary quality where appropriate.",
};

const TYPE_PROMPTS: Record<KimiDocumentType, string> = {
  article: `Award-winning journalism: headline (#), lead, body with ## subheads, blockquotes, data in **bold**, strong conclusion.`,
  email: `Professional email: **Subject:**, salutation, scannable body, sign-off. Action items in **bold**.`,
  report: `Consulting report: # Title, ## Executive Summary (> takeaway), ## Key Findings (tables), ## Analysis, ## Recommendations, ## Conclusion.`,
  proposal: `Project proposal: overview, scope, methodology, timeline table, budget, ROI, next steps.`,
  blog: `SEO blog: keyword title, hook, ## sections, bullets, blockquote insights, CTA conclusion.`,
  resume: `Executive resume: # Name, summary blockquote, experience with metrics, education, skills table.`,
  letter: `Formal letter with addresses, Re: line, body paragraphs, closing.`,
  book_extract: `Fiction chapter: scene, dialogue, *internal thought*, --- scene breaks, cliffhanger ending.`,
  case_study: `Case study: client, challenge, approach, results table, testimonial blockquote.`,
  whitepaper: `Whitepaper: abstract, TOC, introduction, analysis with tables, findings, recommendations, references.`,
  sop: `SOP: purpose, scope, definitions table, numbered procedure steps, quality checklist.`,
  creative_story: `Literary short story with character, conflict, resolution.`,
  essay: `Structured essay: thesis in intro, argued sections, counterpoints, conclusion synthesizing evidence.`,
  memo: `Internal memo: TO/FROM/DATE/RE headers, concise bullets, decision requested.`,
  press_release: `Press release: headline, dateline, lead paragraph, quotes, boilerplate, contact block.`,
  business_plan: `Business plan: executive summary, market analysis, model, financial projections table, go-to-market, team.`,
  thesis: `Research document: abstract, literature review, methodology, findings, discussion, references [n].`,
  contract: `Contract draft: parties, recitals, numbered clauses, definitions, signatures block (not legal advice disclaimer in comments only).`,
};

const KIMI_CORE_RULES = `
KIMI-CLASS DOCUMENT RULES (mandatory):
- Output ONLY the document in Markdown — no preamble like "Here is your document".
- Include ## Table of Contents when length is medium or longer (linked section names as bullet list).
- Use # ## ### hierarchy, **bold**, *italic*, > blockquotes, tables, --- section breaks, - [ ] task lists where useful.
- Add inline citations as [1], [2] with a ## References section when making factual claims.
- Never truncate with "continued in next message" — deliver the complete document in one response.
- Match the requested length tier; for epic/comprehensive, prioritize depth over brevity.`;

export function getKimiDocumentSystemPrompt(
  type: KimiDocumentType,
  tone: KimiToneType,
  length: KimiLengthType
): string {
  return `You are ShadowTalk Document Studio — a Kimi-class professional document author.

${TYPE_PROMPTS[type]}

Tone: ${TONE_GUIDE[tone]}
Length: ${LENGTH_GUIDE[length]}
${KIMI_CORE_RULES}`;
}

export function inferDocumentTypeFromMessage(message: string): KimiDocumentType | undefined {
  const m = message.toLowerCase();
  if (/\b(email|e-mail)\b/.test(m)) return "email";
  if (/\b(resume|cv|curriculum)\b/.test(m)) return "resume";
  if (/\b(whitepaper|white\s*paper)\b/.test(m)) return "whitepaper";
  if (/\b(case\s*study)\b/.test(m)) return "case_study";
  if (/\b(business\s*plan)\b/.test(m)) return "business_plan";
  if (/\b(press\s*release)\b/.test(m)) return "press_release";
  if (/\b(proposal|rfp)\b/.test(m)) return "proposal";
  if (/\b(report|analysis)\b/.test(m)) return "report";
  if (/\b(letter|cover\s*letter)\b/.test(m)) return "letter";
  if (/\b(blog)\b/.test(m)) return "blog";
  if (/\b(essay|thesis|dissertation|research\s*paper)\b/.test(m)) return /\b(thesis|dissertation|research)\b/.test(m) ? "thesis" : "essay";
  if (/\b(book|chapter|novel|story|fiction)\b/.test(m)) return /\b(story|fiction|novel)\b/.test(m) ? "creative_story" : "book_extract";
  if (/\b(memo|memorandum)\b/.test(m)) return "memo";
  if (/\b(sop|procedure|playbook)\b/.test(m)) return "sop";
  if (/\b(contract|agreement)\b/.test(m)) return "contract";
  if (/\b(article|blog\s*post)\b/.test(m)) return "article";
  return undefined;
}

export function extractDocumentTopic(message: string): string {
  return message
    .replace(/^(?:please\s+)?(?:write|create|generate|draft|compose|make)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:professional\s+)?(?:long\s+)?(?:detailed\s+)?(?:\w+\s+){0,4}(?:document|doc|article|email|letter|report|proposal|blog\s*post|resume|cv|whitepaper|essay|memo|plan)\s*(?:about|for|on|regarding)?\s*/i, "")
    .trim() || message;
}

export const CHAT_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export interface StreamDocumentOptions {
  topic: string;
  docType: KimiDocumentType;
  tone: KimiToneType;
  length: KimiLengthType;
  additionalContext?: string;
  accessToken?: string | null;
  onChunk: (content: string) => void;
  signal?: AbortSignal;
}

/** Stream a Kimi-class document via the chat edge function. */
export async function streamKimiDocument(options: StreamDocumentOptions): Promise<string> {
  const {
    topic,
    docType,
    tone,
    length,
    additionalContext,
    accessToken,
    onChunk,
    signal,
  } = options;

  const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
  const userPrompt = `Create a ${label} about: ${topic}${
    additionalContext ? `\n\nAdditional requirements:\n${additionalContext}` : ""
  }`;

  const response = await fetch(CHAT_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: userPrompt }],
      personality: "professional",
      mode: "document",
      documentGeneration: true,
      documentType: docType,
      documentTone: tone,
      documentLength: length,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(errText || `Document generation failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const data = JSON.parse(line.slice(6));
        const text = data.choices?.[0]?.delta?.content;
        if (text) {
          content += text;
          onChunk(content);
        }
      } catch {
        /* ignore partial SSE */
      }
    }
  }

  return content;
}

/** Export markdown as Word-compatible .doc (HTML blob). */
export function downloadAsWordDoc(markdown: string, filename: string): void {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = markdown.split("\n");
  let html = "";

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("# ")) {
      html += `<h1>${escape(t.slice(2))}</h1>`;
    } else if (t.startsWith("## ")) {
      html += `<h2>${escape(t.slice(3))}</h2>`;
    } else if (t.startsWith("### ")) {
      html += `<h3>${escape(t.slice(4))}</h3>`;
    } else if (t.startsWith("> ")) {
      html += `<blockquote>${escape(t.slice(2))}</blockquote>`;
    } else if (t.startsWith("|") && t.includes("|")) {
      html += `<p>${escape(t)}</p>`;
    } else if (t === "---") {
      html += "<hr/>";
    } else if (t === "") {
      html += "<br/>";
    } else {
      const body = escape(t)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      html += `<p>${body}</p>`;
    }
  }

  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escape(filename)}</title></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
