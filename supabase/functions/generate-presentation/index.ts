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

    const systemPrompt = `You are a WORLD-CLASS presentation designer who creates award-winning, TED-talk quality presentations. Your slides are used by Fortune 500 CEOs, top consultants, and thought leaders.

RETURN ONLY VALID JSON. No markdown fences. No text before or after.

MASTERCLASS CONTENT RULES:
1. EVERY slide content field MUST be FULLY POPULATED — never empty.
2. Titles: Powerful, specific, 4-8 words. NEVER generic ("Overview", "Introduction"). Use action verbs and specific claims ("Revenue Surged 340% in Q3", "Five Forces Reshaping Healthcare").
3. Bullets: Each 20-35 words. Include specific numbers, company names, research citations, or concrete examples. Example: "Stanford Medical's AI radiology tool reduced false negatives by 31.4%, processing 847 scans daily at $0.12 per analysis — 94% cheaper than manual review."
4. Stats: ALWAYS use precise, realistic numbers ($12.7M not $10M, 47.3% not 50%). Include trend indicators.
5. Paragraphs: 3-4 sentences each. Dense with insight. Reference specific studies, companies, or market data.
6. Speaker notes: 4-6 sentences. Include rhetorical questions, pause points, audience engagement cues, and additional data not on the slide.
7. Use 7+ DIFFERENT layout types across the deck. NEVER repeat the same layout consecutively.
8. Slide 1 = "title", Last slide = "closing". Plan a narrative arc: Hook → Context → Evidence → Analysis → Vision → Action.

LAYOUT SPECS (populate content EXACTLY as shown):

"title" → { "tagline": "12-18 word compelling hook that creates urgency", "presenter": "Name, Title", "date": "Month Year" }

"bullets" → { "heading": "subtitle context", "bullets": ["20-35 word bullet with specific data, company name, or research citation...", ...] } (6-8 bullets)

"stats" → { "stats": [{ "value": "$12.7M", "label": "Metric Name", "change": "+23.1% YoY" }, ...] } (exactly 4 stats)

"two_column" → { "left": { "heading": "Title", "points": ["detailed point with data..."] }, "right": { "heading": "Title", "points": ["detailed point..."] } } (5-6 points each)

"content" → { "heading": "Section heading", "paragraphs": ["3-4 sentence paragraph with research citations and specific data...", ...] } (3-4 paragraphs)

"quote" → { "quote": "20-35 word powerful, memorable quote", "author": "Full Name", "role": "Title, Organization" }

"timeline" → { "events": [{ "year": "2023", "title": "Milestone Name", "description": "2-3 sentence description with impact metrics" }, ...] } (4-6 events)

"comparison" → { "items": [{ "name": "Option A", "pros": ["specific advantage with data..."], "cons": ["specific limitation..."] }, ...] } (2 items, 4 pros, 3 cons each)

"image_text" → { "heading": "Title", "text": "3-4 rich sentences with data", "imagePrompt": "detailed photographic description", "keyPoints": ["concise point", ...] } (4 key points)

"funnel" → { "stages": [{ "name": "Stage", "value": "metric", "description": "what happens" }, ...] } (5-6 stages)

"swot" → { "strengths": ["item..."], "weaknesses": ["item..."], "opportunities": ["item..."], "threats": ["item..."] } (4 items each)

"roadmap" → { "phases": [{ "name": "Phase", "timeline": "Q1-Q2 2026", "items": ["deliverable..."], "status": "done|active|upcoming" }, ...] } (4 phases)

"kpi_dashboard" → { "kpis": [{ "name": "Metric", "value": "$142", "target": "$120", "status": "on_track|at_risk|behind", "trend": "↑ 8.3%" }, ...] } (6 KPIs)

"process" → { "steps": [{ "number": 1, "title": "Step", "description": "2 sentence description" }, ...] } (5 steps)

"closing" → { "heading": "memorable 10-15 word closing statement", "cta": "bold call-to-action", "contact": "email or website", "nextSteps": ["concrete actionable step...", ...] } (4 next steps)

Each slide: { "layout": "...", "title": "...", "subtitle": "...", "content": { ... }, "speakerNotes": "...", "transition": "fade|slide|zoom" }

Style "${style || 'corporate'}":
- corporate: McKinsey-level precision, data-heavy, authoritative, structured argumentation
- startup: Y Combinator pitch energy, bold claims backed by metrics, growth narrative
- academic: Peer-reviewed rigor, methodology emphasis, citation-rich, nuanced analysis
- creative: TED-talk storytelling, emotional arc, vivid metaphors, surprise reveals
- minimal: Apple keynote aesthetic, one powerful insight per slide, dramatic white space

OUTPUT:
{
  "title": "...",
  "slides": [ ... ],
  "metadata": { "estimatedDuration": N, "targetAudience": "...", "keyTakeaways": ["...", "...", "...", "...", "..."] }
}`;

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
          { role: "user", content: `Create a MASTERCLASS presentation about: ${topic}${additionalContext ? `\n\nContext: ${additionalContext}` : ''}\n\nREMINDER: Every "content" field MUST be a fully populated object matching the layout specification. Empty content = failure. Include specific numbers, company names, research data, and actionable insights on EVERY slide.` },
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

    // Validate and fix empty content
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        if (!slide.content || Object.keys(slide.content).length === 0) {
          switch (slide.layout) {
            case 'title':
              slide.content = { tagline: slide.subtitle || "Exploring the future of " + (presentation.title || "innovation"), presenter: "ShadowTalk AI", date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
              break;
            case 'bullets':
              slide.content = { heading: slide.subtitle || "", bullets: [slide.speakerNotes || "Key insight from this analysis."] };
              break;
            case 'stats':
              slide.content = { stats: [{ value: "N/A", label: "Data pending", change: "" }] };
              break;
            case 'closing':
              slide.content = { heading: "Thank you for your time", cta: "Let's take action together", contact: "", nextSteps: ["Review findings", "Schedule follow-up"] };
              break;
            default:
              slide.content = { heading: slide.subtitle || slide.title, paragraphs: [slide.speakerNotes || "Detailed content for this section."] };
              slide.layout = 'content';
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
