import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THEMES: Record<string, { bg: string; accent: string; accentEnd: string; text: string; secondaryBg: string; cardBg: string; mutedText: string }> = {
  corporate: { bg: "#FFFFFF", accent: "#1E40AF", accentEnd: "#3B82F6", text: "#111827", secondaryBg: "#F3F4F6", cardBg: "#F8FAFC", mutedText: "#6B7280" },
  startup: { bg: "#0F172A", accent: "#8B5CF6", accentEnd: "#EC4899", text: "#F8FAFC", secondaryBg: "#1E293B", cardBg: "#1E293B", mutedText: "#94A3B8" },
  academic: { bg: "#FFFBEB", accent: "#92400E", accentEnd: "#D97706", text: "#1C1917", secondaryBg: "#FEF3C7", cardBg: "#FFFDF7", mutedText: "#78716C" },
  creative: { bg: "#FDF2F8", accent: "#DB2777", accentEnd: "#F97316", text: "#1F2937", secondaryBg: "#FCE7F3", cardBg: "#FFF1F2", mutedText: "#9CA3AF" },
  minimal: { bg: "#FAFAFA", accent: "#18181B", accentEnd: "#52525B", text: "#18181B", secondaryBg: "#F4F4F5", cardBg: "#FFFFFF", mutedText: "#71717A" },
  dark_elegance: { bg: "#09090B", accent: "#FBBF24", accentEnd: "#F59E0B", text: "#FAFAFA", secondaryBg: "#18181B", cardBg: "#1C1C1E", mutedText: "#A1A1AA" },
};

async function callAI(apiKey: string, messages: { role: string; content: string }[], temperature = 0.7) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-pro", messages, temperature }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again shortly." };
    if (response.status === 402) throw { status: 402, message: "Credits exhausted. Please add funds." };
    const errText = await response.text();
    console.error("AI error:", response.status, errText);
    throw { status: 500, message: "AI gateway error" };
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function cleanJSON(raw: string): string {
  return raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

// PHASE 1: Research the topic — gather real data, stats, competitors, trends
function buildResearchPrompt(topic: string, additionalContext?: string): { role: string; content: string }[] {
  return [
    { role: "system", content: `You are a world-class research analyst. Your job is to gather comprehensive, REAL data about a topic for a presentation. Return ONLY valid JSON, no markdown fences.

OUTPUT FORMAT:
{
  "topicAnalysis": {
    "coreProblem": "What problem or opportunity does this topic address?",
    "targetAudience": "Who cares about this topic and why?",
    "industryContext": "What industry/domain does this belong to?"
  },
  "keyMetrics": [
    { "value": "$12.7B", "label": "Market Size 2025", "source": "Grand View Research", "change": "▲ 23.4% CAGR" }
  ],
  "competitors": [
    { "name": "Company A", "strengths": ["..."], "weaknesses": ["..."] }
  ],
  "trends": ["Trend 1 with specific data", "Trend 2 with specific data"],
  "keyPlayers": ["Player 1", "Player 2"],
  "researchSources": ["Source 1", "Source 2", "Source 3"],
  "provocativeInsights": ["A bold, non-obvious insight backed by data", "Another contrarian take"],
  "statistics": [
    { "stat": "47.3% of enterprises...", "source": "Gartner 2025" }
  ]
}

RULES:
- Use REAL, specific, recent data points (not round numbers)
- Include actual company names, research firms, and citations
- Be provocative and insightful, not generic
- Minimum 6 key metrics, 4 competitors, 5 trends, 8 statistics` },
    { role: "user", content: `Research this topic thoroughly for a high-stakes presentation: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ''}` }
  ];
}

// PHASE 2: Build narrative outline using research
function buildOutlinePrompt(topic: string, research: string, slideCount: number): { role: string; content: string }[] {
  return [
    { role: "system", content: `You are a McKinsey-tier presentation strategist. Using the research provided, create a compelling narrative arc for a ${slideCount}-slide presentation. Return ONLY valid JSON, no markdown fences.

NARRATIVE PRINCIPLES:
- Open with a BOLD provocative statement, not a generic title
- Every slide must have ONE clear takeaway
- Data-heavy: every claim backed by a specific number
- Build tension: Problem → Solution → Proof → Future
- End with urgency and clear next steps

OUTPUT FORMAT:
{
  "title": "Provocative Presentation Title (not generic)",
  "narrativeArc": "One sentence describing the story arc",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Bold Slide Title",
      "subtitle": "Supporting context",
      "layout": "layout_type",
      "purpose": "What this slide achieves in the narrative",
      "keyData": ["Specific data point 1", "Specific data point 2"],
      "visualDirection": "Description of ideal visual treatment",
      "speakerNotes": "4-6 sentences with delivery cues"
    }
  ],
  "metadata": {
    "estimatedDuration": ${slideCount * 2},
    "targetAudience": "...",
    "keyTakeaways": ["...", "...", "..."]
  }
}

AVAILABLE LAYOUTS: title, feature_grid, metrics, comparison_table, bullets, timeline, roadmap, kpi_dashboard, process_flow, two_column, closing, data_visualization, case_study, quote_highlight

SLIDE SEQUENCE STRATEGY:
1. Title — Cinematic, provocative positioning
2-3. Problem/Context — What's broken, with hard data
4-5. Solution — Key pillars with icon-worthy features
6. Deep-dive — Feature grid or process flow
7. Comparison — vs. status quo or competitors
8. Traction/Metrics — Large number callouts with trends
9. Roadmap/Future — Phased timeline
${slideCount}. Closing — Urgent CTA with next steps` },
    { role: "user", content: `Create a ${slideCount}-slide narrative for: "${topic}"\n\nRESEARCH DATA:\n${research}` }
  ];
}

// PHASE 3: Code every slide as bespoke HTML
function buildSlideCodePrompt(topic: string, outline: string, t: typeof THEMES.corporate): { role: string; content: string }[] {
  return [
    { role: "system", content: `You are MANUS-LEVEL presentation designer. You CODE every slide as bespoke, unique HTML. Each slide is a visual masterpiece with inline SVG icons, data visualizations, gradient cards, and cinematic layouts.

RETURN ONLY VALID JSON. No markdown fences. No text before or after.

DESIGN SYSTEM:
- Canvas: 960px × 540px, overflow hidden
- Background: ${t.bg}
- Text: ${t.text}  |  Muted: ${t.mutedText}
- Accent: ${t.accent}  |  Accent End: ${t.accentEnd}
- Gradient: linear-gradient(135deg, ${t.accent}, ${t.accentEnd})
- Secondary BG: ${t.secondaryBg}  |  Card BG: ${t.cardBg}
- Font: 'Inter', 'Segoe UI', system-ui, sans-serif

CRITICAL VISUAL STANDARDS:

1. **INLINE SVG ICONS** — Every card MUST include a contextual inline SVG icon (24-32px). Use clean geometric paths:
   - Shield: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
   - Chart: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
   - Globe: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
   - Rocket: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
   - Users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
   - Zap: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
   - Star: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
   - Lock: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
   - Target: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
   - TrendUp: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
   - Layers: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
   Choose the MOST RELEVANT icon for each context. Create new SVG paths when needed.

2. **DATA VISUALIZATION** — SVG-based charts for metrics:
   - Bar charts with gradient fills and labels
   - Donut/ring charts using SVG circles with stroke-dasharray
   - Progress bars with percentage labels
   - Trend lines using SVG polylines
   - Metric cards with large numbers and ▲/▼ trend arrows

3. **CARD LAYOUTS** — Feature/metric cards with:
   - border-radius: 16px, padding: 24px
   - Subtle border: 1px solid ${t.accent}20
   - Background: ${t.cardBg}
   - Accent top-border: 3px solid with gradient
   - SVG icon + bold title + description

4. **CINEMATIC TITLE SLIDES** — Full-bleed gradient with:
   - Radial gradient overlays for depth
   - Large bold typography (48-56px, weight 900)
   - Decorative abstract shapes using SVG
   - Subtle tagline (18px, opacity 0.8)

5. **COMPARISON TABLES** — Styled with:
   - Gradient header row
   - Alternating row backgrounds
   - ✓ (green) and ✗ (red) status indicators
   - Bold differentiators

6. **TIMELINES/ROADMAPS** — Using:
   - Connected nodes with SVG lines
   - Color-coded status (green=done, blue=active, gray=upcoming)
   - Phase labels with bold headers

LAYOUT RULES:
- Root: <div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter','Segoe UI',system-ui,sans-serif;">
- ALL styles MUST be inline (style="...")
- NO <style> tags, NO CSS classes, NO external resources
- Use flexbox and CSS grid for layouts
- Generous padding (40-60px)
- Every slide MUST be visually UNIQUE — no two slides should look alike

CONTENT RULES:
- Use the EXACT data from the outline (don't invent new numbers)
- Bold, provocative titles
- Specific metrics with precise numbers
- Short punchy descriptions (2-3 lines max per card)

OUTPUT FORMAT:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "layout": "descriptive_name",
      "html": "<div style=\\"width:960px;height:540px;overflow:hidden;position:relative;...\\">...COMPLETE coded slide...</div>",
      "speakerNotes": "4-6 sentences...",
      "content": { ... structured fallback for PPTX export ... }
    }
  ],
  "metadata": {
    "estimatedDuration": N,
    "targetAudience": "...",
    "keyTakeaways": ["...", "...", "..."],
    "researchSources": ["...", "...", "..."]
  }
}

For "content" field (PPTX fallback), include structured data matching the layout:
- title/closing: { tagline, presenter, date } or { heading, cta, nextSteps: [] }
- bullets: { heading, bullets: [] }
- stats/metrics: { stats: [{ value, label, change }] }
- comparison: { items: [{ name, pros: [], cons: [] }] }
- Others: { heading, paragraphs: [] }` },
    { role: "user", content: `Code every slide as BESPOKE HTML for: "${topic}"\n\nNARRATIVE OUTLINE:\n${outline}\n\nEvery slide MUST have unique, custom-coded HTML with inline SVG icons, data visualizations, and cinematic layouts. Each slide should be a unique visual masterpiece. Use the EXACT data from the outline.` }
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, slideCount, style, additionalContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = slideCount || 10;
    const t = THEMES[style || "corporate"] || THEMES.corporate;

    // ========== PHASE 1: RESEARCH ==========
    console.log("Phase 1: Researching topic...");
    const researchRaw = await callAI(LOVABLE_API_KEY, buildResearchPrompt(topic, additionalContext), 0.6);
    const research = cleanJSON(researchRaw);
    console.log("Research complete, length:", research.length);

    // ========== PHASE 2: NARRATIVE OUTLINE ==========
    console.log("Phase 2: Building narrative outline...");
    const outlineRaw = await callAI(LOVABLE_API_KEY, buildOutlinePrompt(topic, research, count), 0.65);
    const outline = cleanJSON(outlineRaw);
    console.log("Outline complete, length:", outline.length);

    // ========== PHASE 3: CODE EVERY SLIDE ==========
    console.log("Phase 3: Coding slides as bespoke HTML...");
    const slidesRaw = await callAI(LOVABLE_API_KEY, buildSlideCodePrompt(topic, outline, t), 0.75);
    const slidesClean = cleanJSON(slidesRaw);
    console.log("Slides coded, length:", slidesClean.length);

    // ========== PHASE 4: PARSE & POLISH ==========
    console.log("Phase 4: Polishing...");
    const presentation = JSON.parse(slidesClean);

    // Inject research sources into metadata
    try {
      const researchData = JSON.parse(research);
      if (researchData.researchSources && presentation.metadata) {
        presentation.metadata.researchSources = researchData.researchSources;
      }
    } catch { /* research parse failed, non-critical */ }

    // Validate and fix slides
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        if (!slide.html) {
          const isAccentBg = slide.layout === 'title' || slide.layout === 'closing';
          const bgStyle = isAccentBg
            ? `background:linear-gradient(135deg, ${t.accent}, ${t.accentEnd});color:#fff;`
            : `background:${t.bg};color:${t.text};`;
          slide.html = `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bgStyle}font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;">
            <h1 style="font-size:42px;font-weight:900;margin-bottom:16px;letter-spacing:-1px;">${slide.title || 'Untitled'}</h1>
            ${slide.subtitle ? `<p style="font-size:18px;opacity:0.8;font-weight:300;">${slide.subtitle}</p>` : ''}
          </div>`;
        }

        if (!slide.content || Object.keys(slide.content).length === 0) {
          switch (slide.layout) {
            case 'title':
              slide.content = { tagline: slide.subtitle || "", presenter: "ShadowTalk AI", date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
              break;
            case 'closing':
              slide.content = { heading: slide.subtitle || "", cta: "Get Started", nextSteps: ["Review findings", "Schedule follow-up"] };
              break;
            default:
              slide.content = { heading: slide.subtitle || slide.title, paragraphs: [slide.speakerNotes || ""] };
          }
        }
        return slide;
      });
    }

    return new Response(JSON.stringify(presentation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-presentation error:", e);
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
