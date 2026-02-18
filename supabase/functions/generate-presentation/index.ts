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

    // Theme color palettes for the AI to use
    const themes: Record<string, { bg: string; accent: string; accentEnd: string; text: string; secondaryBg: string }> = {
      corporate: { bg: "#FFFFFF", accent: "#1E40AF", accentEnd: "#3B82F6", text: "#111827", secondaryBg: "#F3F4F6" },
      startup: { bg: "#0F172A", accent: "#8B5CF6", accentEnd: "#EC4899", text: "#F8FAFC", secondaryBg: "#1E293B" },
      academic: { bg: "#FFFBEB", accent: "#92400E", accentEnd: "#D97706", text: "#1C1917", secondaryBg: "#FEF3C7" },
      creative: { bg: "#FDF2F8", accent: "#DB2777", accentEnd: "#F97316", text: "#1F2937", secondaryBg: "#FCE7F3" },
      minimal: { bg: "#FAFAFA", accent: "#18181B", accentEnd: "#52525B", text: "#18181B", secondaryBg: "#F4F4F5" },
      dark_elegance: { bg: "#09090B", accent: "#FBBF24", accentEnd: "#F59E0B", text: "#FAFAFA", secondaryBg: "#18181B" },
    };

    const t = themes[style || "corporate"] || themes.corporate;

    const systemPrompt = `You are a WORLD-CLASS presentation designer who CODES every single slide as custom HTML/CSS — just like Manus AI. You don't use templates. Each slide is a unique, hand-crafted visual masterpiece with bespoke layouts, typography, and data visualization.

RETURN ONLY VALID JSON. No markdown fences. No text before or after.

YOUR DESIGN SYSTEM:
- Slide canvas: exactly 960px × 540px, overflow hidden
- Background: ${t.bg}
- Primary text: ${t.text}
- Accent color: ${t.accent}
- Accent gradient: linear-gradient(135deg, ${t.accent}, ${t.accentEnd})
- Secondary background: ${t.secondaryBg}
- Font stack: 'Inter', 'Segoe UI', system-ui, sans-serif
- All text must be readable against the background

CODING RULES:
1. Each slide's "html" field contains a COMPLETE, self-contained HTML string with inline styles. No external CSS, no class references.
2. The root element MUST be a <div> with: width:960px; height:540px; overflow:hidden; position:relative; background:${t.bg}; color:${t.text}; font-family:'Inter','Segoe UI',system-ui,sans-serif;
3. Use ONLY inline styles (style="..."). No <style> tags, no CSS classes.
4. Create VISUALLY DIVERSE slides — use creative layouts like:
   - Split layouts (40/60, 30/70)
   - Full-bleed accent backgrounds for title/closing slides
   - Grid-based metric dashboards with colored indicator bars
   - Timeline layouts with connecting lines and milestone dots
   - Side-by-side comparison cards with colored headers
   - Funnel/pyramid shapes using decreasing-width divs
   - SWOT quadrant grids with colored borders
   - Process flows with numbered circles and arrows
   - Quote slides with oversized quotation marks
   - KPI cards with status indicators (green/amber/red)
5. Use the accent gradient for visual emphasis: backgrounds, left borders, numbered badges, decorative elements.
6. Include decorative elements: corner accents, bottom bars, subtle radial gradients, divider lines.
7. Typography hierarchy: titles 36-44px font-weight:900, subtitles 18-22px font-weight:300, body 13-15px, captions 10-11px.
8. Every data point must use PRECISE numbers ($12.7M not $10M, 47.3% not 50%).
9. DENSE content — every slide must be packed with real data, research citations, company names, and actionable insights.
10. Speaker notes: 4-6 sentences with rhetorical techniques and additional context.

SLIDE VARIETY (use 7+ different visual approaches across the deck):
- Title: Full accent-gradient background, centered large title, subtitle, decorative radial overlays
- Data/Stats: Grid of metric cards with top accent bars, large numbers, trend indicators
- Bullets: Numbered badges with accent gradient, generous line spacing
- Two-column: Cards with rounded corners, colored dot headers
- Quote: Giant transparent quotation marks, centered italic text, attribution with divider
- Timeline: Horizontal line with connected dots, year labels above, descriptions below
- Comparison: Side-by-side cards with accent-colored headers, pros/cons with ✓/✗ icons
- SWOT: 2×2 grid with distinct colors (green/red/blue/amber) per quadrant
- Funnel: Decreasing-width bars stacked vertically with accent gradient
- KPI Dashboard: 6-card grid with left color borders indicating status
- Roadmap: Horizontal phase cards with top color borders and status badges
- Process Flow: Horizontal steps with numbered circles and connecting arrows
- Content/Paragraphs: Clean layout with heading, accent left-bar, flowing paragraphs
- Closing: Full accent background, CTA button, numbered next steps

CONTENT QUALITY (McKinsey/BCG level):
- Every bullet: 20-35 words with specific data, company names, or research citations
- Example: "Stanford Medical's AI radiology tool reduced false negatives by 31.4%, processing 847 scans daily at $0.12 per analysis — 94% cheaper than manual review."
- Stats use realistic precise numbers with trend indicators
- Paragraphs: 3-4 sentences, dense with insight

OUTPUT FORMAT:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "layout": "descriptive_layout_name",
      "html": "<div style=\\"width:960px;height:540px;overflow:hidden;position:relative;...\\">...complete slide HTML...</div>",
      "speakerNotes": "4-6 sentences with rhetorical techniques...",
      "content": { ... structured data for PPTX export ... }
    }
  ],
  "metadata": {
    "estimatedDuration": N,
    "targetAudience": "...",
    "keyTakeaways": ["...", "...", "..."],
    "researchSources": ["source1", "source2", "source3"]
  }
}

CRITICAL: The "html" field is the PRIMARY output. It must be visually stunning, pixel-perfect HTML. The "content" field is secondary — a simplified structured version for PPTX export fallback.

For the "content" field, use these structures based on layout type:
- title: { tagline, presenter, date }
- bullets: { heading, bullets: [] }
- stats: { stats: [{ value, label, change }] }
- closing: { heading, cta, contact, nextSteps: [] }
- quote: { quote, author, role }
- For others: { heading, paragraphs: [] }

Generate exactly ${count} slides. Slide 1 = title slide, last slide = closing. Each slide MUST have unique, custom-coded HTML.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a MASTERCLASS presentation about: ${topic}${additionalContext ? `\n\nContext: ${additionalContext}` : ''}\n\nREMINDER: Every slide MUST have a custom-coded "html" field with bespoke HTML/CSS. No two slides should look the same. Include precise data, research citations, and company names. CODE each slide like a professional web designer would.` },
        ],
        temperature: 0.8,
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
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '';
    
    // Strip markdown fences
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    
    const presentation = JSON.parse(raw);

    // Validate slides have html field, fallback if missing
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        if (!slide.html) {
          // Generate basic fallback HTML if AI didn't provide it
          const bgStyle = slide.layout === 'title' || slide.layout === 'closing' 
            ? `background:linear-gradient(135deg, ${themes[style||'corporate']?.accent || '#1E40AF'}, ${themes[style||'corporate']?.accentEnd || '#3B82F6'});color:#fff;`
            : `background:${themes[style||'corporate']?.bg || '#fff'};color:${themes[style||'corporate']?.text || '#111'};`;
          
          slide.html = `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bgStyle}font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;">
            <h1 style="font-size:38px;font-weight:900;margin-bottom:16px;">${slide.title || 'Untitled'}</h1>
            ${slide.subtitle ? `<p style="font-size:18px;opacity:0.8;font-weight:300;">${slide.subtitle}</p>` : ''}
          </div>`;
        }

        // Ensure content fallback for PPTX export
        if (!slide.content || Object.keys(slide.content).length === 0) {
          switch (slide.layout) {
            case 'title':
              slide.content = { tagline: slide.subtitle || "Exploring the future of innovation", presenter: "ShadowTalk AI", date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
              break;
            case 'bullets':
              slide.content = { heading: slide.subtitle || "", bullets: [slide.speakerNotes || "Key insight from this analysis."] };
              break;
            case 'stats':
              slide.content = { stats: [{ value: "N/A", label: "Data pending", change: "" }] };
              break;
            case 'closing':
              slide.content = { heading: "Thank you", cta: "Let's take action", contact: "", nextSteps: ["Review findings", "Schedule follow-up"] };
              break;
            default:
              slide.content = { heading: slide.subtitle || slide.title, paragraphs: [slide.speakerNotes || "Content for this section."] };
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
