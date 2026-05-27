import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema for offline chat storage
interface ShadowTalkDB extends DBSchema {
  conversations: {
    key: string;
    value: {
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
      user_id: string;
    };
    indexes: { 'by-updated': string };
  };
  messages: {
    key: string;
    value: {
      id: string;
      conversation_id: string;
      content: string;
      role: 'user' | 'assistant';
      created_at: string;
      personality?: string;
      attachment?: {
        type: 'image' | 'file';
        data: string;
        name: string;
        mimeType: string;
      };
    };
    indexes: { 'by-conversation': string };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      type: 'conversation' | 'message';
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: string;
    };
  };
}

const DB_NAME = 'shadowtalk-offline';
const DB_VERSION = 1;

export interface OfflineConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface OfflineMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'file';
    data: string;
    name: string;
    mimeType: string;
  };
}

export const useOfflineChatHistory = () => {
  const [db, setDb] = useState<IDBPDatabase<ShadowTalkDB> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the database
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<ShadowTalkDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create conversations store
            if (!db.objectStoreNames.contains('conversations')) {
              const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
              convStore.createIndex('by-updated', 'updated_at');
            }

            // Create messages store
            if (!db.objectStoreNames.contains('messages')) {
              const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
              msgStore.createIndex('by-conversation', 'conversation_id');
            }

            // Create pending sync store
            if (!db.objectStoreNames.contains('pendingSync')) {
              db.createObjectStore('pendingSync', { keyPath: 'id' });
            }
          },
        });

        setDb(database);
        setIsReady(true);
        console.log('[OfflineChat] Database initialized');
      } catch (e: any) {
        console.error('[OfflineChat] Failed to initialize database:', e);
        setError(e.message);
      }
    };

    initDB();

    return () => {
      db?.close();
    };
  }, []);

  // Cache a conversation
  const cacheConversation = useCallback(async (conversation: OfflineConversation) => {
    if (!db) return;

    try {
      await db.put('conversations', {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at || new Date().toISOString(),
        user_id: 'offline-user',
      });
      console.log('[OfflineChat] Conversation cached:', conversation.id);
    } catch (e: any) {
      console.error('[OfflineChat] Failed to cache conversation:', e);
    }
  }, [db]);

  // Cache a message
  const cacheMessage = useCallback(async (
    conversationId: string,
    message: OfflineMessage,
    personality?: string
  ) => {
    if (!db) return;

    try {
      await db.put('messages', {
        id: message.id,
        conversation_id: conversationId,
        content: message.content,
        role: message.type === 'user' ? 'user' : 'assistant',
        created_at: message.timestamp.toISOString(),
        personality,
        attachment: message.attachment,
      });
      console.log('[OfflineChat] Message cached:', message.id);
    } catch (e: any) {
      console.error('[OfflineChat] Failed to cache message:', e);
    }
  }, [db]);

  // Get all cached conversations
  const getCachedConversations = useCallback(async (): Promise<OfflineConversation[]> => {
    if (!db) return [];

    try {
      const conversations = await db.getAllFromIndex('conversations', 'by-updated');
      return conversations
        .reverse()
        .map(c => ({
          id: c.id,
          title: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
    } catch (e: any) {
      console.error('[OfflineChat] Failed to get cached conversations:', e);
      return [];
    }
  }, [db]);

  // Get messages for a conversation
  const getCachedMessages = useCallback(async (conversationId: string): Promise<OfflineMessage[]> => {
    if (!db) return [];

    try {
      const messages = await db.getAllFromIndex('messages', 'by-conversation', conversationId);
      return messages.map(m => ({
        id: m.id,
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content,
        timestamp: new Date(m.created_at),
        attachment: m.attachment,
      }));
    } catch (e: any) {
      console.error('[OfflineChat] Failed to get cached messages:', e);
      return [];
    }
  }, [db]);

  // Cache multiple conversations at once (for initial sync)
  const bulkCacheConversations = useCallback(async (conversations: OfflineConversation[]) => {
    if (!db) return;

    try {
      const tx = db.transaction('conversations', 'readwrite');
      await Promise.all([
        ...conversations.map(c => tx.store.put({
          id: c.id,
          title: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at || new Date().toISOString(),
          user_id: 'offline-user',
        })),
        tx.done,
      ]);
      console.log('[OfflineChat] Bulk cached', conversations.length, 'conversations');
    } catch (e: any) {
      console.error('[OfflineChat] Failed to bulk cache conversations:', e);
    }
  }, [db]);

  // Cache multiple messages at once
  const bulkCacheMessages = useCallback(async (conversationId: string, messages: OfflineMessage[], personality?: string) => {
    if (!db) return;

    try {
      const tx = db.transaction('messages', 'readwrite');
      await Promise.all([
        ...messages.map(m => tx.store.put({
          id: m.id,
          conversation_id: conversationId,
          content: m.content,
          role: m.type === 'user' ? 'user' : 'assistant',
          created_at: m.timestamp.toISOString(),
          personality,
          attachment: m.attachment,
        })),
        tx.done,
      ]);
      console.log('[OfflineChat] Bulk cached', messages.length, 'messages for conversation', conversationId);
    } catch (e: any) {
      console.error('[OfflineChat] Failed to bulk cache messages:', e);
    }
  }, [db]);

  // Delete a conversation and its messages
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!db) return;

    try {
      // Delete messages first
      const messages = await db.getAllFromIndex('messages', 'by-conversation', conversationId);
      const tx = db.transaction('messages', 'readwrite');
      await Promise.all([
        ...messages.map(m => tx.store.delete(m.id)),
        tx.done,
      ]);

      // Delete conversation
      await db.delete('conversations', conversationId);
      console.log('[OfflineChat] Deleted conversation:', conversationId);
    } catch (e: any) {
      console.error('[OfflineChat] Failed to delete conversation:', e);
    }
  }, [db]);

  // Add item to pending sync queue
  const addToPendingSync = useCallback(async (type: 'conversation' | 'message', action: 'create' | 'update' | 'delete', data: any) => {
    if (!db) return;

    try {
      await db.put('pendingSync', {
        id: crypto.randomUUID(),
        type,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
      console.log('[OfflineChat] Added to pending sync:', type, action);
    } catch (e: any) {
      console.error('[OfflineChat] Failed to add to pending sync:', e);
    }
  }, [db]);

  // Get all pending sync items
  const getPendingSync = useCallback(async () => {
    if (!db) return [];

    try {
      return await db.getAll('pendingSync');
    } catch (e: any) {
      console.error('[OfflineChat] Failed to get pending sync:', e);
      return [];
    }
  }, [db]);

  // Clear pending sync after successful sync
  const clearPendingSync = useCallback(async () => {
    if (!db) return;

    try {
      const tx = db.transaction('pendingSync', 'readwrite');
      await tx.store.clear();
      await tx.done;
      console.log('[OfflineChat] Cleared pending sync');
    } catch (e: any) {
      console.error('[OfflineChat] Failed to clear pending sync:', e);
    }
  }, [db]);

  // Get count of cached items
  const getCacheStats = useCallback(async () => {
    if (!db) return { conversations: 0, messages: 0, pendingSync: 0 };

    try {
      const [conversations, messages, pendingSync] = await Promise.all([
        db.count('conversations'),
        db.count('messages'),
        db.count('pendingSync'),
      ]);
      return { conversations, messages, pendingSync };
    } catch (e: any) {
      console.error('[OfflineChat] Failed to get cache stats:', e);
      return { conversations: 0, messages: 0, pendingSync: 0 };
    }
  }, [db]);

  return {
    isReady,
    error,
    cacheConversation,
    cacheMessage,
    getCachedConversations,
    getCachedMessages,
    bulkCacheConversations,
    bulkCacheMessages,
    deleteConversation,
    addToPendingSync,
    getPendingSync,
    clearPendingSync,
    getCacheStats,
    createConversation,
    touchConversation,
  };
};
