import { useState, useCallback, useEffect, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  metadata?: Record<string, unknown>;
}

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: Date | null;
  error: string | null;
}

const DB_NAME = 'shadowtalk-sync';
const QUEUE_STORE = 'sync-queue';
const SYNC_LOG_STORE = 'sync-log';

export const useOfflineSync = () => {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncAt: null,
    error: null,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  const getDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('priority', 'priority');
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(SYNC_LOG_STORE)) {
          db.createObjectStore(SYNC_LOG_STORE, { keyPath: 'id' });
        }
      },
    });
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      syncPendingMessages();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial counts
    loadCounts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const loadCounts = async () => {
    try {
      const db = await getDB();
      const pending = await db.countFromIndex(QUEUE_STORE, 'status', 'pending');
      const failed = await db.countFromIndex(QUEUE_STORE, 'status', 'failed');
      setState(prev => ({ ...prev, pendingCount: pending, failedCount: failed }));
    } catch (err) {
      console.error('Failed to load sync counts:', err);
    }
  };

  const addToQueue = useCallback(async (
    message: Omit<QueuedMessage, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<string> => {
    const db = await getDB();
    
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    await db.put(QUEUE_STORE, queuedMessage);
    
    setState(prev => ({ ...prev, pendingCount: prev.pendingCount + 1 }));
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      syncPendingMessages();
    }

    return queuedMessage.id;
  }, []);

  const syncPendingMessages = useCallback(async (): Promise<void> => {
    if (isSyncingRef.current || !navigator.onLine) return;

    isSyncingRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const db = await getDB();
      
      // Get pending messages sorted by priority and creation time
      const pendingMessages = await db.getAllFromIndex(QUEUE_STORE, 'status', 'pending');
      
      // Sort by priority (high first) then by creation time
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      pendingMessages.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      let syncedCount = 0;
      let failedCount = 0;

      for (const message of pendingMessages) {
        try {
          // Mark as syncing
          message.status = 'syncing';
          await db.put(QUEUE_STORE, message);

          // Simulate sync (in real implementation, this would call Supabase)
          // For now, we'll just mark them as synced after a brief delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Mark as synced
          message.status = 'synced';
          await db.put(QUEUE_STORE, message);
          
          // Log the sync
          await db.put(SYNC_LOG_STORE, {
            id: `log-${Date.now()}`,
            messageId: message.id,
            syncedAt: new Date(),
            success: true,
          });

          syncedCount++;
        } catch (err) {
          // Handle individual message sync failure
          message.retryCount += 1;
          if (message.retryCount >= message.maxRetries) {
            message.status = 'failed';
            failedCount++;
          } else {
            message.status = 'pending'; // Retry later
          }
          await db.put(QUEUE_STORE, message);
        }
      }

      // Clean up old synced messages (keep last 100)
      const syncedMessages = await db.getAllFromIndex(QUEUE_STORE, 'status', 'synced');
      if (syncedMessages.length > 100) {
        const toDelete = syncedMessages.slice(0, syncedMessages.length - 100);
        for (const msg of toDelete) {
          await db.delete(QUEUE_STORE, msg.id);
        }
      }

      // Update counts
      await loadCounts();

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Sync failed';
      setState(prev => ({ ...prev, isSyncing: false, error }));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const retryFailed = useCallback(async (): Promise<void> => {
    const db = await getDB();
    const failedMessages = await db.getAllFromIndex(QUEUE_STORE, 'status', 'failed');

    for (const message of failedMessages) {
      message.status = 'pending';
      message.retryCount = 0;
      await db.put(QUEUE_STORE, message);
    }

    await loadCounts();
    
    if (navigator.onLine) {
      syncPendingMessages();
    }
  }, [syncPendingMessages]);

  const clearQueue = useCallback(async (): Promise<void> => {
    const db = await getDB();
    await db.clear(QUEUE_STORE);
    setState(prev => ({ ...prev, pendingCount: 0, failedCount: 0 }));
  }, []);

  const getQueuedMessages = useCallback(async (
    status?: 'pending' | 'syncing' | 'failed' | 'synced'
  ): Promise<QueuedMessage[]> => {
    const db = await getDB();
    if (status) {
      return db.getAllFromIndex(QUEUE_STORE, 'status', status);
    }
    return db.getAll(QUEUE_STORE);
  }, []);

  const startAutoSync = useCallback((intervalMs: number = 30000) => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine && !isSyncingRef.current) {
        syncPendingMessages();
      }
    }, intervalMs);
  }, [syncPendingMessages]);

  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  return {
    ...state,
    addToQueue,
    syncPendingMessages,
    retryFailed,
    clearQueue,
    getQueuedMessages,
    startAutoSync,
    stopAutoSync,
  };
};
