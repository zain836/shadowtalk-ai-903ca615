import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheConfig {
  maxEntries?: number;
  defaultTTL?: number; // in milliseconds
  persistToStorage?: boolean;
  storageKey?: string;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxEntries: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  persistToStorage: true,
  storageKey: 'shadowtalk_smart_cache',
};

export function useSmartCache<T = unknown>(config: CacheConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, evictions: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    if (mergedConfig.persistToStorage) {
      try {
        const stored = localStorage.getItem(mergedConfig.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          
          // Filter out expired entries
          const validEntries = Object.entries(parsed).filter(
            ([, entry]: [string, any]) => now - entry.timestamp < entry.ttl
          );
          
          cacheRef.current = new Map(validEntries as [string, CacheEntry<T>][]);
        }
      } catch (e) {
        console.warn('[SmartCache] Failed to load from storage:', e);
      }
    }
  }, []);

  // Persist to localStorage on changes
  const persistCache = useCallback(() => {
    if (mergedConfig.persistToStorage) {
      try {
        const obj = Object.fromEntries(cacheRef.current.entries());
        localStorage.setItem(mergedConfig.storageKey, JSON.stringify(obj));
      } catch (e) {
        console.warn('[SmartCache] Failed to persist:', e);
      }
    }
  }, [mergedConfig.persistToStorage, mergedConfig.storageKey]);

  // LRU eviction - remove least recently used entries
  const evictIfNeeded = useCallback(() => {
    if (cacheRef.current.size >= mergedConfig.maxEntries) {
      // Sort by hits (ascending) then timestamp (ascending)
      const entries = Array.from(cacheRef.current.entries()).sort((a, b) => {
        if (a[1].hits !== b[1].hits) return a[1].hits - b[1].hits;
        return a[1].timestamp - b[1].timestamp;
      });
      
      // Remove oldest 10%
      const toRemove = Math.ceil(mergedConfig.maxEntries * 0.1);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        cacheRef.current.delete(entries[i][0]);
      }
      
      setCacheStats(prev => ({ ...prev, evictions: prev.evictions + toRemove }));
    }
  }, [mergedConfig.maxEntries]);

  // Generate cache key from object
  const generateKey = useCallback((input: Record<string, unknown>): string => {
    return JSON.stringify(input, Object.keys(input).sort());
  }, []);

  // Get from cache
  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }
    
    // Update hit count
    entry.hits++;
    cacheRef.current.set(key, entry);
    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    
    return entry.data;
  }, []);

  // Set in cache
  const set = useCallback((key: string, data: T, ttl?: number): void => {
    evictIfNeeded();
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? mergedConfig.defaultTTL,
      hits: 0,
    });
    
    persistCache();
  }, [evictIfNeeded, mergedConfig.defaultTTL, persistCache]);

  // Get or fetch pattern
  const getOrFetch = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cached = get(key);
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    set(key, data, ttl);
    return data;
  }, [get, set]);

  // Invalidate single entry
  const invalidate = useCallback((key: string): void => {
    cacheRef.current.delete(key);
    persistCache();
  }, [persistCache]);

  // Invalidate by pattern
  const invalidatePattern = useCallback((pattern: RegExp): number => {
    let count = 0;
    for (const key of cacheRef.current.keys()) {
      if (pattern.test(key)) {
        cacheRef.current.delete(key);
        count++;
      }
    }
    persistCache();
    return count;
  }, [persistCache]);

  // Clear all cache
  const clear = useCallback((): void => {
    cacheRef.current.clear();
    setCacheStats({ hits: 0, misses: 0, evictions: 0 });
    if (mergedConfig.persistToStorage) {
      localStorage.removeItem(mergedConfig.storageKey);
    }
  }, [mergedConfig.persistToStorage, mergedConfig.storageKey]);

  // Get cache size
  const size = useCallback((): number => {
    return cacheRef.current.size;
  }, []);

  // Get hit rate
  const getHitRate = useCallback((): number => {
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? (cacheStats.hits / total) * 100 : 0;
  }, [cacheStats]);

  return {
    get,
    set,
    getOrFetch,
    invalidate,
    invalidatePattern,
    clear,
    size,
    generateKey,
    stats: cacheStats,
    getHitRate,
  };
}

// Specialized cache for AI responses
export function useAIResponseCache() {
  const cache = useSmartCache<string>({
    maxEntries: 50,
    defaultTTL: 30 * 60 * 1000, // 30 minutes for AI responses
    storageKey: 'shadowtalk_ai_cache',
  });

  const getCachedResponse = useCallback((
    messages: { role: string; content: string }[],
    model: string,
    mode: string
  ): string | null => {
    const key = cache.generateKey({ messages, model, mode });
    return cache.get(key);
  }, [cache]);

  const cacheResponse = useCallback((
    messages: { role: string; content: string }[],
    model: string,
    mode: string,
    response: string
  ): void => {
    const key = cache.generateKey({ messages, model, mode });
    cache.set(key, response);
  }, [cache]);

  return {
    getCachedResponse,
    cacheResponse,
    clearCache: cache.clear,
    stats: cache.stats,
    hitRate: cache.getHitRate(),
  };
}

// Specialized cache for conversation data
export function useConversationCache() {
  const cache = useSmartCache<{
    id: string;
    title: string;
    messages: { role: string; content: string; timestamp: string }[];
  }>({
    maxEntries: 20,
    defaultTTL: 60 * 60 * 1000, // 1 hour for conversations
    storageKey: 'shadowtalk_conversation_cache',
  });

  return {
    getConversation: (id: string) => cache.get(id),
    cacheConversation: (id: string, data: any) => cache.set(id, data),
    invalidateConversation: (id: string) => cache.invalidate(id),
    stats: cache.stats,
  };
}
