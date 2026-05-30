const SHADOW_MODE_KEY = "shadowtalk_shadow_mode";

export function getShadowModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SHADOW_MODE_KEY);
  return stored !== "false";
}

export function applyShadowMode(enabled: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("stealth-mode", enabled);
}

export function setShadowModeEnabled(enabled: boolean): void {
  localStorage.setItem(SHADOW_MODE_KEY, enabled ? "true" : "false");
  applyShadowMode(enabled);
}

export function initShadowMode(): void {
  applyShadowMode(getShadowModeEnabled());
}
