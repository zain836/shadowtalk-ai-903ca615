import { decryptApiKey } from "./byok-crypto.ts";
import type { ProviderId } from "./verify-provider-key.ts";

export async function fetchUserProviderKey(
  admin: { from: (t: string) => any },
  userId: string,
  provider?: string,
): Promise<{ provider: ProviderId; apiKey: string } | null> {
  let query = admin
    .from("user_provider_keys")
    .select("provider, key_ciphertext, is_active, is_default")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (provider) {
    query = query.eq("provider", provider);
  } else {
    query = query.order("is_default", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data?.key_ciphertext) return null;

  const apiKey = await decryptApiKey(data.key_ciphertext);
  return { provider: data.provider as ProviderId, apiKey };
}

function openAiCompatibleUrl(provider: ProviderId): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "perplexity":
      return "https://api.perplexity.ai/chat/completions";
    case "groq":
      return "https://api.groq.com/openai/v1/chat/completions";
    case "mistral":
      return "https://api.mistral.ai/v1/chat/completions";
    case "xai":
      return "https://api.x.ai/v1/chat/completions";
    default:
      return "https://api.openai.com/v1/chat/completions";
  }
}

function defaultModel(provider: ProviderId): string {
  const map: Record<ProviderId, string> = {
    google: "gemini-2.0-flash",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-haiku-latest",
    xai: "grok-2-latest",
    perplexity: "sonar",
    openrouter: "openai/gpt-4o-mini",
    mistral: "mistral-small-latest",
    groq: "llama-3.3-70b-versatile",
  };
  return map[provider];
}

/** Stream chat completion using the user's own API key */
export async function streamWithUserKey(
  provider: ProviderId,
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: unknown }>,
): Promise<Response> {
  const trimmed = messages.map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : m.content,
  }));

  if (provider === "google") {
    const contents = trimmed
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content) }],
      }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7 },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini BYOK error: ${res.status} ${errText}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const sse = `data: ${JSON.stringify({
                  choices: [{ delta: { content: text } }],
                })}\n\n`;
                controller.enqueue(encoder.encode(sse));
              }
            } catch {
              /* skip malformed chunks */
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: defaultModel(provider),
        max_tokens: 4096,
        system: systemPrompt,
        messages: trimmed.filter((m) => m.role !== "system").map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content),
        })),
        stream: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic BYOK error: ${res.status} ${errText}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                const sse = `data: ${JSON.stringify({
                  choices: [{ delta: { content: parsed.delta.text } }],
                })}\n\n`;
                controller.enqueue(encoder.encode(sse));
              }
            } catch {
              /* skip */
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const url = openAiCompatibleUrl(provider);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider === "openrouter"
        ? { "HTTP-Referer": "https://shadowtalk.app", "X-Title": "ShadowTalk" }
        : {}),
    },
    body: JSON.stringify({
      model: defaultModel(provider),
      messages: [{ role: "system", content: systemPrompt }, ...trimmed.filter((m) => m.role !== "system")],
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`BYOK ${provider} error: ${res.status} ${errText}`);
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
