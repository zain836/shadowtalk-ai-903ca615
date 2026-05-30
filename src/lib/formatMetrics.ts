/** Compact display for live counts (e.g. 1500 → "1.5K+"). */
export function formatMetricCount(value: number): string {
  if (value <= 0) return "0";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K+`;
  }
  return `${value}+`;
}

export function formatTractionUsers(totalUsers: number): string {
  if (totalUsers <= 0) return "Growing community";
  return `${formatMetricCount(totalUsers)} creators`;
}

export function formatTractionDaily(dau: number): string {
  if (dau <= 0) return "Usage updates daily";
  return `${formatMetricCount(dau)} daily active`;
}
