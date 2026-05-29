const METRICS_KEY = "shadowtalk_auto_improve_metrics";

export interface AutoImproveMetrics {
  eventsCaptured: number;
  analysesRun: number;
  defaultsApplied: number;
  hintsInjected: number;
  lastAnalysisAt?: string;
}

export function readAutoImproveMetrics(): AutoImproveMetrics {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return { eventsCaptured: 0, analysesRun: 0, defaultsApplied: 0, hintsInjected: 0 };
    return JSON.parse(raw) as AutoImproveMetrics;
  } catch {
    return { eventsCaptured: 0, analysesRun: 0, defaultsApplied: 0, hintsInjected: 0 };
  }
}

export function bumpMetric(field: keyof AutoImproveMetrics, delta = 1): void {
  const m = readAutoImproveMetrics();
  if (field === "lastAnalysisAt") {
    m.lastAnalysisAt = new Date().toISOString();
  } else if (typeof m[field] === "number") {
    (m[field] as number) += delta;
  }
  localStorage.setItem(METRICS_KEY, JSON.stringify(m));
}
