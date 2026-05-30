/**
 * Runs chat completion on-device when cloud is unavailable or routing chooses local.
 */

import { decideRoute, type RouterMessage } from "@/lib/offline/hybridRouter";
import { getGemmaEngine } from "@/lib/offline/gemmaEngine";

export type OfflineCompletionSource = "local-gemma" | "local-webllm" | "fallback";

export type OfflineCompletionResult = {
  content: string;
  source: OfflineCompletionSource;
};

const PERSONALITY_HINT: Record<string, string> = {
  friendly: "Warm, approachable tone.",
  professional: "Clear, formal, business-appropriate tone.",
  creative: "Imaginative, vivid language.",
  sarcastic: "Witty with light sarcasm.",
  meticulous: "Precise, thorough, detail-oriented.",
};

function withSystemPrompt(messages: RouterMessage[], personality: string): RouterMessage[] {
  const hint = PERSONALITY_HINT[personality] ?? "Helpful assistant tone.";
  const system: RouterMessage = {
    role: "system",
    content: `You are ShadowTalk AI running fully on the user's device (offline). ${hint} Be concise, accurate, and use markdown when helpful.`,
  };
  const hasSystem = messages.some((m) => m.role === "system");
  return hasSystem ? messages : [system, ...messages];
}

/** Basic canned responses when no local LLM is loaded. */
export function getBasicOfflineFallback(prompt: string): string {
  const normalized = prompt.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings)/i.test(normalized)) {
    return "Hello! I'm in offline mode. Download an on-device model in Profile → Offline AI for full local chat.";
  }
  if (/help|what can you do/i.test(normalized)) {
    return (
      "Offline mode:\n\n" +
      "• **With a downloaded model** — full local AI chat (private, no internet)\n" +
      "• **Without a model** — cached chats, simple math, time/date\n\n" +
      "Go to **Profile → Offline AI** to download Gemma or WebLLM while online."
    );
  }
  if (/\b(what time|current time)\b/i.test(normalized)) {
    return `The current time is: **${new Date().toLocaleTimeString()}**`;
  }
  if (/\b(what date|today|what day)\b/i.test(normalized)) {
    return `Today is: **${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}**`;
  }

  const mathMatch = normalized.match(/(\d+)\s*([+\-*/×÷])\s*(\d+)/);
  if (mathMatch) {
    const [, a, op, b] = mathMatch;
    const n1 = parseFloat(a);
    const n2 = parseFloat(b);
    let result: number;
    switch (op) {
      case "+":
        result = n1 + n2;
        break;
      case "-":
        result = n1 - n2;
        break;
      case "*":
      case "×":
        result = n1 * n2;
        break;
      case "/":
      case "÷":
        result = n2 !== 0 ? n1 / n2 : NaN;
        break;
      default:
        result = NaN;
    }
    if (!isNaN(result)) return `**${n1} ${op} ${n2} = ${result}**`;
  }

  return (
    "I'm offline and no on-device model is loaded yet.\n\n" +
    "Open **Profile → Offline AI** to download a model (~1–3 GB, one-time). " +
    "Your message will work fully once the model is ready."
  );
}

export type RunOfflineCompletionOptions = {
  messages: RouterMessage[];
  personality: string;
  isOnline: boolean;
  onToken?: (token: string) => void;
  /** WebLLM generateResponse from useRobustOfflineAI */
  webLlmGenerate?: (
    messages: RouterMessage[],
    onChunk?: (chunk: string) => void,
  ) => Promise<string>;
  webLlmLoad?: () => Promise<boolean>;
  /** Gemma chat from useGemmaOffline */
  gemmaChat?: (
    messages: RouterMessage[],
    onToken?: (t: string) => void,
  ) => Promise<string>;
};

/**
 * Attempt on-device completion. Returns null if caller should use cloud API.
 */
export async function runOfflineCompletion(
  options: RunOfflineCompletionOptions,
): Promise<OfflineCompletionResult | null> {
  const { messages, personality, isOnline, onToken, webLlmGenerate, webLlmLoad, gemmaChat } =
    options;

  const decision = decideRoute(messages, isOnline);
  const engine = getGemmaEngine();
  const formatted = withSystemPrompt(messages, personality);

  const tryGemma = async (): Promise<OfflineCompletionResult | null> => {
    if (!engine.isReady || !gemmaChat) return null;
    try {
      const content = await gemmaChat(formatted, onToken);
      return { content, source: "local-gemma" };
    } catch (e) {
      console.warn("[OfflineCompletion] Gemma failed:", e);
      return null;
    }
  };

  const tryWebLlm = async (): Promise<OfflineCompletionResult | null> => {
    if (!webLlmGenerate) return null;
    try {
      if (webLlmLoad) await webLlmLoad();
      const content = await webLlmGenerate(
        formatted.map((m) => ({
          ...m,
          role: m.role === "system" ? "system" : m.role,
        })),
        onToken,
      );
      return { content, source: "local-webllm" };
    } catch (e) {
      console.warn("[OfflineCompletion] WebLLM failed:", e);
      return null;
    }
  };

  if (decision.target === "local") {
    const gemma = await tryGemma();
    if (gemma) return gemma;
    const web = await tryWebLlm();
    if (web) return web;
    const lastUser = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    return { content: getBasicOfflineFallback(lastUser), source: "fallback" };
  }

  // Cloud route but network is down — must not call API
  if (!isOnline) {
    const gemma = await tryGemma();
    if (gemma) return gemma;
    const web = await tryWebLlm();
    if (web) return web;
    const lastUser = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    return { content: getBasicOfflineFallback(lastUser), source: "fallback" };
  }

  return null;
}
