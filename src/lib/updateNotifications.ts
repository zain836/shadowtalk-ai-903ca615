/** Last app update the user has seen (guests + logged-in fallback) */
export const LAST_SEEN_UPDATE_KEY = "shadowtalk_last_seen_update_id";
export const UPDATE_NOTIF_PROMPT_KEY = "shadowtalk_update_notif_prompted";

export function getLastSeenUpdateId(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_UPDATE_KEY);
  } catch {
    return null;
  }
}

export function markUpdateSeen(updateId: string): void {
  try {
    localStorage.setItem(LAST_SEEN_UPDATE_KEY, updateId);
  } catch {
    /* ignore */
  }
}

export function hasBeenPromptedForUpdates(): boolean {
  try {
    return localStorage.getItem(UPDATE_NOTIF_PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPromptedForUpdates(): void {
  try {
    localStorage.setItem(UPDATE_NOTIF_PROMPT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export type AppUpdateRow = {
  id: string;
  source: string;
  version: string | null;
  title: string;
  message: string;
  action_url: string | null;
  published_at: string;
};
