import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { customAiChatCompletions, type CustomAiConfig } from "../_shared/custom-ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey, model } = await req.json();
    if (!provider || !apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ success: false, error: "provider and apiKey required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customAi: CustomAiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: typeof model === "string" ? model.trim() : undefined,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || "unused";
    const response = await customAiChatCompletions(customAi, lovableKey, {
      messages: [{ role: "user", content: 'Reply with exactly: OK' }],
      max_tokens: 16,
      stream: false,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[test-custom-ai-key]", provider, response.status, errText.slice(0, 200));
      return new Response(
        JSON.stringify({ success: false, error: `Provider returned ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ success: false, error: "Empty response from provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, preview: String(content).slice(0, 80) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[test-custom-ai-key]", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Test failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
