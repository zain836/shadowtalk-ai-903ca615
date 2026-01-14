import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

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

// Pre-cached helpful responses for common queries when offline
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
    response: "In offline mode, I can:\n\n✅ **Available:**\n- Access cached conversations\n- Provide pre-saved responses\n- Store messages for sync later\n- Basic greetings and help\n\n❌ **Not Available:**\n- Real-time AI responses\n- Image generation\n- Web search\n- Complex queries\n\nYour messages will be synced when you're back online!"
  },
];

export const useOfflineMode = () => {
  const { userPlan, user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedConversations, setCachedConversations] = useState<CachedConversation[]>([]);
  const [offlineMessagesQueue, setOfflineMessagesQueue] = useState<Array<{ content: string; timestamp: string }>>([]);
  
  const isElite = userPlan === 'elite' || user?.email === 'j3451500@gmail.com';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isElite) {
      loadCachedConversations();
    }
  }, [isElite]);

  const loadCachedConversations = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setCachedConversations(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to load cached conversations:', e);
    }
  };

  const cacheConversation = useCallback((conversation: CachedConversation) => {
    if (!isElite) return;

    const updated = [
      { ...conversation, cachedAt: new Date().toISOString() },
      ...cachedConversations.filter(c => c.id !== conversation.id)
    ].slice(0, 50); // Keep last 50 conversations

    setCachedConversations(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  }, [isElite, cachedConversations]);

  const getOfflineResponse = useCallback((prompt: string): string => {
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Check custom responses first
    const customResponses = localStorage.getItem(OFFLINE_RESPONSES_KEY);
    if (customResponses) {
      try {
        const parsed: OfflineResponse[] = JSON.parse(customResponses);
        const match = parsed.find(r => 
          normalizedPrompt.includes(r.prompt.toLowerCase())
        );
        if (match) return match.response;
      } catch (e) {
        console.error('Failed to parse custom offline responses');
      }
    }

    // Check default responses
    const defaultMatch = DEFAULT_OFFLINE_RESPONSES.find(r =>
      normalizedPrompt.includes(r.prompt.toLowerCase())
    );
    if (defaultMatch) return defaultMatch.response;

    // Generic offline response
    return `🔌 **Offline Mode Active**\n\nI'm currently unable to process your request because you're offline. Your message has been saved and will be processed when you reconnect.\n\n**Your message:** "${prompt}"\n\nIn the meantime, you can:\n- Browse your cached conversations\n- View previously saved responses\n- Type "help" for offline capabilities`;
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

  return {
    isOffline,
    isOfflineModeAvailable: isElite,
    cachedConversations,
    offlineMessagesQueue,
    cacheConversation,
    getOfflineResponse,
    queueOfflineMessage,
    clearOfflineQueue,
    getCachedConversation,
  };
};
