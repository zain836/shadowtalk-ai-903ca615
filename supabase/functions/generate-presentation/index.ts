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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, slideCount, style, additionalContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = slideCount || 10;
    const requestedStyle = style || "corporate";

    // Audience detection — auto-suggest a friendlier theme when the topic/context
    // mentions children or students, even if the caller passed "corporate".
    const audienceBlob = `${topic || ""} ${additionalContext || ""}`.toLowerCase();
    const isYoungAudience = /\b(kids?|children|elementary|kindergarten|preschool|primary school|young students?|grade [1-6]\b|ages?\s*[3-9]|ages?\s*1[0-2])\b/.test(audienceBlob);
    const isAcademic = /\b(university|college|academic|researchers?|phd|graduate students?|scholars?)\b/.test(audienceBlob);
    let effectiveStyle = requestedStyle;
    if (requestedStyle === "corporate" && isYoungAudience) effectiveStyle = "creative";
    else if (requestedStyle === "corporate" && isAcademic) effectiveStyle = "academic";
    const t = THEMES[effectiveStyle] || THEMES.corporate;
    const themeAutoSwitched = effectiveStyle !== requestedStyle;

    const audienceGuidance = isYoungAudience
      ? `\n\nAUDIENCE ADAPTATION (CRITICAL): The audience is YOUNG CHILDREN / elementary students.\n- Use simple, playful language at a 2nd–4th grade reading level.\n- Replace technical percentages, citations, and jargon with friendly comparisons (e.g. "more than half of your body" instead of "55–78%").\n- Prefer big icons, emojis, bright accent colors, and short sentences (max ~12 words).\n- NO academic citations on slides. Save sources for speaker notes only.`
      : "";

    // Single powerful call with Manus-level instructions
    // The prompt forces the model to THINK like Manus: research first, then code
    const systemPrompt = `You are MANUS-LEVEL presentation designer and researcher. You follow a strict 4-phase internal process:

PHASE 1 — RESEARCH: Before writing any HTML, mentally research the topic. Gather REAL, specific data points, market sizes, growth rates, company names, and statistics. Use precise non-round numbers (e.g., $12.7B not $10B, 47.3% not 50%).

PHASE 2 — NARRATIVE: Structure a compelling story arc. Open with provocation, build tension with data, resolve with solution, close with urgency.

PHASE 3 — CODE: Design and code every slide as bespoke HTML. Each slide is a unique visual masterpiece.

PHASE 4 — POLISH: Ensure visual variety, data accuracy, and narrative flow.

RETURN ONLY VALID JSON. No markdown fences. No text before or after.

DESIGN SYSTEM:
- Canvas: 960×540px, overflow hidden
- BG: ${t.bg} | Text: ${t.text} | Muted: ${t.mutedText}
- Accent: ${t.accent} | AccentEnd: ${t.accentEnd}
- Gradient: linear-gradient(135deg, ${t.accent}, ${t.accentEnd})
- SecondaryBG: ${t.secondaryBg} | CardBG: ${t.cardBg}
- Font: 'Inter','Segoe UI',system-ui,sans-serif

CRITICAL VISUAL STANDARDS:

1. **INLINE SVG ICONS** — Every feature card, metric card, and section MUST include a relevant inline SVG icon (24-32px). Use clean geometric SVG paths:
   Shield: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
   Chart: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
   Globe: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
   Rocket: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
   Users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
   Zap: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
   Star: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
   Lock: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
   Target: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
   TrendUp: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
   Layers: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
   Choose the MOST relevant icon for each context. Create NEW SVG paths when needed.

2. **DATA VISUALIZATION** — Include SVG-based charts when presenting metrics:
   - Bar charts: <div style="display:flex;align-items:flex-end;gap:8px;height:120px;"><div style="width:40px;height:30%;background:${t.accent};border-radius:4px 4px 0 0;opacity:0.4;"></div>...</div>
   - Donut charts using SVG circle + stroke-dasharray
   - Progress bars with percentage labels
   - Metric cards with large numbers (48-56px) and ▲/▼ trend arrows
   - Growth arrows colored green for positive, red for negative

3. **CARD-BASED LAYOUTS**:
   - border-radius: 16px; padding: 24px
   - border: 1px solid ${t.accent}20
   - background: ${t.cardBg}
   - Optional: 3px solid gradient top-border
   - SVG icon + bold title + 2-3 line description

4. **CINEMATIC TITLE SLIDES**:
   - Full-bleed gradient background
   - Radial gradient overlays for depth
   - Large bold typography (48-56px, weight 900)
   - Decorative abstract shapes (SVG circles, lines)
   - Subtle tagline (18px, opacity 0.8)

5. **COMPARISON TABLES**:
   - Gradient header row
   - Alternating row backgrounds
   - ✓ in green (#16A34A), ✗ in red (#DC2626) for status
   - Bold key differentiators

6. **TIMELINES/ROADMAPS**:
   - Connected nodes with SVG lines/circles
   - Color-coded: green (#16A34A)=done, blue (#2563EB)=active, gray (#94A3B8)=upcoming
   - Phase labels with bold headers and bullet items

LAYOUT RULES:
- Root: <div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter','Segoe UI',system-ui,sans-serif;">
- ALL styles MUST be inline. Use SINGLE QUOTES for HTML attributes (e.g. style='color:red;font-size:20px;') so they don't conflict with the JSON double-quotes wrapping the html field. NEVER use double quotes inside the html string.
- NO <style> tags, NO CSS classes, NO external resources
- Use flexbox (display:flex) and grid (display:grid) for layouts
- Generous padding (40-60px) and consistent spacing
- Every slide MUST be visually UNIQUE — no two should look similar

CONTENT QUALITY:
- Bold, provocative titles ("The $87B Blind Spot in Healthcare", not "Healthcare Overview")
- Specific data with precise numbers and sources ($12.7M ARR, 47.3% adoption rate, 52,504+ active users)
- Real company names and research citations
- Short punchy descriptions (2-3 lines max per card)
- Speaker notes: 4-6 sentences with delivery cues and transitions

SLIDE COUNT (STRICT): You MUST output EXACTLY ${count} slides — no more, no less. Plan the narrative arc to fit precisely into ${count} slides. If a topic has more ideas than ${count} slides, MERGE related concepts. If fewer, expand with deeper detail. Count your slides before returning.

VISUAL–DATA CONSISTENCY (STRICT): Whenever a slide states a NUMBER or RANGE in the text (e.g. "5–8 glasses", "3 steps", "7 benefits"), the icon/visual representation MUST match that number exactly. For ranges like "5–8", render the MAXIMUM (8 icons) and visually highlight the MINIMUM (5 filled, 3 outlined) — never reverse this. Never let icon counts contradict the written number.${audienceGuidance}

SLIDE SEQUENCE (${count} slides, narrative arc — adapt to fit EXACTLY ${count}):
1. Title — Cinematic, full-gradient, bold provocative positioning statement
2. Problem — What's broken, backed by hard data
3. Solution overview — 3 key pillars with icon cards
4. Feature deep-dive — 2×2 or 3×1 feature grid with SVG icons
5. Comparison — Styled table vs competitors/status quo
6. Market opportunity — Charts, market size data visualizations
7. Traction/metrics — Large number callouts with trends
8. Business model / Pricing — Tier cards or table
9. Roadmap — Phased timeline with status indicators
10. Closing/CTA — Cinematic, contact info, next steps
Adapt this to ${count} slides. Merge or split as needed. FINAL OUTPUT MUST CONTAIN EXACTLY ${count} SLIDE OBJECTS.

OUTPUT FORMAT:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "layout": "descriptive_name",
      "html": "<div style=\\"width:960px;height:540px;overflow:hidden;position:relative;...\\">...COMPLETE coded slide with SVG icons, charts, cards...</div>",
      "speakerNotes": "4-6 sentences...",
      "content": { ... structured fallback for PPTX export ... }
    }
  ],
  "metadata": {
    "estimatedDuration": ${count * 2},
    "targetAudience": "...",
    "keyTakeaways": ["...", "...", "..."],
    "researchSources": ["...", "...", "..."]
  }
}

For "content" field (PPTX fallback):
- title/closing: { tagline, presenter, date } or { heading, cta, nextSteps: [] }
- bullets: { heading, bullets: [] }
- stats: { stats: [{ value, label, change }] }
- comparison: { items: [{ name, pros: [], cons: [] }] }
- Others: { heading, paragraphs: [] }`;

    console.log("Generating Manus-quality presentation...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a MANUS-QUALITY coded presentation about: ${topic}${additionalContext ? `\n\nContext: ${additionalContext}` : ''}\n\nIMPORTANT PROCESS:\n1. First RESEARCH the topic — gather real market data, statistics, company names, growth rates. Use precise numbers.\n2. Then STRUCTURE a compelling narrative arc with tension and resolution.\n3. Then CODE every slide as unique bespoke HTML with inline SVG icons, data visualizations, gradient cards, and cinematic layouts.\n4. Each slide MUST be visually distinct. No two slides should use the same layout pattern.\n\nGenerate exactly ${count} slides. Every slide must have complete custom HTML.` },
        ],
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '';
    if (!raw) throw new Error("Empty response from AI model");
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    // Strip control characters
    raw = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    console.log("AI response length:", raw.length);

    // Robust JSON parse: AI often emits inline HTML with unescaped double-quotes
    // (e.g. style="..."). Try strict first, then fall back to a single-pass
    // repair that escapes stray quotes/newlines/tabs inside string values only.
    function repairJsonString(input: string): string {
      let out = "";
      let inString = false;
      let escaped = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (!inString) {
          if (ch === '"') { inString = true; out += ch; continue; }
          out += ch;
          continue;
        }
        // Inside a string
        if (escaped) { out += ch; escaped = false; continue; }
        if (ch === '\\') { out += ch; escaped = true; continue; }
        if (ch === '"') {
          // Decide if this " ends the string. Look at the next non-space char.
          let j = i + 1;
          while (j < input.length && (input[j] === ' ' || input[j] === '\t')) j++;
          const next = input[j];
          if (next === ',' || next === '}' || next === ']' || next === ':' || next === '\n' || next === '\r' || next === undefined) {
            inString = false;
            out += ch;
          } else {
            // Stray inner quote — escape it
            out += '\\"';
          }
          continue;
        }
        if (ch === '\n') { out += '\\n'; continue; }
        if (ch === '\r') { out += '\\r'; continue; }
        if (ch === '\t') { out += '\\t'; continue; }
        out += ch;
      }
      return out;
    }

    let presentation: any;
    try {
      presentation = JSON.parse(raw);
    } catch (firstErr) {
      console.warn("Initial JSON.parse failed, attempting repair:", (firstErr as Error).message);
      const repaired = repairJsonString(raw);
      try {
        presentation = JSON.parse(repaired);
        console.log("Repaired JSON parsed successfully");
      } catch (secondErr) {
        console.error("Repair also failed:", (secondErr as Error).message);
        throw new Error("AI returned malformed JSON. Please regenerate.");
      }
    }

    // Validate and fix slides
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        if (!slide.html) {
          const isAccent = slide.layout === 'title' || slide.layout === 'closing';
          const bg = isAccent ? `background:linear-gradient(135deg,${t.accent},${t.accentEnd});color:#fff;` : `background:${t.bg};color:${t.text};`;
          slide.html = `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bg}font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;"><h1 style="font-size:42px;font-weight:900;margin-bottom:16px;">${slide.title || 'Untitled'}</h1>${slide.subtitle ? `<p style="font-size:18px;opacity:0.8;">${slide.subtitle}</p>` : ''}</div>`;
        }
        if (!slide.content || Object.keys(slide.content).length === 0) {
          if (slide.layout === 'title') slide.content = { tagline: slide.subtitle || "", presenter: "ShadowTalk AI", date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
          else if (slide.layout === 'closing') slide.content = { heading: slide.subtitle || "", cta: "Get Started", nextSteps: ["Review findings", "Schedule follow-up"] };
          else slide.content = { heading: slide.subtitle || slide.title, paragraphs: [slide.speakerNotes || ""] };
        }
        return slide;
      });
    }

    // STRICT slide-count enforcement — trim or pad to exactly `count` slides
    if (Array.isArray(presentation.slides)) {
      if (presentation.slides.length > count) {
        presentation.slides = presentation.slides.slice(0, count);
      } else if (presentation.slides.length < count) {
        const pad = count - presentation.slides.length;
        for (let i = 0; i < pad; i++) {
          presentation.slides.push({
            title: `Additional Insights ${i + 1}`,
            layout: "bullets",
            html: `<div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:60px;"><h2 style="font-size:36px;font-weight:800;margin-bottom:16px;color:${t.accent};">Additional Insights</h2><p style="font-size:18px;color:${t.mutedText};">Expand on the topic with further detail in the editor.</p></div>`,
            content: { heading: "Additional Insights", paragraphs: ["Add your own content here."] },
            speakerNotes: "Placeholder slide added to satisfy the requested slide count.",
          });
        }
      }
    }

    presentation.metadata = {
      ...(presentation.metadata || {}),
      effectiveStyle,
      themeAutoSwitched,
      requestedStyle,
      audienceTier: isYoungAudience ? "young" : isAcademic ? "academic" : "general",
    };

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
