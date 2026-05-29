const COOKIE_PREFERENCES_KEY = "shadowtalk_cookie_preferences";

/** Local on-device learning always allowed; cloud analytics respect cookie prefs. */
export function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return true;
    const prefs = JSON.parse(raw) as { analytics?: boolean };
    return prefs.analytics !== false;
  } catch {
    return true;
  }
}
