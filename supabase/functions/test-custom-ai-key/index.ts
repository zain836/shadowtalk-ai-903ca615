import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { customAiChatCompletions, type CustomAiConfig } from "../_shared/custom-ai-provider.ts";
import { isValidProvider, verifyProviderApiKey, type ProviderId } from "../_shared/verify-provider-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Map UI / legacy provider ids to verification + custom-ai-provider ids */
function normalizeProvider(provider: string): {
  verifyId: ProviderId | null;
  legacyId: CustomAiConfig["provider"] | null;
} {
  const map: Record<string, { verifyId: ProviderId; legacyId?: CustomAiConfig["provider"] }> = {
    google: { verifyId: "google", legacyId: "gemini" },
    gemini: { verifyId: "google", legacyId: "gemini" },
    openai: { verifyId: "openai" },
    anthropic: { verifyId: "anthropic" },
    xai: { verifyId: "xai" },
    perplexity: { verifyId: "perplexity" },
    openrouter: { verifyId: "openrouter", legacyId: "openrouter" },
    mistral: { verifyId: "mistral" },
    groq: { verifyId: "groq" },
    kimi: { verifyId: "openai", legacyId: "kimi" },
  };
  const entry = map[provider];
  if (!entry) return { verifyId: null, legacyId: null };
  return { verifyId: entry.verifyId, legacyId: entry.legacyId ?? null };
}

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

    const { verifyId, legacyId } = normalizeProvider(String(provider));

    if (verifyId && isValidProvider(verifyId)) {
      const direct = await verifyProviderApiKey(verifyId, apiKey);
      if (direct.ok) {
        return new Response(
          JSON.stringify({ success: true, message: direct.message, preview: "OK" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!legacyId) {
        return new Response(
          JSON.stringify({ success: false, error: direct.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!legacyId) {
      return new Response(JSON.stringify({ success: false, error: "Unsupported provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customAi: CustomAiConfig = {
      provider: legacyId,
      apiKey: apiKey.trim(),
      model: typeof model === "string" ? model.trim() : undefined,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || "unused";
    const response = await customAiChatCompletions(customAi, lovableKey, {
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
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
