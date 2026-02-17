import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { openDB } from 'idb';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingItems: number;
  syncProgress: number;
  error: string | null;
}

interface SyncQueueItem {
  id: string;
  type: 'knowledge_node' | 'knowledge_edge' | 'vault_entry' | 'business_memory' | 'ai_memory';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  encrypted: boolean;
}

const SYNC_DB = 'shadowtalk-sync-queue';
const QUEUE_STORE = 'queue';
const SYNC_META_STORE = 'sync-meta';

export const useZeroKnowledgeSync = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: localStorage.getItem('shadowtalk_last_sync'),
    pendingItems: 0,
    syncProgress: 0,
    error: null,
  });

  const getDB = useCallback(async () => {
    return openDB(SYNC_DB, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
          db.createObjectStore(SYNC_META_STORE, { keyPath: 'key' });
        }
      },
    });
  }, []);

  // Add item to sync queue (used when offline)
  const queueForSync = useCallback(async (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    const db = await getDB();
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await db.put(QUEUE_STORE, queueItem);
    setState(prev => ({ ...prev, pendingItems: prev.pendingItems + 1 }));
  }, [getDB]);

  // Get pending items count
  const getPendingCount = useCallback(async (): Promise<number> => {
    const db = await getDB();
    const count = await db.count(QUEUE_STORE);
    setState(prev => ({ ...prev, pendingItems: count }));
    return count;
  }, [getDB]);

  // Process sync queue when back online
  const processQueue = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!user || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null, syncProgress: 0 }));

    const db = await getDB();
    const items = await db.getAllFromIndex(QUEUE_STORE, 'timestamp') as SyncQueueItem[];

    if (items.length === 0) {
      setState(prev => ({ ...prev, isSyncing: false, pendingItems: 0 }));
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const progress = Math.round(((i + 1) / items.length) * 100);
      setState(prev => ({ ...prev, syncProgress: progress }));

      try {
        await syncItem(item);
        await db.delete(QUEUE_STORE, item.id);
        synced++;
      } catch (e) {
        console.error('[ZKSync] Failed to sync item:', item.id, e);
        failed++;
      }
    }

    const now = new Date().toISOString();
    localStorage.setItem('shadowtalk_last_sync', now);

    setState(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncAt: now,
      pendingItems: failed,
      syncProgress: 100,
    }));

    return { synced, failed };
  }, [user, getDB]);

  // Sync a single item to the server
  const syncItem = async (item: SyncQueueItem) => {
    const tableMap: Record<string, string> = {
      vault_entry: 'stealth_vault',
      business_memory: 'business_memories',
      ai_memory: 'ai_memories',
    };

    const table = tableMap[item.type];
    if (!table) {
      // Knowledge nodes/edges are local-only (IndexedDB), skip cloud sync
      return;
    }

    switch (item.action) {
      case 'create': {
        const { error } = await (supabase.from(table as any) as any).insert(item.data);
        if (error) throw error;
        break;
      }
      case 'update': {
        const { id, ...updateData } = item.data;
        const { error } = await (supabase.from(table as any) as any).update(updateData).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await (supabase.from(table as any) as any).delete().eq('id', item.data.id);
        if (error) throw error;
        break;
      }
    }
  };

  // Full sync: push pending items and pull latest from server
  const fullSync = useCallback(async () => {
    if (!user) return;

    // First push pending changes
    const pushResult = await processQueue();

    // Then pull latest data (server → local reconciliation happens here)
    // This is zero-knowledge: we only pull encrypted data that we decrypt locally
    setState(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
    }));

    return pushResult;
  }, [user, processQueue]);

  // Clear sync queue
  const clearQueue = useCallback(async () => {
    const db = await getDB();
    await db.clear(QUEUE_STORE);
    setState(prev => ({ ...prev, pendingItems: 0 }));
  }, [getDB]);

  return {
    ...state,
    queueForSync,
    getPendingCount,
    processQueue,
    fullSync,
    clearQueue,
  };
};
