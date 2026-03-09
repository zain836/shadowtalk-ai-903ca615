import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// HYBRID STORAGE: Local-first IndexedDB + Cloud backup when authenticated
// =============================================================================

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  createdAt: number;
}

interface LocalConversation {
  id: string;
  title: string | null;
  systemPrompt: string;
  modelUsed: string | null;
  messages: LocalMessage[];
  messageCount: number;
  totalTokens: number;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null; // null = never synced to cloud
  needsSync: boolean;
}

interface PersonalLLMDB extends DBSchema {
  conversations: {
    key: string;
    value: LocalConversation;
    indexes: { 'by-updated': number };
  };
  settings: {
    key: string;
    value: {
      defaultSystemPrompt: string;
      preferredModel: string | null;
      cloudSyncEnabled: boolean;
    };
  };
}

const DB_NAME = 'shadowtalk-personal-llm';
const DB_VERSION = 1;

export function usePersonalLLMStore() {
  const [db, setDb] = useState<IDBPDatabase<PersonalLLMDB> | null>(null);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    defaultSystemPrompt: 'You are a personal AI assistant running entirely on this device.',
    preferredModel: null as string | null,
    cloudSyncEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<PersonalLLMDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('conversations')) {
              const store = db.createObjectStore('conversations', { keyPath: 'id' });
              store.createIndex('by-updated', 'updatedAt');
            }
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings');
            }
          },
        });
        setDb(database);

        // Load conversations
        const allConvos = await database.getAll('conversations');
        setConversations(allConvos.sort((a, b) => b.updatedAt - a.updatedAt));

        // Load settings
        const savedSettings = await database.get('settings', 'default');
        if (savedSettings) setSettings(savedSettings);

        console.log('[PersonalLLMStore] ✓ Initialized with', allConvos.length, 'conversations');
      } catch (e) {
        console.error('[PersonalLLMStore] Failed to init IndexedDB:', e);
      }
      setIsLoading(false);
    };

    initDB();
  }, []);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync to cloud when authenticated
  const syncToCloud = useCallback(async () => {
    if (!userId || !db || !settings.cloudSyncEnabled) return;

    const unsyncedConvos = conversations.filter(c => c.needsSync);
    if (unsyncedConvos.length === 0) return;

    setIsSyncing(true);
    console.log('[PersonalLLMStore] ☁️ Syncing', unsyncedConvos.length, 'conversations to cloud');

    try {
      for (const convo of unsyncedConvos) {
        // Upsert conversation
        const { error: convoError } = await supabase
          .from('personal_llm_conversations')
          .upsert({
            id: convo.id,
            user_id: userId,
            title: convo.title,
            system_prompt: convo.systemPrompt,
            model_used: convo.modelUsed,
            message_count: convo.messageCount,
            total_tokens: convo.totalTokens,
            created_at: new Date(convo.createdAt).toISOString(),
            updated_at: new Date(convo.updatedAt).toISOString(),
          }, { onConflict: 'id' });

        if (convoError) {
          console.error('[PersonalLLMStore] Cloud sync error (conversation):', convoError);
          continue;
        }

        // Sync messages
        const messagesToSync = convo.messages.map(m => ({
          id: m.id,
          conversation_id: convo.id,
          user_id: userId,
          role: m.role,
          content: m.content,
          tokens: m.tokens || 0,
          created_at: new Date(m.createdAt).toISOString(),
        }));

        if (messagesToSync.length > 0) {
          const { error: msgError } = await supabase
            .from('personal_llm_messages')
            .upsert(messagesToSync, { onConflict: 'id' });

          if (msgError) {
            console.error('[PersonalLLMStore] Cloud sync error (messages):', msgError);
            continue;
          }
        }

        // Mark as synced in IndexedDB
        const updatedConvo = { ...convo, syncedAt: Date.now(), needsSync: false };
        await db.put('conversations', updatedConvo);
        setConversations(prev => prev.map(c => c.id === convo.id ? updatedConvo : c));
      }

      console.log('[PersonalLLMStore] ✅ Cloud sync complete');
    } catch (e) {
      console.error('[PersonalLLMStore] Cloud sync failed:', e);
    }

    setIsSyncing(false);
  }, [userId, db, conversations, settings.cloudSyncEnabled]);

  // Debounced sync trigger
  const triggerSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(syncToCloud, 3000); // Sync 3s after last change
  }, [syncToCloud]);

  // Restore from cloud on login
  const restoreFromCloud = useCallback(async () => {
    if (!userId || !db) return;

    setIsSyncing(true);
    console.log('[PersonalLLMStore] ☁️ Restoring from cloud...');

    try {
      // Fetch cloud conversations
      const { data: cloudConvos, error: convoError } = await supabase
        .from('personal_llm_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      for (const cloudConvo of cloudConvos || []) {
        // Check if we have a newer local version
        const localConvo = conversations.find(c => c.id === cloudConvo.id);
        const cloudUpdated = new Date(cloudConvo.updated_at).getTime();

        if (localConvo && localConvo.updatedAt > cloudUpdated) {
          console.log('[PersonalLLMStore] Skipping cloud convo (local is newer):', cloudConvo.id);
          continue;
        }

        // Fetch messages
        const { data: cloudMessages } = await supabase
          .from('personal_llm_messages')
          .select('*')
          .eq('conversation_id', cloudConvo.id)
          .order('created_at', { ascending: true });

        const restoredConvo: LocalConversation = {
          id: cloudConvo.id,
          title: cloudConvo.title,
          systemPrompt: cloudConvo.system_prompt || settings.defaultSystemPrompt,
          modelUsed: cloudConvo.model_used,
          messages: (cloudMessages || []).map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
            tokens: m.tokens || 0,
            createdAt: new Date(m.created_at).getTime(),
          })),
          messageCount: cloudConvo.message_count || 0,
          totalTokens: cloudConvo.total_tokens || 0,
          createdAt: new Date(cloudConvo.created_at).getTime(),
          updatedAt: cloudUpdated,
          syncedAt: Date.now(),
          needsSync: false,
        };

        await db.put('conversations', restoredConvo);
      }

      // Reload conversations
      const allConvos = await db.getAll('conversations');
      setConversations(allConvos.sort((a, b) => b.updatedAt - a.updatedAt));

      console.log('[PersonalLLMStore] ✅ Restored', cloudConvos?.length || 0, 'conversations from cloud');
    } catch (e) {
      console.error('[PersonalLLMStore] Cloud restore failed:', e);
    }

    setIsSyncing(false);
  }, [userId, db, conversations, settings.defaultSystemPrompt]);

  // Auto-restore when user logs in
  useEffect(() => {
    if (userId && db && settings.cloudSyncEnabled) {
      restoreFromCloud();
    }
  }, [userId, db, settings.cloudSyncEnabled]);

  // Create new conversation
  const createConversation = useCallback(async (systemPrompt?: string): Promise<string> => {
    const id = crypto.randomUUID();
    const now = Date.now();

    const newConvo: LocalConversation = {
      id,
      title: null,
      systemPrompt: systemPrompt || settings.defaultSystemPrompt,
      modelUsed: settings.preferredModel,
      messages: [],
      messageCount: 0,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      needsSync: !!userId, // Only needs sync if authenticated
    };

    if (db) {
      await db.put('conversations', newConvo);
    }

    setConversations(prev => [newConvo, ...prev]);
    setActiveConversationId(id);

    if (userId) triggerSync();
    return id;
  }, [db, settings, userId, triggerSync]);

  // Add message to conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokens?: number
  ) => {
    const messageId = crypto.randomUUID();
    const now = Date.now();

    const newMessage: LocalMessage = {
      id: messageId,
      role,
      content,
      tokens: tokens || 0,
      createdAt: now,
    };

    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;

      const updated: LocalConversation = {
        ...c,
        messages: [...c.messages, newMessage],
        messageCount: c.messageCount + 1,
        totalTokens: c.totalTokens + (tokens || 0),
        updatedAt: now,
        needsSync: !!userId,
        // Auto-generate title from first user message
        title: c.title || (role === 'user' ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : c.title),
      };

      // Persist to IndexedDB
      if (db) {
        db.put('conversations', updated);
      }

      return updated;
    }));

    if (userId) triggerSync();
    return messageId;
  }, [db, userId, triggerSync]);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (
    conversationId: string,
    content: string,
    tokens?: number
  ) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;

      const messages = [...c.messages];
      const lastIdx = messages.length - 1;

      if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
        messages[lastIdx] = {
          ...messages[lastIdx],
          content,
          tokens: tokens || messages[lastIdx].tokens,
        };
      }

      const updated: LocalConversation = {
        ...c,
        messages,
        totalTokens: tokens ? (c.totalTokens - (c.messages[lastIdx]?.tokens || 0) + tokens) : c.totalTokens,
        updatedAt: Date.now(),
        needsSync: !!userId,
      };

      // Persist to IndexedDB (debounced to avoid too many writes during streaming)
      if (db) {
        db.put('conversations', updated);
      }

      return updated;
    }));
  }, [db, userId]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (db) {
      await db.delete('conversations', conversationId);
    }

    // Also delete from cloud if authenticated
    if (userId) {
      await supabase
        .from('personal_llm_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }, [db, userId, activeConversationId]);

  // Clear all local data
  const clearAllData = useCallback(async () => {
    if (db) {
      const tx = db.transaction('conversations', 'readwrite');
      await tx.objectStore('conversations').clear();
      await tx.done;
    }
    setConversations([]);
    setActiveConversationId(null);
  }, [db]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (db) {
      await db.put('settings', updated, 'default');
    }
  }, [db, settings]);

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  return {
    // State
    conversations,
    activeConversation,
    activeConversationId,
    settings,
    isLoading,
    isSyncing,
    isAuthenticated: !!userId,

    // Actions
    setActiveConversationId,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    deleteConversation,
    clearAllData,
    updateSettings,
    syncToCloud,
    restoreFromCloud,
  };
}
