import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface CachedConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
  }>;
  cachedAt: string;
}

interface OfflineResponse {
  prompt: string;
  response: string;
}

const CACHE_KEY = 'shadowtalk_offline_cache';
const OFFLINE_RESPONSES_KEY = 'shadowtalk_offline_responses';

const DEFAULT_OFFLINE_RESPONSES: OfflineResponse[] = [
  {
    prompt: 'help',
    response: "I'm currently in offline mode. Here are some things I can help with from my cached knowledge:\n\n1. **General Questions** - I have limited pre-cached responses\n2. **Cached Conversations** - Access your previously saved chats\n3. **Basic Information** - Some common queries are available\n\nFull AI capabilities will be restored when you're back online."
  },
  {
    prompt: 'hello',
    response: "Hello! 👋 I'm operating in offline mode right now. While my capabilities are limited, I can still help you access cached conversations and provide basic assistance. Full AI features will resume once you're connected to the internet."
  },
  {
    prompt: 'what can you do offline',
    response: "In offline mode, I can:\n\n✅ **Available:**\n- Access cached conversations\n- Provide pre-saved responses\n- Store messages for sync later\n- Basic greetings and help\n- Simple math calculations\n- Current time and date\n\n❌ **Not Available:**\n- Real-time AI responses\n- Image generation\n- Web search\n- Complex queries\n\nYour messages will be synced when you're back online!"
  },
];

export const useOfflineMode = () => {
  const { userPlan, user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedConversations, setCachedConversations] = useState<CachedConversation[]>([]);
  const [offlineMessagesQueue, setOfflineMessagesQueue] = useState<Array<{ content: string; timestamp: string }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isElite = userPlan === 'elite' || user?.email === 'j3451500@gmail.com';

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineMode] Network came online');
      setIsOffline(false);
      // Sync queued messages to backend
      if (user) syncOfflineQueue();
    };
    const handleOffline = () => {
      console.log('[OfflineMode] Network went offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  useEffect(() => {
    if (isElite || isOffline) {
      loadCachedConversations();
      loadOfflineQueue();
      setIsInitialized(true);
    }
  }, [isElite, isOffline]);

  const loadCachedConversations = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCachedConversations(parsed);
      }
    } catch (e) {
      console.error('[OfflineMode] Failed to load cached conversations:', e);
    }
  };

  const loadOfflineQueue = () => {
    try {
      const queue = localStorage.getItem('shadowtalk_offline_queue');
      if (queue) {
        setOfflineMessagesQueue(JSON.parse(queue));
      }
    } catch (e) {
      console.error('[OfflineMode] Failed to load offline queue:', e);
    }
  };

  // Sync offline queue to backend when coming online
  const syncOfflineQueue = async () => {
    if (!user) return;
    
    try {
      const queue = localStorage.getItem('shadowtalk_offline_queue');
      if (!queue) return;
      
      const messages = JSON.parse(queue);
      if (messages.length === 0) return;

      // Store in offline_sync_queue table
      for (const msg of messages) {
        await supabase.from('offline_sync_queue').insert({
          user_id: user.id,
          operation_type: 'offline_message',
          operation_data: { content: msg.content, timestamp: msg.timestamp },
          status: 'pending',
          priority: 1,
        });
      }

      // Clear local queue after successful sync
      localStorage.removeItem('shadowtalk_offline_queue');
      setOfflineMessagesQueue([]);
      console.log('[OfflineMode] Synced', messages.length, 'offline messages to cloud');
    } catch (e) {
      console.error('[OfflineMode] Failed to sync offline queue:', e);
    }
  };

  const cacheConversation = useCallback((conversation: CachedConversation) => {
    if (!isElite && !isOffline) return;

    const updated = [
      { ...conversation, cachedAt: new Date().toISOString() },
      ...cachedConversations.filter(c => c.id !== conversation.id)
    ].slice(0, 100);

    setCachedConversations(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  }, [isElite, isOffline, cachedConversations]);

  const getOfflineResponse = useCallback((prompt: string): string => {
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    const customResponses = localStorage.getItem(OFFLINE_RESPONSES_KEY);
    if (customResponses) {
      try {
        const parsed: OfflineResponse[] = JSON.parse(customResponses);
        const match = parsed.find(r => normalizedPrompt.includes(r.prompt.toLowerCase()));
        if (match) return match.response;
      } catch { /* ignore */ }
    }

    const defaultMatch = DEFAULT_OFFLINE_RESPONSES.find(r =>
      normalizedPrompt.includes(r.prompt.toLowerCase())
    );
    if (defaultMatch) return defaultMatch.response;

    if (normalizedPrompt.match(/\b(what time|current time)\b/i)) {
      return `The current time is: **${new Date().toLocaleTimeString()}**`;
    }
    if (normalizedPrompt.match(/\b(what date|today|what day)\b/i)) {
      return `Today is: **${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**`;
    }

    const mathMatch = normalizedPrompt.match(/(\d+)\s*([+\-*/×÷])\s*(\d+)/);
    if (mathMatch) {
      const [, a, op, b] = mathMatch;
      const num1 = parseFloat(a);
      const num2 = parseFloat(b);
      let result: number;
      switch (op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': case '×': result = num1 * num2; break;
        case '/': case '÷': result = num2 !== 0 ? num1 / num2 : NaN; break;
        default: result = NaN;
      }
      if (!isNaN(result)) return `**${num1} ${op} ${num2} = ${result}**`;
    }

    return `🔌 **Offline Mode Active**\n\nI'm currently unable to process your request because you're offline. Your message has been saved and will be processed when you reconnect.\n\n**Your message:** "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"\n\nIn the meantime, you can:\n- Browse your cached conversations\n- View previously saved responses\n- Type "help" for offline capabilities`;
  }, []);

  const queueOfflineMessage = useCallback((content: string) => {
    const newMessage = { content, timestamp: new Date().toISOString() };
    const updated = [...offlineMessagesQueue, newMessage];
    setOfflineMessagesQueue(updated);
    localStorage.setItem('shadowtalk_offline_queue', JSON.stringify(updated));
  }, [offlineMessagesQueue]);

  const clearOfflineQueue = useCallback(() => {
    setOfflineMessagesQueue([]);
    localStorage.removeItem('shadowtalk_offline_queue');
  }, []);

  const getCachedConversation = useCallback((id: string) => {
    return cachedConversations.find(c => c.id === id);
  }, [cachedConversations]);

  const getCachedConversationIds = useCallback(() => {
    return cachedConversations.map(c => c.id);
  }, [cachedConversations]);

  return {
    isOffline,
    isOfflineModeAvailable: isElite || isOffline,
    isInitialized,
    cachedConversations,
    offlineMessagesQueue,
    cacheConversation,
    getOfflineResponse,
    queueOfflineMessage,
    clearOfflineQueue,
    getCachedConversation,
    getCachedConversationIds,
    syncOfflineQueue,
  };
};
