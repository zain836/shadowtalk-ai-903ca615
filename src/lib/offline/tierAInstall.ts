/**
 * Tier A silent install — triggered after signup (no banner).
 */

import { getSmolLMEngine } from "./smollmEngine";

export const SILENT_TIER_A_KEY = "shadowtalk_offline_silent_install";
export const BOOTSTRAP_DONE_KEY = "shadowtalk_offline_tier_a_done";
export const BOOTSTRAP_CONSENT_KEY = "shadowtalk_offline_tier_a_consent";

/** Call after successful signup / first session */
export function enableSilentTierAInstall(): void {
  localStorage.setItem(SILENT_TIER_A_KEY, "1");
  localStorage.setItem(BOOTSTRAP_CONSENT_KEY, "1");
  localStorage.removeItem("shadowtalk_offline_tier_a_skip");
}

export function isSilentTierAEnabled(): boolean {
  return localStorage.getItem(SILENT_TIER_A_KEY) === "1";
}

/** Background download; safe to call without awaiting */
export function startSilentTierAInstall(): void {
  enableSilentTierAInstall();
  if (getSmolLMEngine().isReady || getSmolLMEngine().isLoading) return;

  getSmolLMEngine()
    .ensureLoaded()
    .then((ok) => {
      if (ok) localStorage.setItem(BOOTSTRAP_DONE_KEY, "1");
    })
    .catch((e) => console.warn("[Tier A silent]", e));
}
