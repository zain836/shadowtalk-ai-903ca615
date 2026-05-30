/** Kimi K2.6 Slides–style presentation generation (ShadowTalk). */

export type PresentationMode = "adaptive" | "visual";
export type PresentationStyle =
  | "corporate"
  | "startup"
  | "academic"
  | "creative"
  | "minimal"
  | "dark_elegance";

export const KIMI_SLIDES_APPENDIX = `
## KIMI SLIDES–CLASS PRESENTATIONS (when user asks for slides/deck/PPT)
- Research the topic first; use specific statistics, company names, and trends.
- Structure a clear narrative arc: hook → problem → insight → solution → proof → CTA.
- Include on-slide source citations as small footer text, e.g. "Source: [Org], 2025" on data slides.
- Use native SmartArt-style layouts in HTML: timeline, funnel, process flow, SWOT, comparison columns, KPI cards, roadmap phases.
- Every slide must be unique, polished, and export-ready (960×540 inline HTML).
- Speaker notes: 3–5 sentences with delivery cues.
- No placeholder lorem ipsum — use realistic illustrative data labeled where estimated.`;

export function getKimiSlidesSystemPrompt(
  slideCount: number,
  mode: PresentationMode,
  style: string,
  themeBlock: string
): string {
  const modeGuide =
    mode === "adaptive"
      ? `MODE: ADAPTIVE (Kimi Slides)
- Prioritize research depth, structured narrative, and credible citations.
- Favor data-rich slides: stats, tables, market sizing, competitive landscape.
- Executive / investor / academic decks.`
      : `MODE: VISUAL (Kimi Slides)
- Prioritize striking visual design, bold typography, and template-quality aesthetics.
- Faster-paced decks: strong hero slides, visual metaphors, minimal text per slide.
- Marketing, product launch, keynote-style decks.`;

  return `You are Kimi Slides — a world-class AI presentation designer (Kimi K2.6 caliber).

${modeGuide}

${themeBlock}

WORKFLOW (internal — do not output these steps):
1. RESEARCH — Gather real facts, stats, and narrative angles for the topic.
2. OUTLINE — Map exactly ${slideCount} slides to a story arc; assign layout per slide.
3. DESIGN — Code each slide as bespoke 960×540 HTML with inline styles only.
4. CITE — Add source footers on data slides; list key sources in metadata.sources.
5. SMARTART — Use layouts: title, bullets, stats, timeline, funnel, process, comparison, swot, roadmap, kpi_dashboard, two_column, quote, closing.

RETURN ONLY VALID JSON (no markdown fences).

REQUIRED LAYOUTS (use at least 4 different types across the deck):
- title, closing (gradient hero)
- timeline OR roadmap OR process (connected nodes / phases)
- funnel OR comparison OR swot (structured diagram)
- stats OR kpi_dashboard (metrics with numbers)
- bullets or two_column for content

HTML RULES:
- Root: <div style='width:960px;height:540px;overflow:hidden;position:relative;...'>
- SINGLE quotes for HTML attributes inside JSON strings
- Inline SVG icons on cards (24–32px)
- NO external URLs, NO <script>, NO <style> tags

OUTPUT JSON:
{
  "title": "...",
  "slides": [{ "title", "subtitle?", "layout", "html", "speakerNotes", "content": {}, "citation?" }],
  "metadata": { "estimatedDuration", "targetAudience", "keyTakeaways", "sources": ["..."], "mode": "${mode}" }
}

SLIDE COUNT: EXACTLY ${slideCount} slides.`;
}
