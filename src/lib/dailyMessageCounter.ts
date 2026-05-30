const keyForToday = () => `shadowtalk-daily-msgs-${new Date().toISOString().slice(0, 10)}`;

export function getDailyMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(keyForToday());
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function incrementDailyMessageCount(): number {
  const next = getDailyMessageCount() + 1;
  try {
    localStorage.setItem(keyForToday(), String(next));
  } catch {
    /* ignore */
  }
  return next;
}
