import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseCustomAi, customAiChatCompletions } from "../_shared/custom-ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ThemeColors {
  bg: string;
  accent: string;
  accentEnd: string;
  text: string;
  secondaryBg: string;
  cardBg: string;
  mutedText: string;
}

const THEMES: Record<string, ThemeColors> = {
  corporate: { bg: "#FFFFFF", accent: "#1E40AF", accentEnd: "#3B82F6", text: "#111827", secondaryBg: "#F3F4F6", cardBg: "#F8FAFC", mutedText: "#6B7280" },
  startup: { bg: "#0F172A", accent: "#8B5CF6", accentEnd: "#EC4899", text: "#F8FAFC", secondaryBg: "#1E293B", cardBg: "#1E293B", mutedText: "#94A3B8" },
  academic: { bg: "#FFFBEB", accent: "#92400E", accentEnd: "#D97706", text: "#1C1917", secondaryBg: "#FEF3C7", cardBg: "#FFFDF7", mutedText: "#78716C" },
  creative: { bg: "#FDF2F8", accent: "#DB2777", accentEnd: "#F97316", text: "#1F2937", secondaryBg: "#FCE7F3", cardBg: "#FFF1F2", mutedText: "#9CA3AF" },
  minimal: { bg: "#FAFAFA", accent: "#18181B", accentEnd: "#52525B", text: "#18181B", secondaryBg: "#F4F4F5", cardBg: "#FFFFFF", mutedText: "#71717A" },
  dark_elegance: { bg: "#09090B", accent: "#FBBF24", accentEnd: "#F59E0B", text: "#FAFAFA", secondaryBg: "#18181B", cardBg: "#1C1C1E", mutedText: "#A1A1AA" },
};

interface Presentation {
  title: string;
  slides: Slide[];
  metadata?: Record<string, unknown>;
}

interface Slide {
  title: string;
  subtitle?: string;
  layout: string;
  html: string;
  speakerNotes: string;
  content?: Record<string, unknown>;
}

interface RequestBody {
  topic: string;
  slideCount?: number;
  style?: string;
  additionalContext?: string;
}

interface AIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as RequestBody & { customAi?: unknown };
    const { topic, slideCount, style, additionalContext } = body;
    const customAi = parseCustomAi(body);
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
      ? `\n\nAUDIENCE ADAPTATION (CRITICAL): The audience is YOUNG CHILDREN / elementary students.\n- Use simple, playful language at a 2nd–4th grade reading level.\n- Replace technical percentages with simple fractions or "out of X".\n- Add emoji, friendly illustrations, animated transitions.\n- Make topics relatable to their daily lives (toys, games, friends, families).\n- Avoid scary topics; spin negatives into learning opportunities.`
      : "";

    // Single powerful call with Manus-level instructions
    // The prompt forces the model to THINK like Manus: research first, then code
    const systemPrompt = `You are MANUS-LEVEL presentation designer and researcher. You follow a strict 4-phase internal process:

PHASE 1 — RESEARCH: Before writing any HTML, mentally research the topic. Gather REAL, specific data points, market sizes, growth rates, company names, and statistics. Use precise non-round numbers to sound credible.

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

1. **INLINE SVG ICONS** — Every feature card, metric card, and section MUST include a relevant inline SVG icon (24-32px). Use clean geometric SVG paths.

2. **DATA VISUALIZATION** — Include SVG-based charts when presenting metrics.

3. **CARD-BASED LAYOUTS**:
   - border-radius: 16px; padding: 24px
   - border: 1px solid ${t.accent}20
   - background: ${t.cardBg}

4. **CINEMATIC TITLE SLIDES**:
   - Full-bleed gradient background
   - Large bold typography (48-56px, weight 900)
   - Subtle tagline (18px, opacity 0.8)

5. **COMPARISON TABLES**:
   - Gradient header row
   - Alternating row backgrounds

6. **TIMELINES/ROADMAPS**:
   - Connected nodes with SVG lines/circles
   - Color-coded phases

LAYOUT RULES:
- Root: <div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter','Segoe UI',system-ui,sans-serif;">
- ALL styles MUST be inline. Use SINGLE QUOTES for HTML attributes.
- NO <style> tags, NO CSS classes, NO external resources
- Use flexbox (display:flex) and grid (display:grid) for layouts
- Generous padding (40-60px) and consistent spacing
- Every slide MUST be visually UNIQUE

CONTENT QUALITY:
- Bold, provocative titles
- Specific data with precise numbers and sources
- Real company names and research citations
- Short punchy descriptions (2-3 lines max per card)
- Speaker notes: 4-6 sentences with delivery cues

SLIDE COUNT (STRICT): You MUST output EXACTLY ${count} slides — no more, no less.

OUTPUT FORMAT:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "subtitle": "Optional subtitle",
      "layout": "descriptive_name",
      "html": "<div style=\\"...complete slide HTML...\\"></div>",
      "speakerNotes": "4-6 sentences...",
      "content": { ... }
    }
  ],
  "metadata": { "estimatedDuration": ${count * 2}, ... }
}`;

    console.log("Generating Manus-quality presentation...");
    const response = await customAiChatCompletions(customAi, LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a MANUS-QUALITY coded presentation about: ${topic}${additionalContext ? `\n\nContext: ${additionalContext}` : ''}${audienceGuidance}\n\nIMPORTANT: Return ONLY valid JSON, no markdown.` },
        ],
        temperature: 0.75,
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

    const data = await response.json() as AIResponse;
    let raw = data.choices?.[0]?.message?.content || '';
    if (!raw) throw new Error("Empty response from AI model");
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    // Strip control characters using Unicode escape sequences
    raw = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

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

    let presentation: Presentation;
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
      presentation.slides = presentation.slides.map((slide: Slide) => {
        if (!slide.html) {
          const isAccent = slide.layout === 'title' || slide.layout === 'closing';
          const bg = isAccent ? `background:linear-gradient(135deg,${t.accent},${t.accentEnd});color:#fff;` : `background:${t.bg};color:${t.text};`;
          slide.html = `<div style="width:960px;height:540px;overflow:hidden;position:relative;${bg}font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;"><h2 style="margin:0;font-size:36px;font-weight:700;">${slide.title}</h2></div>`;
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
            html: `<div style="width:960px;height:540px;overflow:hidden;position:relative;background:${t.bg};color:${t.text};font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;padding:40px;"><h2 style="font-size:32px;margin:0 0 20px 0;">${`Additional Insights ${i + 1}`}</h2><p style="font-size:16px;line-height:1.6;">Add your own content here.</p></div>`,
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
  } catch (e) {
    console.error("generate-presentation error:", e);
    const status = (e instanceof Error && 'status' in e) ? (e as { status?: number }).status : 500;
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
