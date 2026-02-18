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

    const systemPrompt = `You are a world-class McKinsey-tier presentation strategist and designer. You create presentations that are DENSE with actionable insights, data, and compelling narratives — never generic or empty.

CRITICAL RULES:
1. Every slide MUST have substantial, specific content. NEVER leave content fields empty or with placeholder text.
2. Bullet points must be 15-30 words each — full sentences with specific data, examples, or actionable insights.
3. Stats must use realistic, specific numbers (not round numbers) — e.g., "47.3%" not "50%", "$2.4M" not "$2M".
4. Paragraphs must be 2-4 sentences each, packed with insight.
5. Speaker notes must be 3-5 detailed sentences that expand on the slide content with talking points.
6. Use a VARIETY of layouts — never more than 2 consecutive slides with the same layout.
7. The first slide must be "title" and the last must be "closing". Between them, use diverse layouts.

Generate exactly ${count} slides for the given topic.

AVAILABLE LAYOUTS (use at least 6 different types):
- "title": Opening slide. content: { "tagline": string (compelling 10-15 word hook), "presenter": string, "date": string }
- "content": Rich paragraph content. content: { "heading": string, "paragraphs": string[] (2-4 paragraphs, each 2-3 sentences) }
- "two_column": Side-by-side comparison. content: { "left": { "heading": string, "points": string[] (4-6 detailed points) }, "right": { "heading": string, "points": string[] (4-6 detailed points) } }
- "bullets": Key points. content: { "heading": string (subtitle), "bullets": string[] (5-8 bullets, each 15-30 words with specific details) }
- "stats": Key metrics. content: { "stats": [{ "value": string, "label": string, "change": string }] } (exactly 4 stats with trend indicators like "+12.3%" or "↑ 2.1x")
- "quote": Impactful quote. content: { "quote": string (powerful 15-30 word quote), "author": string, "role": string }
- "timeline": Chronological events. content: { "events": [{ "year": string, "title": string, "description": string (2 sentences) }] } (4-6 events)
- "comparison": Feature comparison. content: { "items": [{ "name": string, "pros": string[] (3-4 specific pros), "cons": string[] (2-3 specific cons) }] } (2-3 items)
- "image_text": Visual + text split. content: { "heading": string, "text": string (2-3 rich sentences), "imagePrompt": string (detailed image description), "keyPoints": string[] (3-4 short points) }
- "funnel": Process/funnel visualization. content: { "stages": [{ "name": string, "value": string, "description": string }] } (4-6 stages)
- "swot": SWOT analysis. content: { "strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[] } (3-4 items each)
- "roadmap": Strategic roadmap. content: { "phases": [{ "name": string, "timeline": string, "items": string[], "status": string }] } (3-5 phases, status: "done"|"active"|"upcoming")
- "kpi_dashboard": KPI overview. content: { "kpis": [{ "name": string, "value": string, "target": string, "status": string, "trend": string }] } (4-6 KPIs, status: "on_track"|"at_risk"|"behind")
- "process": Step-by-step process. content: { "steps": [{ "number": number, "title": string, "description": string }] } (4-6 steps)
- "closing": Final slide. content: { "heading": string (memorable closing statement), "cta": string (clear call-to-action), "contact": string, "nextSteps": string[] (3-4 concrete next steps) }

Each slide object:
- "layout": one of the above
- "title": compelling slide title (4-8 words, never generic like "Overview" — be specific)
- "subtitle": optional descriptive subtitle
- "content": content object matching the layout spec above
- "speakerNotes": 3-5 sentences of detailed talking points with data references
- "transition": "fade" | "slide" | "zoom"

Style: "${style || 'corporate'}"
- corporate: Data-driven, authoritative, precise metrics, professional vocabulary
- startup: Bold claims, growth narratives, disruption language, future-focused
- academic: Evidence-based, citations, structured arguments, nuanced analysis
- creative: Storytelling, emotional hooks, vivid metaphors, unconventional angles
- minimal: Sparse but impactful, one key insight per slide, powerful white space

Return: { "title": string, "slides": [...], "metadata": { "estimatedDuration": number, "targetAudience": string, "keyTakeaways": string[] (5-7 takeaways) } }`;

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
          { role: "user", content: `Create a comprehensive, data-rich presentation about: ${topic}${additionalContext ? `\n\nAdditional context and requirements: ${additionalContext}` : ''}\n\nRemember: Every slide must have SUBSTANTIAL, SPECIFIC content. No empty or placeholder text. Use realistic data and specific examples throughout.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_presentation",
              description: "Create a structured presentation with rich, detailed slides",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Presentation title" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        layout: { type: "string", enum: ["title", "content", "two_column", "image_text", "quote", "stats", "timeline", "comparison", "bullets", "closing", "funnel", "swot", "roadmap", "kpi_dashboard", "process"] },
                        title: { type: "string" },
                        subtitle: { type: "string" },
                        content: { type: "object" },
                        speakerNotes: { type: "string" },
                        transition: { type: "string", enum: ["fade", "slide", "zoom"] }
                      },
                      required: ["layout", "title", "content", "speakerNotes"]
                    }
                  },
                  metadata: {
                    type: "object",
                    properties: {
                      estimatedDuration: { type: "number" },
                      targetAudience: { type: "string" },
                      keyTakeaways: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                required: ["title", "slides", "metadata"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_presentation" } },
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
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let presentation;
    if (toolCall?.function?.arguments) {
      presentation = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      const content = data.choices?.[0]?.message?.content || '';
      presentation = JSON.parse(content);
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
