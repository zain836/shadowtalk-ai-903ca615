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

    const systemPrompt = `You are a world-class presentation designer and content strategist. Generate professional presentation slides.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no explanation.

Generate exactly ${slideCount || 10} slides for the given topic.

Each slide must have:
- "layout": one of "title", "content", "two_column", "image_text", "quote", "stats", "timeline", "comparison", "bullets", "closing"
- "title": compelling slide title (max 8 words)
- "subtitle": optional subtitle
- "content": main content object varying by layout:
  For "title": { "tagline": string }
  For "content": { "heading": string, "paragraphs": string[] }
  For "two_column": { "left": { "heading": string, "points": string[] }, "right": { "heading": string, "points": string[] } }
  For "bullets": { "heading": string, "bullets": string[] }
  For "stats": { "stats": [{ "value": string, "label": string }] } (3-4 stats)
  For "quote": { "quote": string, "author": string }
  For "timeline": { "events": [{ "year": string, "title": string, "description": string }] }
  For "comparison": { "items": [{ "name": string, "pros": string[], "cons": string[] }] }
  For "image_text": { "heading": string, "text": string, "imagePrompt": string }
  For "closing": { "heading": string, "cta": string, "contact": string }
- "speakerNotes": detailed speaker notes (2-3 sentences)
- "transition": "fade" | "slide" | "zoom"

Style guide for "${style || 'corporate'}":
- corporate: Professional, data-driven, authoritative tone
- startup: Bold, energetic, future-focused
- academic: Research-backed, structured, evidence-based
- creative: Visual, storytelling, emotionally engaging
- minimal: Clean, sparse, impactful

Return format: { "title": string, "slides": [...], "metadata": { "estimatedDuration": number, "targetAudience": string, "keyTakeaways": string[] } }`;

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
          { role: "user", content: `Create a presentation about: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ''}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_presentation",
              description: "Create a structured presentation with slides",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Presentation title" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        layout: { type: "string", enum: ["title", "content", "two_column", "image_text", "quote", "stats", "timeline", "comparison", "bullets", "closing"] },
                        title: { type: "string" },
                        subtitle: { type: "string" },
                        content: { type: "object" },
                        speakerNotes: { type: "string" },
                        transition: { type: "string", enum: ["fade", "slide", "zoom"] }
                      },
                      required: ["layout", "title", "content"]
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
                required: ["title", "slides"],
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
      // Fallback: parse from content
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
