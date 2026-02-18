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

    const systemPrompt = `You are a world-class McKinsey-tier presentation strategist. You create presentations PACKED with specific data, actionable insights, and compelling narratives.

CRITICAL: Return ONLY a valid JSON object. No markdown fences, no explanation, no text before or after the JSON.

CONTENT DENSITY RULES:
1. Every slide MUST have substantial content — NEVER return empty content objects.
2. Bullet points: 15-30 words each with specific data/examples.
3. Stats: Use precise numbers like "47.3%" not "50%", "$2.4M" not "$2M".
4. Paragraphs: 2-4 sentences each, packed with insight.
5. Speaker notes: 3-5 detailed sentences expanding on slide content.
6. Use at least 6 DIFFERENT layout types. Never 2+ consecutive same layouts.
7. First slide = "title", last slide = "closing".

Generate exactly ${count} slides.

LAYOUT SPECIFICATIONS (follow content structure EXACTLY):

"title" → content: { "tagline": "compelling 10-15 word hook", "presenter": "name", "date": "date" }

"bullets" → content: { "heading": "subtitle text", "bullets": ["15-30 word bullet with specific data...", "another detailed bullet..."] } (5-8 bullets)

"stats" → content: { "stats": [{ "value": "$2.4M", "label": "Revenue Impact", "change": "+23.1% YoY" }] } (exactly 4 stats)

"two_column" → content: { "left": { "heading": "Left Title", "points": ["detailed point..."] }, "right": { "heading": "Right Title", "points": ["detailed point..."] } } (4-6 points each side)

"content" → content: { "heading": "Section heading", "paragraphs": ["2-3 sentence paragraph...", "another paragraph..."] } (2-4 paragraphs)

"quote" → content: { "quote": "15-30 word impactful quote", "author": "Name", "role": "Title/Role" }

"timeline" → content: { "events": [{ "year": "2023", "title": "Event Name", "description": "2 sentence description" }] } (4-6 events)

"comparison" → content: { "items": [{ "name": "Option A", "pros": ["specific pro..."], "cons": ["specific con..."] }] } (2-3 items, 3-4 pros, 2-3 cons each)

"image_text" → content: { "heading": "Title", "text": "2-3 rich sentences", "imagePrompt": "detailed image description", "keyPoints": ["short point 1", "short point 2"] } (3-4 key points)

"funnel" → content: { "stages": [{ "name": "Awareness", "value": "10,000 leads", "description": "Top of funnel acquisition" }] } (4-6 stages)

"swot" → content: { "strengths": ["item..."], "weaknesses": ["item..."], "opportunities": ["item..."], "threats": ["item..."] } (3-4 items each)

"roadmap" → content: { "phases": [{ "name": "Phase 1", "timeline": "Q1 2026", "items": ["deliverable..."], "status": "done" }] } (3-5 phases, status: "done"|"active"|"upcoming")

"kpi_dashboard" → content: { "kpis": [{ "name": "CAC", "value": "$142", "target": "$120", "status": "at_risk", "trend": "↑ 8.3%" }] } (4-6 KPIs, status: "on_track"|"at_risk"|"behind")

"process" → content: { "steps": [{ "number": 1, "title": "Step Name", "description": "What happens in this step" }] } (4-6 steps)

"closing" → content: { "heading": "memorable closing statement", "cta": "clear call-to-action", "contact": "email/website", "nextSteps": ["concrete step 1", "concrete step 2"] } (3-4 next steps)

Each slide object structure:
{
  "layout": "one of the above",
  "title": "4-8 word compelling title (never generic like 'Overview')",
  "subtitle": "optional descriptive subtitle",
  "content": { ... matching layout spec above ... },
  "speakerNotes": "3-5 sentences of detailed talking points",
  "transition": "fade" | "slide" | "zoom"
}

Style "${style || 'corporate'}":
- corporate: Data-driven, authoritative, precise metrics
- startup: Bold, growth narratives, disruption language
- academic: Evidence-based, citations, structured arguments
- creative: Storytelling, emotional hooks, vivid metaphors
- minimal: Sparse but impactful, one key insight per slide

RETURN THIS EXACT JSON STRUCTURE:
{
  "title": "Presentation Title",
  "slides": [ ... array of slide objects ... ],
  "metadata": {
    "estimatedDuration": 20,
    "targetAudience": "description",
    "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]
  }
}`;

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
          { role: "user", content: `Create a comprehensive, data-rich presentation about: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ''}\n\nIMPORTANT: Every slide's "content" field MUST be fully populated with specific data matching the layout specification. Do NOT return empty content objects.` },
        ],
        temperature: 0.7,
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
    
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    
    const presentation = JSON.parse(raw);

    // Validate slides have content
    if (presentation.slides) {
      presentation.slides = presentation.slides.map((slide: any) => {
        if (!slide.content || Object.keys(slide.content).length === 0) {
          // Provide fallback content based on layout
          switch (slide.layout) {
            case 'title':
              slide.content = { tagline: slide.subtitle || slide.title, presenter: "ShadowTalk AI", date: new Date().toLocaleDateString() };
              break;
            case 'bullets':
              slide.content = { heading: slide.subtitle || "", bullets: ["Key insight from this section — detailed analysis pending.", "Strategic consideration worth exploring further.", "Data point to validate with stakeholder input."] };
              break;
            case 'closing':
              slide.content = { heading: "Thank you", cta: "Let's discuss next steps", contact: "", nextSteps: ["Review key findings", "Schedule follow-up meeting"] };
              break;
            default:
              slide.content = { heading: slide.subtitle || slide.title, paragraphs: [slide.speakerNotes || "Content for this slide."] };
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
