/**
 * Unified local inference: Tier A (SmolLM) + Tier B (Gemma).
 */

import { getGemmaEngine } from "./gemmaEngine";
import { getSmolLMEngine } from "./smollmEngine";
import type { RouterMessage } from "./hybridRouter";

export type LocalEngineTier = "gemma" | "smollm" | "none";

export function getActiveLocalTier(): LocalEngineTier {
  if (getGemmaEngine().isReady) return "gemma";
  if (getSmolLMEngine().isReady) return "smollm";
  return "none";
}

export function isAnyLocalModelReady(): boolean {
  return getActiveLocalTier() !== "none";
}

export async function runLocalChat(
  messages: RouterMessage[],
  onToken?: (t: string) => void,
): Promise<{ content: string; tier: LocalEngineTier }> {
  const gemma = getGemmaEngine();
  if (gemma.isReady) {
    const content = await gemma.chat(messages, { onToken });
    return { content, tier: "gemma" };
  }

  const smol = getSmolLMEngine();
  if (smol.isReady) {
    const content = await smol.chat(messages, onToken);
    return { content, tier: "smollm" };
  }

  throw new Error("No on-device model loaded");
}
