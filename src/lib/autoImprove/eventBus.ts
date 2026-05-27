import type { BehaviorEvent, BehaviorEventType } from "./types";
import { appendBehaviorEvent } from "./eventStore";

type BusListener = (event: BehaviorEvent) => void;

const listeners = new Set<BusListener>();

export function subscribeAutoImprove(listener: BusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Unified event bus: persist locally and notify subscribers. */
export async function publishAutoImproveEvent(
  type: BehaviorEventType,
  payload?: Record<string, string | number | boolean>
): Promise<BehaviorEvent> {
  const event: BehaviorEvent = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    type,
    payload,
  };
  await appendBehaviorEvent(event);
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.warn("[AutoImprove] listener error", e);
    }
  });
  return event;
}
