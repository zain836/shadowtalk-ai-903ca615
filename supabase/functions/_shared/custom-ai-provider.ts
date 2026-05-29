/**
 * Routes chat/completions requests to the user's BYOK provider or ShadowTalk default gateway.
 */

export type CustomAiProvider = "lovable" | "gemini" | "openrouter" | "kimi";

export interface CustomAiConfig {
  provider: CustomAiProvider;
  apiKey: string;
  model?: string;
}

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_OPENAI = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
const MOONSHOT = "https://api.moonshot.cn/v1/chat/completions";

export function parseCustomAi(body: Record<string, unknown>): CustomAiConfig | null {
  const raw = body.customAi as CustomAiConfig | undefined;
  if (!raw?.apiKey || typeof raw.apiKey !== "string") return null;
  if (raw.apiKey.length < 10 || raw.apiKey.length > 512) return null;
  const provider = raw.provider;
  if (provider !== "gemini" && provider !== "openrouter" && provider !== "kimi" && provider !== "lovable") {
    return null;
  }
  if (provider === "lovable") return null;
  return {
    provider,
    apiKey: raw.apiKey.trim(),
    model: typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : undefined,
  };
}

export function resolveModel(customAi: CustomAiConfig | null, requested?: string): string {
  if (!customAi) return requested || "google/gemini-2.5-flash";
  if (customAi.model) return customAi.model;
  switch (customAi.provider) {
    case "gemini":
      return "gemini-2.0-flash";
    case "openrouter":
      return requested || "google/gemini-2.0-flash-001";
    case "kimi":
      return "moonshot-v1-8k";
    default:
      return requested || "google/gemini-2.5-flash";
  }
}

export function getChatEndpoint(
  customAi: CustomAiConfig | null,
  lovableApiKey: string,
): { url: string; headers: Record<string, string> } {
  if (!customAi) {
    return {
      url: LOVABLE_GATEWAY,
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
    };
  }

  switch (customAi.provider) {
    case "gemini":
      return {
        url: GEMINI_OPENAI,
        headers: {
          Authorization: `Bearer ${customAi.apiKey}`,
          "Content-Type": "application/json",
        },
      };
    case "openrouter":
      return {
        url: OPENROUTER,
        headers: {
          Authorization: `Bearer ${customAi.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://shadowtalk.ai",
          "X-Title": "ShadowTalk AI",
        },
      };
    case "kimi":
      return {
        url: MOONSHOT,
        headers: {
          Authorization: `Bearer ${customAi.apiKey}`,
          "Content-Type": "application/json",
        },
      };
    default:
      return {
        url: LOVABLE_GATEWAY,
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
      };
  }
}

/** OpenAI-compatible chat completions POST */
export async function customAiChatCompletions(
  customAi: CustomAiConfig | null,
  lovableApiKey: string,
  payload: Record<string, unknown>,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const { url, headers } = getChatEndpoint(customAi, lovableApiKey);
  const model = resolveModel(customAi, payload.model as string | undefined);
  return fetchFn(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...payload, model }),
  });
}

export function getEvaluatorApiKey(customAi: CustomAiConfig | null, lovableApiKey: string): string {
  return customAi?.apiKey ?? lovableApiKey;
}
