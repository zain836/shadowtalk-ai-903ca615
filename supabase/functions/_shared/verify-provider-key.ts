export type ProviderId =
  | "google"
  | "openai"
  | "anthropic"
  | "xai"
  | "perplexity"
  | "openrouter"
  | "mistral"
  | "groq";

const PROVIDERS: ProviderId[] = [
  "google",
  "openai",
  "anthropic",
  "xai",
  "perplexity",
  "openrouter",
  "mistral",
  "groq",
];

export function isValidProvider(provider: string): provider is ProviderId {
  return (PROVIDERS as string[]).includes(provider);
}

export async function verifyProviderApiKey(
  provider: ProviderId,
  apiKey: string,
): Promise<{ ok: boolean; message: string }> {
  const key = apiKey.trim();
  if (key.length < 10 || key.length > 512) {
    return { ok: false, message: "API key length is invalid" };
  }

  try {
    switch (provider) {
      case "google": {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Reply with OK only." }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          },
        );
        if (!res.ok) return { ok: false, message: "Google rejected this API key" };
        return { ok: true, message: "Google Gemini key verified" };
      }
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { ok: false, message: "OpenAI rejected this API key" };
        return { ok: true, message: "OpenAI key verified" };
      }
      case "anthropic": {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-latest",
            max_tokens: 8,
            messages: [{ role: "user", content: "Say OK" }],
          }),
        });
        if (!res.ok) return { ok: false, message: "Anthropic rejected this API key" };
        return { ok: true, message: "Anthropic key verified" };
      }
      case "openrouter": {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { ok: false, message: "OpenRouter rejected this API key" };
        return { ok: true, message: "OpenRouter key verified" };
      }
      case "perplexity": {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: "Say OK" }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) return { ok: false, message: "Perplexity rejected this API key" };
        return { ok: true, message: "Perplexity key verified" };
      }
      case "xai": {
        const res = await fetch("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { ok: false, message: "xAI rejected this API key" };
        return { ok: true, message: "xAI key verified" };
      }
      case "mistral": {
        const res = await fetch("https://api.mistral.ai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { ok: false, message: "Mistral rejected this API key" };
        return { ok: true, message: "Mistral key verified" };
      }
      case "groq": {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { ok: false, message: "Groq rejected this API key" };
        return { ok: true, message: "Groq key verified" };
      }
      default:
        return { ok: false, message: "Unknown provider" };
    }
  } catch (e) {
    console.error("[verify-provider-key]", provider, e);
    return { ok: false, message: "Could not reach provider to verify key" };
  }
}
