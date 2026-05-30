/**
 * Plain offline chat — IndexedDB history without E2EE vault (device-local only).
 */

export function isPlainOfflineChatMode(opts: {
  e2eeUnlocked: boolean;
  isOffline: boolean;
  hasOfflineSession: boolean;
}): boolean {
  if (opts.e2eeUnlocked) return false;
  if (opts.isOffline || !navigator.onLine) return true;
  if (opts.hasOfflineSession) return true;
  return false;
}
