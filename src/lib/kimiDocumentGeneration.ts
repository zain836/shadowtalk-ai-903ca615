/**
 * Kimi-style long-form document generation for ShadowTalk.
 * Publication-quality markdown, TOC, tables, citations.
 */

import {
  PROFESSIONAL_DOCUMENT_STANDARDS,
  polishProfessionalMarkdown,
} from "./professionalDocument";

export type KimiDocumentType =
  | "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter"
  | "book_extract" | "case_study" | "whitepaper" | "sop" | "creative_story"
  | "essay" | "memo" | "press_release" | "business_plan" | "thesis" | "contract";

export type KimiToneType =
  | "professional" | "casual" | "academic" | "persuasive" | "creative";

export type KimiLengthType =
  | "brief" | "short" | "medium" | "long" | "comprehensive" | "epic";

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
  { value: "medium", label: "Standard", words: "~1,500 words" },
  { value: "long", label: "Long", words: "~3,500 words" },
  { value: "comprehensive", label: "Comprehensive", words: "~6,000 words" },
  { value: "epic", label: "Epic", words: "up to ~10,000 words" },
];

const LENGTH_GUIDE: Record<KimiLengthType, string> = {
  brief: "Approximately 150 words.",
  short: "Approximately 500 words.",
  medium: "Approximately 1,500 words with TOC and 4–6 sections.",
  long: "Approximately 3,500 words with tables and references.",
  comprehensive: "Approximately 6,000 words — board-ready, fully structured.",
  epic: "Up to 10,000 words — exhaustive but still tight prose (no filler paragraphs).",
};

const TONE_GUIDE: Record<KimiToneType, string> = {
  professional: "Formal business English. Neutral, authoritative, client-ready.",
  casual: "Clear and approachable but still polished — no slang.",
  academic: "Scholarly register with formal structure and References section.",
  persuasive: "Evidence-led argumentation with explicit recommendations.",
  creative: "Literary quality permitted; still clean formatting.",
};

export function getKimiDocumentSystemPrompt(
  type: KimiDocumentType,
  tone: KimiToneType,
  length: KimiLengthType
): string {
  return `You are a senior document specialist producing client-ready deliverables.

Document type: ${type}
Tone: ${TONE_GUIDE[tone]}
Length: ${LENGTH_GUIDE[length]}
${PROFESSIONAL_DOCUMENT_STANDARDS}`;
}

export function inferDocumentTypeFromMessage(message: string): KimiDocumentType | undefined {
  const m = message.toLowerCase();
  if (/\b(email|e-mail)\b/.test(m)) return "email";
  if (/\b(resume|cv)\b/.test(m)) return "resume";
  if (/\bwhitepaper\b/.test(m)) return "whitepaper";
  if (/\bcase\s*study\b/.test(m)) return "case_study";
  if (/\bbusiness\s*plan\b/.test(m)) return "business_plan";
  if (/\bpress\s*release\b/.test(m)) return "press_release";
  if (/\bproposal\b/.test(m)) return "proposal";
  if (/\breport\b/.test(m)) return "report";
  if (/\bletter\b/.test(m)) return "letter";
  if (/\bblog\b/.test(m)) return "blog";
  if (/\b(thesis|dissertation|research\s+paper)\b/.test(m)) return "thesis";
  if (/\bessay\b/.test(m)) return "essay";
  if (/\b(book|chapter)\b/.test(m)) return "book_extract";
  if (/\b(story|fiction|novel)\b/.test(m)) return "creative_story";
  if (/\bmemo\b/.test(m)) return "memo";
  if (/\bsop\b/.test(m)) return "sop";
  if (/\bcontract\b/.test(m)) return "contract";
  if (/\barticle\b/.test(m)) return "article";
  return undefined;
}

export function extractDocumentTopic(message: string): string {
  return message
    .replace(/^(?:please\s+)?(?:write|create|generate|draft|compose|make)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:professional\s+)?(?:\w+\s+){0,5}(?:document|doc|article|email|letter|report|proposal|whitepaper|essay|memo|plan)\s*(?:about|for|on|regarding)?\s*/i, "")
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

export async function streamKimiDocument(options: StreamDocumentOptions): Promise<string> {
  const { topic, docType, tone, length, additionalContext, accessToken, onChunk, signal } = options;

  const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
  const userPrompt = `Produce a publication-ready ${label} for executive review.

Topic: ${topic}
${additionalContext ? `\nRequirements:\n${additionalContext}` : ""}

The output must be clean Markdown only — suitable for immediate export to Word or PDF.`;

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
      } catch { /* partial SSE */ }
    }
  }

  const polished = polishProfessionalMarkdown(content, { tone });
  onChunk(polished);
  return polished;
}

const WORD_DOC_STYLES = `
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 7in; margin: 1in auto; }
h1 { font-size: 22pt; font-weight: 700; margin: 0 0 6pt; border-bottom: 1pt solid #ccc; padding-bottom: 8pt; }
h2 { font-size: 14pt; font-weight: 700; margin: 24pt 0 8pt; color: #222; }
h3 { font-size: 12pt; font-weight: 600; margin: 16pt 0 6pt; }
p { margin: 0 0 10pt; text-align: justify; }
blockquote { margin: 12pt 0; padding: 8pt 16pt; border-left: 3pt solid #666; background: #f7f7f7; color: #444; }
table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 10pt; }
th, td { border: 1pt solid #ccc; padding: 6pt 10pt; text-align: left; }
th { background: #f0f0f0; font-weight: 600; }
hr { border: none; border-top: 1pt solid #ddd; margin: 24pt 0; }
ul, ol { margin: 0 0 10pt; padding-left: 24pt; }
`;

export function downloadAsWordDoc(markdown: string, filename: string): void {
  const clean = polishProfessionalMarkdown(markdown, { tone: "professional" });
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = "";
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    html += "<table>";
    tableRows.forEach((row, i) => {
      const cells = row.split("|").map((c) => c.trim()).filter((c) => c && !/^[-:]+$/.test(c));
      if (!cells.length) return;
      const tag = i === 0 ? "th" : "td";
      html += "<tr>" + cells.map((c) => `<${tag}>${escape(c.replace(/\*\*/g, ""))}</${tag}>`).join("") + "</tr>";
    });
    html += "</table>";
    tableRows = [];
    inTable = false;
  };

  for (const line of clean.split("\n")) {
    const t = line.trim();
    if (t.startsWith("|")) {
      inTable = true;
      tableRows.push(t);
      continue;
    }
    if (inTable) flushTable();

    if (t.startsWith("# ")) html += `<h1>${escape(t.slice(2))}</h1>`;
    else if (t.startsWith("## ")) html += `<h2>${escape(t.slice(3))}</h2>`;
    else if (t.startsWith("### ")) html += `<h3>${escape(t.slice(4))}</h3>`;
    else if (t.startsWith("> ")) html += `<blockquote>${escape(t.slice(2))}</blockquote>`;
    else if (t === "---") html += "<hr/>";
    else if (t === "") html += "";
    else {
      const body = escape(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
      html += `<p>${body}</p>`;
    }
  }
  if (inTable) flushTable();

  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${WORD_DOC_STYLES}</style></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
