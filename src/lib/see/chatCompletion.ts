const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChatCompletion(
  accessToken: string,
  userContent: string,
  options?: { model?: string; mode?: string; signal?: AbortSignal }
): Promise<string> {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: userContent }],
      model: options?.model ?? "google/gemini-2.5-flash",
      mode: options?.mode ?? "general",
      stream: true,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(errText || `Chat request failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          const content =
            data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
          if (content) fullContent += content;
        } catch {
          /* ignore malformed SSE */
        }
      }
    }
  }

  return fullContent;
}

export function extractJsonArray<T>(text: string): T[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T[];
  } catch {
    return null;
  }
}
