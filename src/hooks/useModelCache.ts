import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// MODEL CACHE MANAGER - Unified cache verification for offline models
// =============================================================================
// Provides a single source of truth for model cache status across:
// - useSilentDownloader (background downloads)
// - useSovereignAI (runtime inference)
// - useOfflineAI (basic offline mode)
// =============================================================================

const CACHE_STATUS_KEY = 'shadowtalk_model_cache_status';

interface ModelCacheEntry {
  modelId: string;
  cachedAt: string;
  sizeBytes: number;
  verified: boolean;
}

interface ModelCacheState {
  isChecking: boolean;
  cachedModels: ModelCacheEntry[];
  lastChecked: string | null;
}

// WebLLM model IDs we support
const SUPPORTED_MODELS = [
  'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  'Llama-3.2-3B-Instruct-q4f16_1-MLC',
  'Llama-3.1-8B-Instruct-q4f16_1-MLC',
  'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
  'Qwen2.5-7B-Instruct-q4f16_1-MLC',
  'SmolLM2-360M-Instruct-q4f16_1-MLC',
  'SmolLM2-135M-Instruct-q4f16_1-MLC',
  'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
];

export const useModelCache = () => {
  const [state, setState] = useState<ModelCacheState>({
    isChecking: false,
    cachedModels: [],
    lastChecked: null,
  });

  // Load persisted cache status from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CACHE_STATUS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          cachedModels: parsed.cachedModels || [],
          lastChecked: parsed.lastChecked,
        }));
      }
    } catch (e) {
      console.warn('[ModelCache] Failed to load saved cache status:', e);
    }
  }, []);

  // Persist cache status to localStorage
  const persistState = useCallback((models: ModelCacheEntry[], lastChecked: string) => {
    try {
      localStorage.setItem(CACHE_STATUS_KEY, JSON.stringify({
        cachedModels: models,
        lastChecked,
      }));
    } catch (e) {
      console.warn('[ModelCache] Failed to persist cache status:', e);
    }
  }, []);

  // Check if a specific model is cached using WebLLM's hasModelInCache
  const checkModelCache = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      const webllm = await import('@mlc-ai/web-llm');
      
      // WebLLM provides hasModelInCache function
      if (typeof webllm.hasModelInCache === 'function') {
        const isCached = await webllm.hasModelInCache(modelId);
        console.log(`[ModelCache] ${modelId} cached: ${isCached}`);
        return isCached;
      }
      
      // Fallback: try to check Cache Storage directly
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const mlcCache = cacheNames.find(name => name.includes('mlc') || name.includes('webllm'));
        if (mlcCache) {
          const cache = await caches.open(mlcCache);
          const keys = await cache.keys();
          const hasModel = keys.some(req => req.url.includes(modelId));
          console.log(`[ModelCache] ${modelId} in cache storage: ${hasModel}`);
          return hasModel;
        }
      }
      
      return false;
    } catch (e) {
      console.warn(`[ModelCache] Failed to check cache for ${modelId}:`, e);
      return false;
    }
  }, []);

  // Verify all cached models and update state
  const verifyCachedModels = useCallback(async (): Promise<ModelCacheEntry[]> => {
    if (state.isChecking) {
      console.log('[ModelCache] Already checking, returning current state');
      return state.cachedModels;
    }

    setState(prev => ({ ...prev, isChecking: true }));
    console.log('[ModelCache] Verifying cached models...');

    const verifiedModels: ModelCacheEntry[] = [];

    for (const modelId of SUPPORTED_MODELS) {
      const isCached = await checkModelCache(modelId);
      if (isCached) {
        verifiedModels.push({
          modelId,
          cachedAt: new Date().toISOString(),
          sizeBytes: 0, // We don't know exact size from cache
          verified: true,
        });
      }
    }

    const lastChecked = new Date().toISOString();
    
    setState(prev => ({
      ...prev,
      isChecking: false,
      cachedModels: verifiedModels,
      lastChecked,
    }));

    persistState(verifiedModels, lastChecked);
    console.log('[ModelCache] Verified models:', verifiedModels.map(m => m.modelId));

    return verifiedModels;
  }, [state.isChecking, state.cachedModels, checkModelCache, persistState]);

  // Check if a specific model is cached (uses cached state first, then verifies)
  const isModelCached = useCallback((modelId: string): boolean => {
    return state.cachedModels.some(m => m.modelId === modelId);
  }, [state.cachedModels]);

  // Mark a model as cached (called after successful download/load)
  const markModelCached = useCallback((modelId: string, sizeBytes?: number) => {
    setState(prev => {
      const exists = prev.cachedModels.some(m => m.modelId === modelId);
      if (exists) return prev;

      const newEntry: ModelCacheEntry = {
        modelId,
        cachedAt: new Date().toISOString(),
        sizeBytes: sizeBytes || 0,
        verified: true,
      };

      const updated = [...prev.cachedModels, newEntry];
      const lastChecked = new Date().toISOString();
      
      persistState(updated, lastChecked);
      
      return {
        ...prev,
        cachedModels: updated,
        lastChecked,
      };
    });
    
    console.log('[ModelCache] Marked as cached:', modelId);
  }, [persistState]);

  // Get the best cached model for a given tier
  const getBestCachedModel = useCallback((tier: 'standard' | 'elite' | 'enterprise'): string | null => {
    const modelPriority: Record<string, string[]> = {
      enterprise: [
        'Llama-3.1-8B-Instruct-q4f16_1-MLC',
        'Qwen2.5-7B-Instruct-q4f16_1-MLC',
        'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
        'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      ],
      elite: [
        'Llama-3.1-8B-Instruct-q4f16_1-MLC',
        'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
        'Qwen2.5-7B-Instruct-q4f16_1-MLC',
        'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      ],
      standard: [
        'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        'SmolLM2-360M-Instruct-q4f16_1-MLC',
        'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
      ],
    };

    const priority = modelPriority[tier] || modelPriority.standard;
    const cachedIds = state.cachedModels.map(m => m.modelId);
    
    for (const modelId of priority) {
      if (cachedIds.includes(modelId)) {
        return modelId;
      }
    }
    
    return null;
  }, [state.cachedModels]);

  // Clear cache status (for testing)
  const clearCacheStatus = useCallback(() => {
    localStorage.removeItem(CACHE_STATUS_KEY);
    setState({
      isChecking: false,
      cachedModels: [],
      lastChecked: null,
    });
  }, []);

  return {
    isChecking: state.isChecking,
    cachedModels: state.cachedModels,
    lastChecked: state.lastChecked,
    checkModelCache,
    verifyCachedModels,
    isModelCached,
    markModelCached,
    getBestCachedModel,
    clearCacheStatus,
  };
};
