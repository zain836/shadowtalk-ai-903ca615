/**
 * Publication-quality document standards, markdown polish, and preview styling.
 */

export const PROFESSIONAL_DOCUMENT_STANDARDS = `
PUBLICATION-QUALITY STANDARDS (strict — violations make the document unacceptable):

VOICE & CONTENT
- Write in clear, formal business English (US). No slang, no hype, no filler.
- Every paragraph must advance the argument; delete throat-clearing and repetition.
- Prefer short sentences (15–22 words average). One idea per paragraph.
- Use concrete nouns and strong verbs; avoid "very", "really", "things", "stuff", "leverage" (as buzzword).

FORBIDDEN (never include)
- Opening filler: "Sure!", "Here is", "I'd be happy to", "Below is", "This document aims to"
- Emojis, hashtags, exclamation marks (except direct quotes)
- Meta commentary about being an AI or about the writing process
- Placeholder text: [TBD], [Insert X], lorem ipsum, "your company name" unless user provided blanks
- Multiple H1 titles — exactly ONE # title at the top
- Random bolding of entire sentences

STRUCTURE (McKinsey / Big Four report style)
- Line 1: # Document Title (specific, not generic)
- Line 2: *Subtitle or one-line metadata* (date, audience, or scope — italic only)
- Optional: ## Table of Contents (bullet list of ## section names) for medium+ length
- Body: ## for major sections, ### for subsections only when needed
- Open reports with ## Executive Summary (3–5 tight sentences in a blockquote or short paragraphs)
- End reports with ## Conclusion or ## Recommendations (numbered list for actions)
- Use GFM tables with aligned headers — never broken pipe rows

FORMATTING
- Blank line before every heading and after every heading
- Lists: consistent "-" bullets; numbered "1." for sequential steps only
- Blockquotes (> ) only for pull quotes, executive summary highlight, or key callouts — max 2 per section
- Horizontal rules (---) only between major parts, not after every section
- Citations: superscript-style [1] in text; ## References at end with numbered sources

OUTPUT
- Return ONLY the finished Markdown document. Nothing before or after it.`;

/** Tailwind classes for clean print-style document preview */
export const DOCUMENT_PROSE_CLASS =
  "prose prose-sm max-w-none " +
  "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100 " +
  "prose-h1:text-2xl prose-h1:mb-2 prose-h1:pb-3 prose-h1:border-b prose-h1:border-neutral-200 dark:prose-h1:border-neutral-700 " +
  "prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-neutral-800 dark:prose-h2:text-neutral-200 " +
  "prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 " +
  "prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-[1.75] prose-p:my-3 " +
  "prose-li:text-neutral-700 dark:prose-li:text-neutral-300 prose-li:my-1 " +
  "prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100 prose-strong:font-semibold " +
  "prose-blockquote:border-l-neutral-400 prose-blockquote:bg-neutral-50 dark:prose-blockquote:bg-neutral-900/50 " +
  "prose-blockquote:text-neutral-600 dark:prose-blockquote:text-neutral-400 prose-blockquote:not-italic prose-blockquote:py-2 prose-blockquote:px-4 " +
  "prose-table:text-sm prose-th:bg-neutral-100 dark:prose-th:bg-neutral-800 prose-th:font-semibold prose-td:border-neutral-200 dark:prose-td:border-neutral-700 " +
  "prose-hr:border-neutral-200 dark:prose-hr:border-neutral-700 prose-hr:my-8";

const PREAMBLE_PATTERNS = [
  /^(?:sure[!,.]?|certainly[!,.]?|of course[!,.]?|here(?:'s| is)|below is|i(?:'d| will) be happy to)[^\n]*\n+/i,
  /^(?:#+\s*)?(?:draft|generated)\s+(?:document|report)[^\n]*\n+/i,
];

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

export interface PolishOptions {
  tone?: "professional" | "casual" | "academic" | "persuasive" | "creative";
  stripEmojis?: boolean;
}

/** Clean AI markdown into publication-ready shape (client-safe). */
export function polishProfessionalMarkdown(
  raw: string,
  options: PolishOptions = {}
): string {
  const tone = options.tone ?? "professional";
  let text = raw.trim();

  // Unwrap fenced markdown blocks
  const fenced = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)```\s*$/i);
  if (fenced) text = fenced[1].trim();

  for (const pattern of PREAMBLE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  if (tone === "professional" || tone === "academic" || options.stripEmojis !== false) {
    if (tone !== "creative") {
      text = text.replace(EMOJI_REGEX, "");
    }
  }

  // Normalize line endings and excessive blank lines
  text = text.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n");
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // Ensure starts with a title
  if (!text.startsWith("#")) {
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine && firstLine.length < 120) {
      text = `# ${firstLine.replace(/^#+\s*/, "")}\n\n${text.slice(firstLine.length).trim()}`;
    }
  }

  // Demote extra H1s to H2
  let h1Count = 0;
  text = text
    .split("\n")
    .map((line) => {
      if (/^# [^#]/.test(line)) {
        h1Count++;
        if (h1Count > 1) return line.replace(/^# /, "## ");
      }
      return line;
    })
    .join("\n");

  return text.trim();
}
