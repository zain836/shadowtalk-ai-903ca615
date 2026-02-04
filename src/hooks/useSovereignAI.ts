import { useState, useEffect, useCallback, useRef } from 'react';
import { useHardwareCapabilities } from './useHardwareCapabilities';
import { useOfflineRAG } from './useOfflineRAG';
import { useBusinessMemory } from './useBusinessMemory';

// =============================================================================
// SOVEREIGN AI ENGINE - WebLLM Powered Offline Intelligence
// =============================================================================
// Based on web.dev best practices for browser-based LLM
// Uses progressive model loading with smallest-first fallback strategy
// =============================================================================

interface WebLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SovereignModel {
  id: string;
  name: string;
  description: string;
  size: string;
  sizeBytes: number;
  tier: 'standard' | 'elite' | 'enterprise';
  quantization: 'INT4' | 'INT8' | 'FP16';
  capabilities: string[];
  priority: number; // Lower = try first
}

interface SovereignAIState {
  isReady: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadStage: string;
  error: string | null;
  activeModel: SovereignModel | null;
  mode: 'stealth' | 'online' | 'hybrid';
  isWebGPUAvailable: boolean;
  isWASMFallback: boolean;
  encryptionEnabled: boolean;
  contextTokens: number;
  maxContextTokens: number;
}

// Model Catalog - Ordered by size (smallest first for fastest loading)
// SmolLM2 models are specifically designed for fast loading in browsers
const SOVEREIGN_MODELS: SovereignModel[] = [
  // Nano tier - Ultra fast loading (~130MB)
  {
    id: 'SmolLM2-135M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 Nano',
    description: 'Ultra-fast, instant loading. Great for simple tasks.',
    size: '135M',
    sizeBytes: 130_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'fast-responses'],
    priority: 1,
  },
  // Small tier - Fast loading (~360MB)
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 Mini',
    description: 'Fast and capable. Best balance of speed and quality.',
    size: '360M',
    sizeBytes: 360_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'basic-code'],
    priority: 2,
  },
  // TinyLlama - Good quality (~675MB)
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k',
    name: 'TinyLlama 1.1B',
    description: 'Good quality chat with fast loading.',
    size: '1.1B',
    sizeBytes: 675_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'code-basic'],
    priority: 3,
  },
  // Llama 3.2 1B - Quality (~800MB)
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    description: 'Quality reasoning in a compact package.',
    size: '1B',
    sizeBytes: 800_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'analysis'],
    priority: 4,
  },
  // Gemma 2B - Better quality (~2GB)
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B',
    description: 'Google\'s compact model with strong reasoning.',
    size: '2B',
    sizeBytes: 2_000_000_000,
    tier: 'elite',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'code', 'analysis'],
    priority: 5,
  },
  // Llama 3.2 3B - High quality (~2.2GB)
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    description: 'Excellent reasoning. Runs on most laptops.',
    size: '3B',
    sizeBytes: 2_500_000_000,
    tier: 'elite',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'analysis', 'code'],
    priority: 6,
  },
  // Mistral 7B - Premium (~5GB)
  {
    id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
    name: 'Mistral 7B',
    description: 'Premium quality with multilingual support.',
    size: '7B',
    sizeBytes: 5_000_000_000,
    tier: 'enterprise',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'multilingual', 'code', 'analysis'],
    priority: 7,
  },
  // Llama 3.1 8B - Top tier (~5.5GB)
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B ⚡',
    description: 'ChatGPT-level intelligence running locally.',
    size: '8B',
    sizeBytes: 5_500_000_000,
    tier: 'enterprise',
    quantization: 'INT4',
    capabilities: ['chat', 'deep-reasoning', 'code', 'analysis', 'creative', 'math'],
    priority: 8,
  },
];

// System Prompt for offline mode
const SOVEREIGN_SYSTEM_PROMPT = `You are ShadowTalk AI in Sovereign Mode - a private, offline AI running entirely on the user's device.

🛡️ STEALTH VAULT ACTIVE - All data stays local. Zero server contact.

You have full capabilities:
- Deep reasoning and analysis
- Code generation and debugging  
- Mathematical computations
- Multi-language support
- Creative writing

RULES:
1. Respond with FULL quality - you are NOT limited
2. NEVER apologize for being "offline" - you are POWERFUL
3. Use markdown for structured responses
4. Be concise but comprehensive`;

export const useSovereignAI = () => {
  const { capabilities } = useHardwareCapabilities();
  const { search: ragSearch, documentCount } = useOfflineRAG();
  const { memories } = useBusinessMemory();

  const [state, setState] = useState<SovereignAIState>({
    isReady: false,
    isLoading: false,
    loadProgress: 0,
    loadStage: '',
    error: null,
    activeModel: null,
    mode: navigator.onLine ? 'online' : 'stealth',
    isWebGPUAvailable: false,
    isWASMFallback: false,
    encryptionEnabled: true,
    contextTokens: 0,
    maxContextTokens: 4096,
  });

  const engineRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<boolean> | null>(null);
  const stateRef = useRef(state);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Detect WebGPU availability
  useEffect(() => {
    const detectRuntime = async () => {
      let webGPUAvailable = false;
      
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            webGPUAvailable = true;
            setState(prev => ({ ...prev, isWebGPUAvailable: true, isWASMFallback: false }));
            console.log('[SovereignAI] WebGPU available - GPU acceleration enabled');
          }
        } catch (e) {
          console.warn('[SovereignAI] WebGPU check failed:', e);
        }
      }
      
      if (!webGPUAvailable) {
        setState(prev => ({ ...prev, isWebGPUAvailable: false, isWASMFallback: true }));
        console.log('[SovereignAI] WebGPU not available - using WASM fallback');
      }
    };

    detectRuntime();

    // Listen for network changes
    const handleOnline = () => setState(prev => ({ ...prev, mode: 'hybrid' }));
    const handleOffline = () => {
      setState(prev => ({ ...prev, mode: 'stealth' }));
      console.log('[SovereignAI] Network offline - activating stealth mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get models sorted by priority (smallest first)
  const getAvailableModels = useCallback((): SovereignModel[] => {
    return [...SOVEREIGN_MODELS].sort((a, b) => a.priority - b.priority);
  }, []);

  // Get recommended model based on hardware
  const getRecommendedModel = useCallback((): SovereignModel => {
    const tier = capabilities.tier;
    
    // For enterprise tier, try larger models
    if (tier === 'enterprise') {
      return SOVEREIGN_MODELS.find(m => m.size === '3B') || SOVEREIGN_MODELS[0];
    }
    // For high tier, try 2B or 3B
    if (tier === 'high') {
      return SOVEREIGN_MODELS.find(m => m.size === '2B' || m.size === '3B') || SOVEREIGN_MODELS[0];
    }
    // For mid tier, use 1B models
    if (tier === 'mid') {
      return SOVEREIGN_MODELS.find(m => m.size === '1B' || m.size === '1.1B') || SOVEREIGN_MODELS[0];
    }
    // For low tier, use smallest models
    return SOVEREIGN_MODELS[0]; // SmolLM2 Nano
  }, [capabilities.tier]);

  // Initialize the Sovereign AI engine
  const initializeSovereignEngine = useCallback(async (modelId?: string): Promise<boolean> => {
    // Return existing promise if already loading
    if (initPromiseRef.current) {
      console.log('[SovereignAI] Already loading, returning existing promise');
      return initPromiseRef.current;
    }

    // If already ready with requested model, return true
    if (stateRef.current.isReady && (!modelId || stateRef.current.activeModel?.id === modelId)) {
      console.log('[SovereignAI] Engine already ready with:', stateRef.current.activeModel?.name);
      return true;
    }

    // Build priority queue - smallest models first for reliability
    const buildModelQueue = (): SovereignModel[] => {
      const sorted = [...SOVEREIGN_MODELS].sort((a, b) => a.priority - b.priority);
      
      // If specific model requested, try it first
      if (modelId) {
        const requested = sorted.find(m => m.id === modelId);
        if (requested) {
          const others = sorted.filter(m => m.id !== modelId);
          return [requested, ...others];
        }
      }
      
      // Otherwise use recommended model first, then fallback to smaller
      const recommended = getRecommendedModel();
      const recommendedIdx = sorted.findIndex(m => m.id === recommended.id);
      
      // Start from recommended, then try smaller models
      const result: SovereignModel[] = [];
      for (let i = recommendedIdx; i >= 0; i--) {
        result.push(sorted[i]);
      }
      // Add larger models as last resort
      for (let i = recommendedIdx + 1; i < sorted.length; i++) {
        result.push(sorted[i]);
      }
      
      return result;
    };

    const modelQueue = buildModelQueue();
    console.log('[SovereignAI] Model queue:', modelQueue.map(m => `${m.name} (${m.size})`).join(' → '));

    initPromiseRef.current = (async () => {
      let lastError: Error | null = null;

      for (const targetModel of modelQueue) {
        console.log(`[SovereignAI] Attempting to load: ${targetModel.name} (${targetModel.id})`);
        
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
          loadStage: `🔐 Loading ${targetModel.name}...`,
          loadProgress: 0,
        }));

        try {
          // Import WebLLM dynamically
          const webllm = await import('@mlc-ai/web-llm');
          console.log('[SovereignAI] WebLLM imported');

          // Progress callback with detailed stages
          const progressCallback = (progress: any) => {
            const percent = Math.round((progress.progress || 0) * 100);
            let stage = progress.text || 'Loading...';
            
            // Clean up and brand the progress messages
            if (stage.includes('Fetching') || stage.includes('Loading')) {
              stage = `📥 Downloading ${targetModel.name}... ${percent}%`;
            } else if (stage.includes('Compiling') || stage.includes('shader')) {
              stage = stateRef.current.isWASMFallback 
                ? `🔧 Compiling for CPU... ${percent}%`
                : `🔧 Compiling for GPU... ${percent}%`;
            } else if (stage.includes('finish') || percent >= 95) {
              stage = '✅ Almost ready...';
            }

            setState(prev => ({
              ...prev,
              loadProgress: percent,
              loadStage: stage,
            }));
          };

          // Unload any previous engine
          if (engineRef.current) {
            try {
              await engineRef.current.unload();
            } catch (e) {
              console.warn('[SovereignAI] Error unloading previous model:', e);
            }
            engineRef.current = null;
          }

          // Calculate timeout based on model size (min 60s, max 300s)
          const baseTimeout = 60000;
          const sizeMultiplier = targetModel.sizeBytes / 100_000_000; // Per 100MB
          const timeoutMs = Math.min(Math.max(baseTimeout, sizeMultiplier * 15000), 300000);
          console.log(`[SovereignAI] Using timeout: ${Math.round(timeoutMs/1000)}s`);

          // Create engine with timeout
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Loading timeout')), timeoutMs)
          );

          const loadPromise = webllm.CreateMLCEngine(targetModel.id, {
            initProgressCallback: progressCallback,
          });

          engineRef.current = await Promise.race([loadPromise, timeoutPromise]);

          // Success!
          setState(prev => ({
            ...prev,
            isReady: true,
            isLoading: false,
            loadProgress: 100,
            loadStage: `✅ ${targetModel.name} ready`,
            activeModel: targetModel,
            error: null,
            maxContextTokens: targetModel.tier === 'enterprise' ? 8192 : 4096,
          }));

          console.log('[SovereignAI] ✅ Engine ready:', targetModel.name);
          initPromiseRef.current = null;
          return true;

        } catch (e: any) {
          console.warn(`[SovereignAI] Failed to load ${targetModel.name}:`, e.message);
          lastError = e;
          
          // Show fallback message
          const nextModel = modelQueue[modelQueue.indexOf(targetModel) + 1];
          if (nextModel) {
            setState(prev => ({
              ...prev,
              loadStage: `⚠️ ${targetModel.name} failed, trying ${nextModel.name}...`,
            }));
          }
          
          // Small delay before next attempt
          await new Promise(r => setTimeout(r, 300));
        }
      }

      // All models failed
      const errorMsg = `Unable to load offline AI. ${lastError?.message || 'Unknown error'}

Please try:
• Closing other browser tabs
• Using Chrome, Edge, or Brave
• Refreshing the page`;

      console.error('[SovereignAI] All models failed');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
        loadStage: '❌ Failed to initialize',
      }));
      
      initPromiseRef.current = null;
      return false;
    })();

    return initPromiseRef.current;
  }, [getRecommendedModel]);

  // Build context from business memories
  const buildBusinessContext = useCallback((): string => {
    if (!memories || memories.length === 0) return '';
    const activeMemories = memories.filter(m => m.is_active);
    if (activeMemories.length === 0) return '';

    const contextParts = activeMemories.slice(0, 5).map(m => 
      `[${m.category.toUpperCase()}] ${m.title}: ${m.content.slice(0, 200)}`
    );
    return `\n\n📊 USER CONTEXT:\n${contextParts.join('\n')}`;
  }, [memories]);

  // Build RAG context
  const buildRAGContext = useCallback(async (query: string): Promise<string> => {
    if (documentCount === 0) return '';
    try {
      const results = await ragSearch(query, 3, 0.4);
      if (results.length === 0) return '';
      const contextParts = results.map((r, i) => 
        `[Source ${i + 1}]: ${r.text.slice(0, 400)}...`
      );
      return `\n\n📚 KNOWLEDGE BASE:\n${contextParts.join('\n')}`;
    } catch {
      return '';
    }
  }, [documentCount, ragSearch]);

  // Generate response
  const generateResponse = useCallback(async (
    messages: WebLLMMessage[],
    options?: {
      onChunk?: (chunk: string) => void;
      useRAG?: boolean;
      useBusinessContext?: boolean;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> => {
    const {
      onChunk,
      useRAG = true,
      useBusinessContext = true,
      maxTokens = 1024,
      temperature = 0.7,
    } = options || {};

    // Ensure engine is ready
    if (!engineRef.current || !stateRef.current.isReady) {
      const loaded = await initializeSovereignEngine();
      if (!loaded || !engineRef.current) {
        const errorMsg = "🔧 Initializing offline AI...";
        if (onChunk) onChunk(errorMsg);
        return errorMsg;
      }
    }

    try {
      // Build enhanced system prompt
      let systemPrompt = SOVEREIGN_SYSTEM_PROMPT;
      
      if (useBusinessContext) {
        systemPrompt += buildBusinessContext();
      }

      if (useRAG && messages.length > 0) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
        const ragContext = await buildRAGContext(lastUserMessage);
        systemPrompt += ragContext;
      }

      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages,
      ];

      if (onChunk) {
        // Streaming response
        let fullResponse = '';
        const asyncGenerator = await engineRef.current.chat.completions.create({
          messages: formattedMessages,
          stream: true,
          max_tokens: maxTokens,
          temperature,
        });

        for await (const chunk of asyncGenerator) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        }

        return fullResponse;
      } else {
        const response = await engineRef.current.chat.completions.create({
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        });

        return response.choices[0]?.message?.content || '';
      }
    } catch (e: any) {
      console.error('[SovereignAI] Generation error:', e);
      const errorMsg = `⚠️ Error: ${e.message}`;
      if (onChunk) onChunk(errorMsg);
      return errorMsg;
    }
  }, [initializeSovereignEngine, buildBusinessContext, buildRAGContext]);

  // Switch to different model
  const switchModel = useCallback(async (modelId: string): Promise<boolean> => {
    if (stateRef.current.activeModel?.id === modelId && engineRef.current) {
      return true;
    }
    return initializeSovereignEngine(modelId);
  }, [initializeSovereignEngine]);

  // Unload model to free memory
  const unloadModel = useCallback(async () => {
    if (engineRef.current) {
      try {
        await engineRef.current.unload();
        engineRef.current = null;
        setState(prev => ({
          ...prev,
          isReady: false,
          activeModel: null,
          contextTokens: 0,
        }));
        console.log('[SovereignAI] Model unloaded');
      } catch (e) {
        console.error('[SovereignAI] Unload error:', e);
      }
    }
  }, []);

  // Clear context
  const clearContext = useCallback(() => {
    setState(prev => ({ ...prev, contextTokens: 0 }));
  }, []);

  // Get storage estimate
  const getStorageEstimate = useCallback((): { used: number; available: number } => {
    return {
      used: stateRef.current.activeModel?.sizeBytes || 0,
      available: capabilities.estimatedStorage * 1e9,
    };
  }, [capabilities.estimatedStorage]);

  return {
    ...state,
    availableModels: getAvailableModels(),
    recommendedModel: getRecommendedModel(),
    initializeSovereignEngine,
    generateResponse,
    switchModel,
    unloadModel,
    clearContext,
    getStorageEstimate,
    capabilities,
  };
};
