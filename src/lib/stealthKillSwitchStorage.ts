export const STEALTH_KILL_SWITCH_KEY = "shadowtalk_stealth_kill_switch";

export type StealthKillSwitchPersisted = {
  isStealthMode: boolean;
  lastActivated: string | null;
  totalBlockedAllTime: number;
};

export function loadStealthKillSwitch(): StealthKillSwitchPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STEALTH_KILL_SWITCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StealthKillSwitchPersisted;
    if (typeof parsed.isStealthMode !== "boolean") return null;
    return {
      isStealthMode: parsed.isStealthMode,
      lastActivated: parsed.lastActivated ?? null,
      totalBlockedAllTime: parsed.totalBlockedAllTime ?? 0,
    };
  } catch {
    return null;
  }
}

export function saveStealthKillSwitch(state: StealthKillSwitchPersisted): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STEALTH_KILL_SWITCH_KEY, JSON.stringify(state));
}

export function clearStealthKillSwitch(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STEALTH_KILL_SWITCH_KEY);
}
