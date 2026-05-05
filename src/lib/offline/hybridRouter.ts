/**
 * Hybrid Cloud-Local Router (Option B from Shadowoffline blueprint)
 * --------------------------------------------------
 * Decides whether a chat completion runs on-device (Gemma via WebGPU) or in
 * the cloud (Lovable AI Gateway). The decision is based on:
 *   1. Network connectivity   → offline ⇒ local (if engine ready)
 *   2. User preference        → "force-local" ⇒ local
 *   3. Engine readiness       → not ready ⇒ cloud
 *   4. Heuristic complexity   → very long / structured → cloud
 *
 * This module purposefully does NOT call the cloud itself; instead it returns
 * a routing decision so the existing ChatbotPage cloud pipeline keeps owning
 * the network/auth concerns.
 */

import { getGemmaEngine } from "./gemmaEngine";

export type RoutingMode = "auto" | "local-only" | "cloud-only";

export type RoutingDecision = {
  target: "local" | "cloud";
  reason: string;
};

export type RouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const PREF_KEY = "shadowtalk_offline_pref";
const PREF_MODEL_KEY = "shadowtalk_offline_model";

export function getRoutingMode(): RoutingMode {
  const v = localStorage.getItem(PREF_KEY);
  return v === "local-only" || v === "cloud-only" ? v : "auto";
}

export function setRoutingMode(mode: RoutingMode) {
  localStorage.setItem(PREF_KEY, mode);
}

export type LocalModelKey = "default" | "e2b" | "e4b";

export function getPreferredLocalModel(): LocalModelKey {
  const v = localStorage.getItem(PREF_MODEL_KEY);
  if (v === "e2b" || v === "e4b" || v === "default") return v;
  // Migrate legacy values
  return "e2b";
}

export function setPreferredLocalModel(key: LocalModelKey) {
  localStorage.setItem(PREF_MODEL_KEY, key);
}

function isComplex(messages: RouterMessage[]): boolean {
  const last = messages[messages.length - 1]?.content ?? "";
  if (last.length > 4000) return true; // very long prompt
  // Multi-turn with very large context — cloud handles long context better
  const totalChars = messages.reduce((s, m) => s + m.content.length, 0);
  if (totalChars > 12000) return true;
  return false;
}

export function decideRoute(
  messages: RouterMessage[],
  isOnline: boolean,
): RoutingDecision {
  const mode = getRoutingMode();
  const engine = getGemmaEngine();

  if (mode === "cloud-only") {
    return { target: "cloud", reason: "User forced cloud-only mode" };
  }

  if (!isOnline) {
    if (engine.isReady) return { target: "local", reason: "Offline — using on-device Gemma" };
    return {
      target: "cloud",
      reason: "Offline but local model not loaded — will surface offline notice",
    };
  }

  if (mode === "local-only") {
    if (engine.isReady) return { target: "local", reason: "User forced local-only mode" };
    return {
      target: "cloud",
      reason: "Local model not loaded yet — falling back to cloud this time",
    };
  }

  // Auto mode (online)
  if (engine.isReady && !isComplex(messages)) {
    return { target: "local", reason: "Auto: simple query handled on-device for privacy" };
  }
  return { target: "cloud", reason: "Auto: cloud chosen (complex query or model not loaded)" };
}
