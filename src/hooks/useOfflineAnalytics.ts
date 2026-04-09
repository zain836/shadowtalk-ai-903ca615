import { useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

/**
 * Offline Analytics Queue — Tracks usage events locally and batch-syncs
 * to the cloud when connectivity is restored. Enables "Offline User Behavior Reports".
 */

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  data: Record<string, string | number | boolean>;
  timestamp: string;
  synced: boolean;
  sessionId: string;
}

export type AnalyticsEventType =
  | 'chat_message' | 'research_query' | 'code_execution'
  | 'strategy_analysis' | 'knowledge_search' | 'model_load'
  | 'voice_session' | 'file_upload' | 'tool_usage'
  | 'entity_extracted' | 'feature_used' | 'session_start'
  | 'session_end' | 'error_occurred';

export interface AnalyticsSummary {
  totalEvents: number;
  pendingSync: number;
  eventsByType: { type: string; count: number }[];
  sessionsCount: number;
  avgSessionDuration: number;
  topFeatures: { feature: string; count: number }[];
  lastSyncAt: string | null;
}

const DB_NAME = 'shadow-offline-analytics';
const EVENTS_STORE = 'events';
const META_STORE = 'meta';

export const useOfflineAnalytics = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const dbRef = useRef<IDBPDatabase | null>(null);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const getDb = useCallback(async () => {
    if (dbRef.current) return dbRef.current;
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
          store.createIndex('by-type', 'eventType');
          store.createIndex('by-synced', 'synced');
          store.createIndex('by-session', 'sessionId');
          store.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      },
    });
    dbRef.current = db;
    return db;
  }, []);

  // Track an analytics event
  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    data: Record<string, string | number | boolean> = {}
  ) => {
    const db = await getDb();
    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      sessionId: sessionIdRef.current,
    };
    await db.put(EVENTS_STORE, event);
  }, [getDb]);

  // Get analytics summary
  const loadSummary = useCallback(async () => {
    const db = await getDb();
    const allEvents: AnalyticsEvent[] = await db.getAll(EVENTS_STORE);
    const unsyncedEvents = allEvents.filter(e => !e.synced);

    // Event counts by type
    const typeCounts = new Map<string, number>();
    for (const e of allEvents) {
      typeCounts.set(e.eventType, (typeCounts.get(e.eventType) || 0) + 1);
    }

    // Session analysis
    const sessions = new Map<string, { start: string; end: string }>();
    for (const e of allEvents) {
      const existing = sessions.get(e.sessionId);
      if (!existing) {
        sessions.set(e.sessionId, { start: e.timestamp, end: e.timestamp });
      } else {
        if (e.timestamp < existing.start) existing.start = e.timestamp;
        if (e.timestamp > existing.end) existing.end = e.timestamp;
      }
    }

    const durations = Array.from(sessions.values()).map(s =>
      new Date(s.end).getTime() - new Date(s.start).getTime()
    );
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Feature usage
    const featureCounts = new Map<string, number>();
    for (const e of allEvents.filter(e => e.eventType === 'feature_used' || e.eventType === 'tool_usage')) {
      const feature = String(e.data.feature || e.data.tool || e.eventType);
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
    }

    // Last sync time
    const meta = await db.get(META_STORE, 'last_sync');

    const result: AnalyticsSummary = {
      totalEvents: allEvents.length,
      pendingSync: unsyncedEvents.length,
      eventsByType: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      sessionsCount: sessions.size,
      avgSessionDuration: avgDuration,
      topFeatures: Array.from(featureCounts.entries())
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      lastSyncAt: meta?.value || null,
    };

    setSummary(result);
    return result;
  }, [getDb]);

  // Batch sync pending events to cloud
  const syncToCloud = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const db = await getDb();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSyncing(false);
        return;
      }

      // Get unsynced events
      const allEventsForSync: AnalyticsEvent[] = await db.getAll(EVENTS_STORE);
      const unsyncedEvents = allEventsForSync.filter(e => !e.synced);
      if (unsyncedEvents.length === 0) {
        setSyncing(false);
        return;
      }

      // Batch insert into offline_session_analytics
      const sessionMap = new Map<string, AnalyticsEvent[]>();
      for (const e of unsyncedEvents) {
        const list = sessionMap.get(e.sessionId) || [];
        list.push(e);
        sessionMap.set(e.sessionId, list);
      }

      for (const [sessionId, events] of sessionMap) {
        const sorted = events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const features = [...new Set(events.map(e => e.eventType))];

        await supabase.from('offline_session_analytics').upsert({
          user_id: user.id,
          session_start: sorted[0].timestamp,
          session_end: sorted[sorted.length - 1].timestamp,
          messages_sent: events.filter(e => e.eventType === 'chat_message').length,
          features_used: features,
          model_used: String(events.find(e => e.data.model)?.data.model || 'unknown'),
          duration_ms: new Date(sorted[sorted.length - 1].timestamp).getTime() - new Date(sorted[0].timestamp).getTime(),
          was_synced: true,
          synced_at: new Date().toISOString(),
          metadata: { event_count: events.length, session_id: sessionId },
        }, { onConflict: 'id' });
      }

      // Mark as synced
      const tx = db.transaction(EVENTS_STORE, 'readwrite');
      for (const e of unsyncedEvents) {
        await tx.store.put({ ...e, synced: true });
      }
      await tx.done;

      // Update last sync time
      await db.put(META_STORE, { key: 'last_sync', value: new Date().toISOString() });

      await loadSummary();
    } catch (err) {
      console.error('Analytics sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [getDb, syncing, loadSummary]);

  // Clear synced events to free space
  const clearSyncedEvents = useCallback(async () => {
    const db = await getDb();
    const allEvents: AnalyticsEvent[] = await db.getAll(EVENTS_STORE);
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    for (const e of allEvents) {
      if (e.synced) await tx.store.delete(e.id);
    }
    await tx.done;
    await loadSummary();
  }, [getDb, loadSummary]);

  // Clear all analytics
  const clearAll = useCallback(async () => {
    const db = await getDb();
    await db.clear(EVENTS_STORE);
    await db.clear(META_STORE);
    setSummary(null);
  }, [getDb]);

  return {
    summary,
    syncing,
    trackEvent,
    loadSummary,
    syncToCloud,
    clearSyncedEvents,
    clearAll,
  };
};
