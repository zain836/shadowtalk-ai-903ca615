/**
 * Optional CDN base for Tier A/B model shards (Workbox + future custom loader).
 * Set VITE_OFFLINE_MODEL_CDN_URL=https://cdn.yourdomain.com/mlc-models
 */

export function getOfflineModelCdnOrigin(): string | null {
  const url = import.meta.env.VITE_OFFLINE_MODEL_CDN_URL as string | undefined;
  if (!url?.trim()) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function getOfflineModelCdnPattern(): RegExp | null {
  const origin = getOfflineModelCdnOrigin();
  if (!origin) return null;
  const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}/.*`, "i");
}

/** Hugging Face / MLC fallbacks when not using own CDN */
export const HF_MLC_MODEL_URL_PATTERN =
  /^https:\/\/(huggingface\.co|cdn-lfs\.hf\.co|.*\.hf\.co)\/.*(mlc-ai|resolve)\/.*$/i;

export const MLC_WASM_PATTERN = /^https:\/\/cdn\.jsdelivr\.net\/.*(@mlc-ai|mlc-ai)\/.*$/i;
