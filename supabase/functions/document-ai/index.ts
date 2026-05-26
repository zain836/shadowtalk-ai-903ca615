import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getKimiDocumentSystemPrompt, type KimiDocumentType, type KimiToneType, type KimiLengthType } from "../_shared/kimiDocumentPrompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REVISE_ACTIONS: Record<string, string> = {
  rewrite: "Rewrite for clarity and professional structure. Return ONLY the full revised document in Markdown.",
  summarize: "Summarize while preserving structure. Return ONLY the summary document in Markdown.",
  expand: "Expand with more depth, examples, and sections. Return ONLY the expanded Markdown document.",
  translate: "Translate the document. Return ONLY the translated Markdown.",
  fix_grammar: "Fix grammar and spelling. Return ONLY the corrected Markdown document.",
  make_formal: "Make more formal and executive-ready. Return ONLY the full Markdown document.",
  make_casual: "Make more conversational while keeping structure. Return ONLY the full Markdown document.",
  bullet_points: "Convert to structured bullet format. Return ONLY Markdown.",
  shorten: "Reduce length by ~30% while keeping all key sections. Return ONLY the shortened Markdown document.",
  lengthen: "Increase length with more detail and examples. Return ONLY the lengthened Markdown document.",
  add_toc: "Add or improve Table of Contents and section hierarchy. Return ONLY the full Markdown document.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, content, instruction, language, topic, docType, tone, length } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kimi-class full document generation (non-streaming)
    if (action === "generate") {
      if (!topic || typeof topic !== "string" || topic.length > 5000) {
        return new Response(JSON.stringify({ error: "Invalid topic" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const type = (docType as KimiDocumentType) || "article";
      const docTone = (tone as KimiToneType) || "professional";
      const docLength = (length as KimiLengthType) || "long";
      const systemPrompt = getKimiDocumentSystemPrompt(type, docTone, docLength);
      const userPrompt = `Create the complete document about: ${topic}${instruction ? `\n\nRequirements:\n${instruction}` : ""}`;

      const model = docLength === "epic" || docLength === "comprehensive"
        ? "openai/gpt-5"
        : "google/gemini-3-pro-preview";

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("document-ai generate error:", response.status, t);
        return new Response(JSON.stringify({ error: "Document generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revise / transform existing document (Kimi format conversion)
    if (!content || typeof content !== "string" || content.length > 80000) {
      return new Response(JSON.stringify({ error: "Invalid content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = REVISE_ACTIONS[action] || instruction || REVISE_ACTIONS.rewrite;
    if (action === "translate") {
      systemPrompt = `Translate the following document to ${language || "English"}. Preserve Markdown structure. Return ONLY the translated document.`;
    }
    if (action === "custom" && instruction) {
      systemPrompt = `${instruction}\n\nReturn ONLY the full revised Markdown document.`;
    }

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
