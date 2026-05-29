/**
 * Lightweight client-side agentic metrics (localStorage).
 * Sync to analytics backend when available.
 */

export type AgenticMetricEvent =
  | "tool_detected"
  | "tool_confirmed"
  | "tool_run"
  | "tool_complete"
  | "tool_error"
  | "chat_stream_start"
  | "chat_stream_complete"
  | "mission_start"
  | "mission_complete"
  | "mission_abandon";

const STORAGE_KEY = "shadowtalk_agentic_metrics_v1";
const MAX_EVENTS = 500;

export interface AgenticMetricRecord {
  event: AgenticMetricEvent;
  ts: number;
  tool?: string;
  meta?: Record<string, string | number | boolean>;
}

function readAll(): AgenticMetricRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgenticMetricRecord[];
  } catch {
    return [];
  }
}

function writeAll(events: AgenticMetricRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* quota */
  }
}

export function trackAgenticEvent(
  event: AgenticMetricEvent,
  meta?: Record<string, string | number | boolean> & { tool?: string }
) {
  const record: AgenticMetricRecord = {
    event,
    ts: Date.now(),
    tool: meta?.tool as string | undefined,
    meta,
  };
  const next = [...readAll(), record];
  writeAll(next);

  if (import.meta.env.DEV) {
    console.debug("[agentic-metrics]", record);
  }
}

/** Summary for admin / debug — tool run rate proxy in-session */
export function getAgenticMetricsSummary() {
  const events = readAll();
  const sessions = new Set(
    events.map((e) => Math.floor(e.ts / (30 * 60 * 1000)))
  );
  const toolRuns = events.filter((e) => e.event === "tool_run" || e.event === "tool_complete").length;
  const streams = events.filter((e) => e.event === "chat_stream_complete").length;
  const missionsDone = events.filter((e) => e.event === "mission_complete").length;
  const missionsStart = events.filter((e) => e.event === "mission_start").length;

  return {
    totalEvents: events.length,
    sessionBuckets: sessions.size,
    toolRuns,
    streams,
    missionCompletionRate:
      missionsStart > 0 ? Math.round((missionsDone / missionsStart) * 100) : 0,
    toolRunRateProxy:
      streams > 0 ? Math.round((toolRuns / streams) * 100) : 0,
  };
}
