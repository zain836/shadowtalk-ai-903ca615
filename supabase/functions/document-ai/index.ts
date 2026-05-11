import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return handleCorsOptions(origin);

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { action, content, instruction, language } = await req.json();

    if (!content || typeof content !== "string" || content.length > 50000) {
      return new Response(JSON.stringify({ error: "Invalid content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionPrompts: Record<string, string> = {
      rewrite: "Rewrite the following text to be clearer, more professional, and well-structured. Preserve the original meaning. Return ONLY the rewritten text, no explanations.",
      summarize: "Summarize the following text concisely. Capture all key points in a brief format. Return ONLY the summary.",
      expand: "Expand the following text with more detail, examples, and depth. Maintain the same tone and style. Return ONLY the expanded text.",
      translate: `Translate the following text to ${language || "English"}. Return ONLY the translation.`,
      fix_grammar: "Fix all grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text.",
      make_formal: "Rewrite the following text in a formal, professional tone. Return ONLY the rewritten text.",
      make_casual: "Rewrite the following text in a casual, conversational tone. Return ONLY the rewritten text.",
      bullet_points: "Convert the following text into a well-organized bullet point list. Return ONLY the bullet points.",
      custom: instruction || "Improve the following text. Return ONLY the improved text.",
    };

    const systemPrompt = actionPrompts[action] || actionPrompts.custom;

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
          { role: "user", content },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("document-ai error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("document-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
