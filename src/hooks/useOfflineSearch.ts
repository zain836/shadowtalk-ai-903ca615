import { useState, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  content: string;
  role: string;
  timestamp: string;
  matchScore: number;
  highlightedContent: string;
}

interface OfflineSearchState {
  isSearching: boolean;
  results: SearchResult[];
  query: string;
  error: string | null;
}

const DB_NAME = 'shadowtalk-offline';
const MESSAGES_STORE = 'messages';
const CONVERSATIONS_STORE = 'conversations';

export const useOfflineSearch = () => {
  const [state, setState] = useState<OfflineSearchState>({
    isSearching: false,
    results: [],
    query: '',
    error: null,
  });

  const getDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const store = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          store.createIndex('conversationId', 'conversation_id');
          store.createIndex('content', 'content');
        }
      },
    });
  };

  const highlightMatches = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    let highlighted = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '**$1**');
    });
    
    return highlighted;
  };

  const calculateMatchScore = (content: string, query: string): number => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/).filter(w => w.length > 1);
    
    let score = 0;
    
    // Exact phrase match
    if (lowerContent.includes(lowerQuery)) {
      score += 100;
    }
    
    // Word matches
    words.forEach(word => {
      const occurrences = (lowerContent.match(new RegExp(word, 'g')) || []).length;
      score += occurrences * 10;
      
      // Bonus for word at start
      if (lowerContent.startsWith(word)) score += 20;
    });
    
    // Penalize very long content
    score = score * (100 / Math.max(100, content.length));
    
    return Math.round(score);
  };

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], query: '' }));
      return [];
    }

    setState(prev => ({ ...prev, isSearching: true, query, error: null }));

    try {
      const db = await getDB();
      const tx = db.transaction([MESSAGES_STORE, CONVERSATIONS_STORE], 'readonly');
      
      const allMessages = await tx.objectStore(MESSAGES_STORE).getAll();
      const allConversations = await tx.objectStore(CONVERSATIONS_STORE).getAll();
      
      const conversationMap = new Map(
        allConversations.map(c => [c.id, c.title || 'Untitled'])
      );

      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      for (const msg of allMessages) {
        const content = msg.content || '';
        if (content.toLowerCase().includes(lowerQuery)) {
          results.push({
            conversationId: msg.conversation_id,
            conversationTitle: conversationMap.get(msg.conversation_id) || 'Untitled',
            messageId: msg.id,
            content: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
            role: msg.role,
            timestamp: msg.created_at,
            matchScore: calculateMatchScore(content, query),
            highlightedContent: highlightMatches(
              content.slice(0, 200) + (content.length > 200 ? '...' : ''),
              query
            ),
          });
        }
      }

      // Sort by match score
      results.sort((a, b) => b.matchScore - a.matchScore);
      
      // Limit results
      const limitedResults = results.slice(0, 50);

      setState(prev => ({ 
        ...prev, 
        isSearching: false, 
        results: limitedResults 
      }));

      return limitedResults;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Search failed';
      setState(prev => ({ ...prev, isSearching: false, error }));
      return [];
    }
  }, []);

  const searchByDate = useCallback(async (startDate: Date, endDate: Date): Promise<SearchResult[]> => {
    setState(prev => ({ ...prev, isSearching: true, error: null }));

    try {
      const db = await getDB();
      const tx = db.transaction([MESSAGES_STORE, CONVERSATIONS_STORE], 'readonly');
      
      const allMessages = await tx.objectStore(MESSAGES_STORE).getAll();
      const allConversations = await tx.objectStore(CONVERSATIONS_STORE).getAll();
      
      const conversationMap = new Map(
        allConversations.map(c => [c.id, c.title || 'Untitled'])
      );

      const results: SearchResult[] = allMessages
        .filter(msg => {
          const msgDate = new Date(msg.created_at);
          return msgDate >= startDate && msgDate <= endDate;
        })
        .map(msg => ({
          conversationId: msg.conversation_id,
          conversationTitle: conversationMap.get(msg.conversation_id) || 'Untitled',
          messageId: msg.id,
          content: msg.content?.slice(0, 200) + (msg.content?.length > 200 ? '...' : ''),
          role: msg.role,
          timestamp: msg.created_at,
          matchScore: 50,
          highlightedContent: msg.content?.slice(0, 200) + (msg.content?.length > 200 ? '...' : ''),
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      setState(prev => ({ ...prev, isSearching: false, results }));
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Search failed';
      setState(prev => ({ ...prev, isSearching: false, error }));
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setState({ isSearching: false, results: [], query: '', error: null });
  }, []);

  return {
    ...state,
    search,
    searchByDate,
    clearResults,
  };
};
