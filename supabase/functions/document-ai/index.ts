import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PROFESSIONAL_DOCUMENT_STANDARDS } from "../_shared/kimiDocumentPrompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REVISE_ACTIONS: Record<string, string> = {
  rewrite: `Rewrite as a client-ready document. ${PROFESSIONAL_DOCUMENT_STANDARDS} Return ONLY the full Markdown document.`,
  summarize: "Summarize preserving section structure. Return ONLY Markdown.",
  expand: `Expand with substantive detail (no filler). ${PROFESSIONAL_DOCUMENT_STANDARDS} Return ONLY the full Markdown document.`,
  translate: "Translate preserving Markdown structure. Return ONLY the translated document.",
  fix_grammar: "Fix grammar and punctuation. Return ONLY the corrected Markdown document.",
  make_formal: `Rewrite in formal executive tone. ${PROFESSIONAL_DOCUMENT_STANDARDS} Return ONLY the full Markdown document.`,
  make_casual: "Rewrite in clear approachable tone (still professional). Return ONLY the full Markdown document.",
  bullet_points: "Convert to structured bullets while keeping headings. Return ONLY Markdown.",
  shorten: "Reduce length ~25% without losing sections. Return ONLY the shortened Markdown document.",
  lengthen: "Add substantive detail to each section. Return ONLY the expanded Markdown document.",
  add_toc: "Add or fix ## Table of Contents and heading hierarchy. Return ONLY the full Markdown document.",
  polish_professional: `Edit into publication-ready form: remove filler, emojis, duplicate headings, and AI preambles. ${PROFESSIONAL_DOCUMENT_STANDARDS} Return ONLY the polished Markdown document.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, content, instruction, language } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!content || typeof content !== "string" || content.length > 80000) {
      return new Response(JSON.stringify({ error: "Invalid content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = REVISE_ACTIONS[action] || REVISE_ACTIONS.rewrite;
    if (action === "translate") {
      systemPrompt = `Translate to ${language || "English"}. Preserve Markdown. Return ONLY the document.`;
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
        model: action === "polish_professional" || action === "make_formal" ? "openai/gpt-5" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
      }),
    });

    if (!response.ok) {
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
