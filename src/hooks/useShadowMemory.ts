import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase, DBSchema } from 'idb';

// ── Schema ──────────────────────────────────────────────────────────
export type ActivityCategory =
  | 'chat'
  | 'navigation'
  | 'feature'
  | 'vault'
  | 'search'
  | 'upload'
  | 'voice'
  | 'code'
  | 'settings'
  | 'auth'
  | 'system';

export interface ShadowActivity {
  id: string;
  category: ActivityCategory;
  action: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO
}

interface ShadowMemoryDB extends DBSchema {
  activities: {
    key: string;
    value: ShadowActivity;
    indexes: {
      'by-timestamp': string;
      'by-category': ActivityCategory;
    };
  };
}

const DB_NAME = 'shadowtalk-memory';
const DB_VERSION = 1;

// ── Hook ────────────────────────────────────────────────────────────
export const useShadowMemory = () => {
  const [db, setDb] = useState<IDBPDatabase<ShadowMemoryDB> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const database = await openDB<ShadowMemoryDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('activities')) {
              const store = db.createObjectStore('activities', { keyPath: 'id' });
              store.createIndex('by-timestamp', 'timestamp');
              store.createIndex('by-category', 'category');
            }
          },
        });
        setDb(database);
        setIsReady(true);
      } catch (e) {
        console.error('[ShadowMemory] Init failed:', e);
      }
    };
    init();
    return () => { db?.close(); };
  }, []);

  // ── Log an activity ───────────────────────────────────────────────
  const log = useCallback(
    async (category: ActivityCategory, action: string, detail?: string, metadata?: Record<string, unknown>) => {
      if (!db) return;
      const entry: ShadowActivity = {
        id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category,
        action,
        detail,
        metadata,
        timestamp: new Date().toISOString(),
      };
      try {
        await db.put('activities', entry);
      } catch (e) {
        console.error('[ShadowMemory] Log failed:', e);
      }
    },
    [db],
  );

  // ── Query activities ──────────────────────────────────────────────
  const getActivities = useCallback(
    async (opts?: { category?: ActivityCategory; limit?: number; since?: string }): Promise<ShadowActivity[]> => {
      if (!db) return [];
      try {
        let results: ShadowActivity[];
        if (opts?.category) {
          results = await db.getAllFromIndex('activities', 'by-category', opts.category);
        } else {
          results = await db.getAllFromIndex('activities', 'by-timestamp');
        }
        // newest first
        results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (opts?.since) {
          results = results.filter((r) => r.timestamp >= opts.since!);
        }
        if (opts?.limit) {
          results = results.slice(0, opts.limit);
        }
        return results;
      } catch (e) {
        console.error('[ShadowMemory] Query failed:', e);
        return [];
      }
    },
    [db],
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const getStats = useCallback(async () => {
    if (!db) return { total: 0, categories: {} as Record<string, number> };
    try {
      const all = await db.getAll('activities');
      const categories: Record<string, number> = {};
      all.forEach((a) => {
        categories[a.category] = (categories[a.category] || 0) + 1;
      });
      return { total: all.length, categories };
    } catch {
      return { total: 0, categories: {} as Record<string, number> };
    }
  }, [db]);

  // ── Delete single ─────────────────────────────────────────────────
  const deleteActivity = useCallback(
    async (id: string) => {
      if (!db) return;
      await db.delete('activities', id);
    },
    [db],
  );

  // ── Clear all ─────────────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    if (!db) return;
    const tx = db.transaction('activities', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }, [db]);

  // ── Export helpers ────────────────────────────────────────────────
  const exportJSON = useCallback(async () => {
    const all = await getActivities();
    return JSON.stringify(all, null, 2);
  }, [getActivities]);

  const exportCSV = useCallback(async () => {
    const all = await getActivities();
    const header = 'id,category,action,detail,timestamp\n';
    const rows = all
      .map((a) => `"${a.id}","${a.category}","${a.action}","${(a.detail || '').replace(/"/g, '""')}","${a.timestamp}"`)
      .join('\n');
    return header + rows;
  }, [getActivities]);

  const exportLogs = useCallback(async () => {
    const all = await getActivities();
    return all
      .map((a) => `[${a.timestamp}] [${a.category.toUpperCase()}] ${a.action}${a.detail ? ' — ' + a.detail : ''}`)
      .join('\n');
  }, [getActivities]);

  return {
    isReady,
    log,
    getActivities,
    getStats,
    deleteActivity,
    clearAll,
    exportJSON,
    exportCSV,
    exportLogs,
  };
};
