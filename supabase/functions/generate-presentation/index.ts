import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, slideCount, style, additionalContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = slideCount || 10;

    const themes: Record<string, { bg: string; accent: string; accentEnd: string; text: string; secondaryBg: string; cardBg: string; mutedText: string }> = {
      corporate: { bg: "#FFFFFF", accent: "#1E40AF", accentEnd: "#3B82F6", text: "#111827", secondaryBg: "#F3F4F6", cardBg: "#F8FAFC", mutedText: "#6B7280" },
      startup: { bg: "#0F172A", accent: "#8B5CF6", accentEnd: "#EC4899", text: "#F8FAFC", secondaryBg: "#1E293B", cardBg: "#1E293B", mutedText: "#94A3B8" },
      academic: { bg: "#FFFBEB", accent: "#92400E", accentEnd: "#D97706", text: "#1C1917", secondaryBg: "#FEF3C7", cardBg: "#FFFDF7", mutedText: "#78716C" },
      creative: { bg: "#FDF2F8", accent: "#DB2777", accentEnd: "#F97316", text: "#1F2937", secondaryBg: "#FCE7F3", cardBg: "#FFF1F2", mutedText: "#9CA3AF" },
      minimal: { bg: "#FAFAFA", accent: "#18181B", accentEnd: "#52525B", text: "#18181B", secondaryBg: "#F4F4F5", cardBg: "#FFFFFF", mutedText: "#71717A" },
      dark_elegance: { bg: "#09090B", accent: "#FBBF24", accentEnd: "#F59E0B", text: "#FAFAFA", secondaryBg: "#18181B", cardBg: "#1C1C1E", mutedText: "#A1A1AA" },
    };

    const t = themes[style || "corporate"] || themes.corporate;

    const systemPrompt = `You are MANUS-LEVEL presentation designer. You CODE every slide as bespoke HTML with inline SVG icons, data visualizations, gradient cards, and cinematic layouts. Your output is indistinguishable from Manus AI's pitch decks.

RETURN ONLY VALID JSON. No markdown fences. No text before or after.

DESIGN SYSTEM:
- Canvas: 960px × 540px, overflow hidden
- Background: ${t.bg}
- Text: ${t.text}  |  Muted: ${t.mutedText}
- Accent: ${t.accent}  |  Accent End: ${t.accentEnd}
- Gradient: linear-gradient(135deg, ${t.accent}, ${t.accentEnd})
- Secondary BG: ${t.secondaryBg}  |  Card BG: ${t.cardBg}
- Font: 'Inter', 'Segoe UI', system-ui, sans-serif

CRITICAL VISUAL STANDARDS (study these carefully — this is what makes Manus decks look premium):

1. **INLINE SVG ICONS** — Every feature card, metric card, and section MUST include a relevant inline SVG icon (24-32px). Use simple, clean geometric SVG paths. Examples:
   - Shield: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
   - Chart: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
   - Globe: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
   - Lock: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
   - Rocket: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
   - Users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${t.accent}" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
   - Zap: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
   - Star: <svg width="28" height="28" viewBox="0 0 24 24" fill="${t.accent}" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
   Choose appropriate icons for each context. ALWAYS use inline SVG, never image URLs.

2. **DATA VISUALIZATION** — Include SVG-based charts when presenting metrics:
   - Bar charts: <div style="display:flex;align-items:flex-end;gap:8px;height:120px;">
       <div style="width:40px;height:30%;background:${t.accent};border-radius:4px 4px 0 0;opacity:0.4;"></div>
       <div style="width:40px;height:55%;background:${t.accent};border-radius:4px 4px 0 0;opacity:0.6;"></div>
       <div style="width:40px;height:80%;background:linear-gradient(180deg,${t.accent},${t.accentEnd});border-radius:4px 4px 0 0;"></div>
     </div>
   - Progress bars, gauge indicators, growth arrows
   - Metric cards with large numbers and trend arrows (▲ ▼)

3. **CARD-BASED LAYOUTS** — Feature/metric cards with:
   - Rounded corners (border-radius: 16px)
   - Subtle borders (1px solid ${t.accent}20)
   - Background: ${t.cardBg}
   - SVG icon in top-left or center
   - Padding: 24px
   - Optional accent top-border (3px solid gradient)

4. **CINEMATIC TITLE SLIDES** — Full-bleed gradient backgrounds with:
   - Radial gradient overlays for depth
   - Large bold typography (48-56px, font-weight: 900)
   - Subtle tagline below (18px, opacity: 0.8)
   - Decorative elements: horizontal rules, abstract shapes

5. **COMPARISON TABLES** — Rich styled tables with:
   - Colored header row with gradient background
   - Alternating row backgrounds
   - Status indicators (✓ in green, ✗ in red, or colored dots)
   - Bold typography for key differentiators

6. **FEATURE GRIDS** — 2×2 or 3×1 grids of feature cards, each with:
   - SVG icon (28px)
   - Bold title (16-18px)
   - 2-3 line description (12-13px, muted color)
   - Optional badge: "Executed Locally", "NEW", "BETA"

7. **METRICS/TRACTION SLIDES** — Large number callouts:
   - Huge metric value (48-56px, accent color, font-weight: 900)
   - Label below (12px, muted)
   - Trend indicator (▲ 23.4%, colored green/red)
   - Arranged in 2×2 or 4×1 grid

8. **ROADMAP/TIMELINE** — Phase columns with:
   - Color-coded status indicators (green=done, blue=active, gray=upcoming)
   - Phase name as bold header with colored top border
   - Bullet items within each phase

LAYOUT RULES:
- Root: <div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter','Segoe UI',system-ui,sans-serif;">
- ALL styles must be inline (style="...")
- NO <style> tags, NO CSS classes
- Use flexbox (display:flex) and grid for layouts
- Generous padding (40-60px) and consistent spacing
- Every slide MUST be visually distinct from the others

CONTENT QUALITY:
- Bold, provocative titles ("The Cloud is Broken", not "Cloud Computing Overview")
- Specific data with precise numbers ($12.7M, 47.3%, 52,504+ users)
- Company names, research citations, market data
- Short punchy descriptions (2-3 lines max per card)
- Speaker notes: 4-6 sentences with delivery cues

SLIDE SEQUENCE (narrative arc):
1. Title slide — cinematic, full-gradient, bold positioning statement
2. Problem/pain point — what's broken, with data
3. Solution overview — 3 key pillars with icon cards
4. Feature deep-dive — 2×2 or 3×1 feature grid with icons
5. Comparison — styled table vs competitors
6. Market opportunity — charts, market size data
7. Traction/metrics — large number callouts
8. Pricing/business model — table or tier cards
9. Roadmap — phased timeline
10. Closing/CTA — cinematic, contact info, next steps

Adapt this sequence to the topic. Generate exactly ${count} slides.

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
    "estimatedDuration": N,
    "targetAudience": "...",
    "keyTakeaways": ["...", "...", "..."],
    "researchSources": ["...", "...", "..."]
  }
}

For "content" field (PPTX fallback), use:
- title/closing: { tagline, presenter, date } or { heading, cta, nextSteps: [] }
- bullets: { heading, bullets: [] }
- stats: { stats: [{ value, label, change }] }
- comparison: { items: [{ name, pros: [], cons: [] }] }
- Others: { heading, paragraphs: [] }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a MANUS-QUALITY coded presentation about: ${topic}${additionalContext ? `\n\nContext: ${additionalContext}` : ''}\n\nEvery slide MUST have custom-coded HTML with inline SVG icons, data visualizations, gradient cards, and cinematic layouts. Make it visually indistinguishable from a Manus AI deck. Each slide should be a unique visual masterpiece.` },
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
    
    // Strip markdown fences
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    
    const presentation = JSON.parse(raw);

    // Validate slides
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        // Generate fallback HTML if missing
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

        // Ensure content fallback for PPTX export
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
  } catch (e) {
    console.error("generate-presentation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
