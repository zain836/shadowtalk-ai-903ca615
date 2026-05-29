/** SSE streaming helpers for the chat edge function */

export type ChatRoleMessage = { role: "user" | "assistant" | "system"; content: string };

export interface AgenticChatBody {
  messages: ChatRoleMessage[];
  personality: string;
  mode: string;
  webSearch?: boolean;
  searchQuery?: string;
  deepResearch?: boolean;
  researchQuery?: string;
  decodeImage?: boolean;
  imageToAnalyze?: string;
  modePrompt?: string;
  agenticReact?: boolean;
}

export function buildAgenticChatBody(
  messages: ChatRoleMessage[],
  opts: {
    personality: string;
    mode: string;
    webSearch?: boolean;
    searchQuery?: string;
    deepResearch?: boolean;
    researchQuery?: string;
    decodeImage?: boolean;
    imageDataUrl?: string;
    agenticSystemHint?: boolean;
    improvementHint?: string;
  }
): AgenticChatBody {
  const body: AgenticChatBody = {
    messages,
    personality: opts.personality,
    mode: opts.mode,
  };

  if (opts.webSearch) {
    body.webSearch = true;
    body.searchQuery = opts.searchQuery?.slice(0, 500);
  }
  if (opts.deepResearch) {
    body.deepResearch = true;
    body.researchQuery = opts.researchQuery?.slice(0, 500);
  }
  if (opts.decodeImage && opts.imageDataUrl) {
    body.decodeImage = true;
    body.imageToAnalyze = opts.imageDataUrl;
  }
  const agenticBase =
    "You are ShadowTalk, a top-tier agentic AI. Break hard problems into steps, name tools you would use, and deliver finished work (drafts, plans, code, tables)—not vague advice. Be direct and execution-focused.";
  const hint = opts.improvementHint?.trim();
  if (opts.agenticSystemHint) {
    body.modePrompt = hint ? `${agenticBase}\n\n## Learned preferences\n${hint}` : agenticBase;
    body.agenticReact = true;
  } else if (hint) {
    body.modePrompt = hint;
  }

  return body;
}

/** Parse OpenAI-style SSE stream from /functions/v1/chat */
export async function consumeChatSSE(
  resp: Response,
  onDelta: (accumulated: string) => void
): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let assistantContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const data = JSON.parse(line.slice(6));
        const delta = data.choices?.[0]?.delta?.content;
        if (delta) {
          assistantContent += delta;
          onDelta(assistantContent);
        }
      } catch {
        /* partial JSON line */
      }
    }
  }

  return assistantContent;
}
