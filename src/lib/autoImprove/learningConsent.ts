const LEARNING_ENABLED_KEY = "shadowtalk_learning_enabled";

/** On-device adaptive learning (IndexedDB events + profile). Independent of analytics cookies. */
export function isLearningEnabled(): boolean {
  try {
    const raw = localStorage.getItem(LEARNING_ENABLED_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function setLearningEnabled(enabled: boolean): void {
  localStorage.setItem(LEARNING_ENABLED_KEY, enabled ? "1" : "0");
}
