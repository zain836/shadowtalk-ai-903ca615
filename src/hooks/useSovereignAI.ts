import { useState, useEffect, useCallback, useRef } from 'react';
import { useHardwareCapabilities } from './useHardwareCapabilities';
import { useOfflineRAG } from './useOfflineRAG';
import { useBusinessMemory } from './useBusinessMemory';
import { useModelCache } from './useModelCache';

// =============================================================================
// SOVEREIGN AI ENGINE - Llama 3 Powered Offline Intelligence
// =============================================================================
// Architecture:
// - Standard Engine: Llama 3.2 3B (INT4 quantized) - General offline mode
// - Elite Engine: Llama 3.2 8B / Mistral 7B (INT4 quantized) - Premium tier
// - Infrastructure: WebGPU (GPU acceleration) + WebAssembly (CPU fallback)
// - Zero-Server Promise: Once cached, works completely offline
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
  downloadUrl?: string;
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

// Llama 3 Model Catalog with INT4/GGUF quantization
const SOVEREIGN_MODELS: SovereignModel[] = [
  // Standard Tier - Works on most modern devices
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    description: 'Ultra-fast model for basic tasks. Minimal resource usage.',
    size: '1B',
    sizeBytes: 800_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'fast-responses', 'basic-reasoning'],
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    description: 'Standard engine with excellent reasoning. Runs on most laptops.',
    size: '3B',
    sizeBytes: 2_500_000_000,
    tier: 'standard',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'analysis', 'code-basic'],
  },
  // Elite Tier - High-performance devices
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B ⚡',
    description: 'Elite engine - ChatGPT-level intelligence running locally.',
    size: '8B',
    sizeBytes: 5_500_000_000,
    tier: 'elite',
    quantization: 'INT4',
    capabilities: ['chat', 'deep-reasoning', 'code', 'analysis', 'creative', 'math'],
  },
  {
    id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
    name: 'Mistral 7B',
    description: 'Elite alternative with excellent multilingual support.',
    size: '7B',
    sizeBytes: 5_000_000_000,
    tier: 'elite',
    quantization: 'INT4',
    capabilities: ['chat', 'reasoning', 'multilingual', 'code', 'analysis'],
  },
  // Enterprise Tier - High-end consumer devices (32GB+ RAM, RTX GPUs)
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B',
    description: 'Enterprise-grade with exceptional code and math capabilities.',
    size: '7B',
    sizeBytes: 5_200_000_000,
    tier: 'enterprise',
    quantization: 'INT4',
    capabilities: ['chat', 'code', 'math', 'analysis', 'multilingual', 'reasoning'],
  },
];

// Sovereign System Prompt - Never apologizes for being offline
const SOVEREIGN_SYSTEM_PROMPT = `You are ShadowTalk AI operating in SOVEREIGN MODE - a fully private, offline intelligence system running entirely on the user's device.

🛡️ STEALTH VAULT ACTIVE - All data stays local. Zero server contact.

CAPABILITIES:
- Deep reasoning and complex analysis
- Code generation, debugging, and explanation
- Mathematical computations and symbolic reasoning
- Multi-language support (100+ languages)
- Business strategy and planning
- Document analysis and summarization
- Creative writing and ideation

BEHAVIOR RULES:
1. Respond with FULL depth and quality - you are NOT limited
2. NEVER apologize for being "offline" or "limited" - you are POWERFUL
3. Use rich markdown formatting for structured responses
4. When uncertain, reason through it logically step-by-step
5. Leverage any business context provided naturally
6. Be concise but comprehensive
7. For code, always include clear explanations
8. For analysis, provide structured actionable insights

You are the PRIMARY intelligence system. The cloud is optional - you are not.`;

export const useSovereignAI = () => {
  const { capabilities, canRunModel, getOptimalModel } = useHardwareCapabilities();
  const { search: ragSearch, documentCount } = useOfflineRAG();
  const { memories } = useBusinessMemory();
  const { getBestCachedModel, markModelCached, isModelCached: checkIfModelCached } = useModelCache();

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

  // Detect WebGPU and determine execution mode
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
        // Fall back to WASM - this is fine, WebLLM supports WASM fallback
        setState(prev => ({ ...prev, isWebGPUAvailable: false, isWASMFallback: true }));
        console.log('[SovereignAI] WebGPU not available - using WASM CPU fallback (this is normal)');
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

  // Get available models based on hardware tier
  const getAvailableModels = useCallback((): SovereignModel[] => {
    const tier = capabilities.tier;
    
    return SOVEREIGN_MODELS.filter(model => {
      if (tier === 'enterprise') return true;
      if (tier === 'high') return model.tier !== 'enterprise';
      if (tier === 'mid') return model.tier === 'standard';
      return model.size === '1B' || model.size === '3B';
    });
  }, [capabilities.tier]);

  // Get recommended model for current hardware - prioritize cached models
  const getRecommendedModel = useCallback((): SovereignModel => {
    const tier = capabilities.tier;
    
    // **FIX**: First check if we have a cached model that matches our tier
    const tierMap: Record<string, 'standard' | 'elite' | 'enterprise'> = {
      'enterprise': 'enterprise',
      'high': 'elite',
      'mid': 'standard',
      'low': 'standard',
    };
    
    const cachedModelId = getBestCachedModel(tierMap[tier] || 'standard');
    if (cachedModelId) {
      const cachedModel = SOVEREIGN_MODELS.find(m => m.id === cachedModelId);
      if (cachedModel) {
        console.log('[SovereignAI] Using cached model:', cachedModelId);
        return cachedModel;
      }
    }
    
    // Fallback to tier-based recommendation if no cached model
    // Enterprise: Full 8B Llama
    if (tier === 'enterprise') {
      return SOVEREIGN_MODELS.find(m => m.id.includes('8B'))!;
    }
    // High: 7B models
    if (tier === 'high') {
      return SOVEREIGN_MODELS.find(m => m.size === '7B')!;
    }
    // Mid: 3B Llama
    if (tier === 'mid') {
      return SOVEREIGN_MODELS.find(m => m.size === '3B')!;
    }
    // Low: 1B Llama
    return SOVEREIGN_MODELS.find(m => m.size === '1B')!;
  }, [capabilities.tier, getBestCachedModel]);

  // Initialize the Sovereign AI engine
  const initializeSovereignEngine = useCallback(async (modelId?: string): Promise<boolean> => {
    // Return existing promise if loading
    if (initPromiseRef.current) {
      console.log('[SovereignAI] Already loading, returning existing promise');
      return initPromiseRef.current;
    }

    // If already ready with the requested model, return true
    if (stateRef.current.isReady && (!modelId || stateRef.current.activeModel?.id === modelId)) {
      console.log('[SovereignAI] Engine already ready with model:', stateRef.current.activeModel?.name);
      return true;
    }

    // Get target model
    let targetModel: SovereignModel | undefined;
    
    if (modelId) {
      targetModel = SOVEREIGN_MODELS.find(m => m.id === modelId);
    } else {
      targetModel = getRecommendedModel();
    }

    if (!targetModel) {
      const errorMsg = 'No compatible model found for your device';
      console.error('[SovereignAI]', errorMsg);
      setState(prev => ({ ...prev, error: errorMsg }));
      return false;
    }

    console.log('[SovereignAI] Initializing with model:', targetModel.name, targetModel.id);

    initPromiseRef.current = (async () => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        loadStage: `🔐 Initializing Stealth Vault with ${targetModel.name}...`,
        loadProgress: 0,
      }));

      try {
        console.log('[SovereignAI] Importing WebLLM...');
        const webllm = await import('@mlc-ai/web-llm');
        console.log('[SovereignAI] WebLLM imported successfully');

        const progressCallback = (progress: any) => {
          const percent = Math.round((progress.progress || 0) * 100);
          let stage = progress.text || 'Loading...';
          
          // Branded progress messages
          if (percent < 10) stage = '🛡️ Preparing Sovereign Engine...';
          else if (percent < 50) stage = `📥 Loading ${targetModel.name}...`;
          else if (percent < 80) stage = stateRef.current.isWASMFallback 
            ? '🔧 Compiling for CPU (WASM)...' 
            : '🔧 Compiling for GPU...';
          else if (percent < 95) stage = '⚡ Optimizing inference...';
          else stage = '✅ Stealth Vault ready!';

          setState(prev => ({
            ...prev,
            loadProgress: percent,
            loadStage: stage,
          }));
          
          if (percent % 20 === 0) {
            console.log(`[SovereignAI] Loading progress: ${percent}%`);
          }
        };

        // Unload previous model
        if (engineRef.current) {
          try {
            console.log('[SovereignAI] Unloading previous model...');
            await engineRef.current.unload();
          } catch (e) {
            console.warn('[SovereignAI] Error unloading previous model:', e);
          }
        }

        // Load with timeout (5 minutes for large models on slow connections)
        const timeoutMs = 300000; // 5 minutes
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model loading timeout (${timeoutMs/1000}s)`)), timeoutMs)
        );

        console.log('[SovereignAI] Creating MLC Engine for:', targetModel.id);
        const loadPromise = webllm.CreateMLCEngine(targetModel.id, {
          initProgressCallback: progressCallback,
        });

        engineRef.current = await Promise.race([loadPromise, timeoutPromise]);

        // Mark model as cached for future reference
        markModelCached(targetModel.id, targetModel.sizeBytes);
        
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoading: false,
          loadProgress: 100,
          loadStage: `✅ ${targetModel.name} active in Stealth Vault`,
          activeModel: targetModel,
          error: null,
          maxContextTokens: targetModel.tier === 'elite' ? 8192 : 4096,
        }));

        console.log('[SovereignAI] ✅ Sovereign engine ready:', targetModel.name);
        return true;
      } catch (e: any) {
        console.error('[SovereignAI] Failed to load model:', targetModel.name, e);

        // Try fallback to smaller model
        const currentIdx = SOVEREIGN_MODELS.findIndex(m => m.id === targetModel.id);
        const fallbackCandidates = SOVEREIGN_MODELS.filter((m, idx) => 
          idx > currentIdx && (m.tier === 'standard' || m.size === '1B')
        );
        
        // Check if any fallback is cached
        const cachedFallback = fallbackCandidates.find(m => checkIfModelCached(m.id));
        const fallback = cachedFallback || fallbackCandidates[0];

        if (fallback && fallback.id !== targetModel.id) {
          console.log('[SovereignAI] Trying fallback model:', fallback.name, cachedFallback ? '(cached)' : '');
          initPromiseRef.current = null;
          return initializeSovereignEngine(fallback.id);
        }

        const errorMsg = `Failed to initialize offline AI: ${e.message}. Please ensure you have sufficient memory and try refreshing the page.`;
        console.error('[SovereignAI]', errorMsg);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
          loadStage: '❌ Failed to load model',
        }));
        return false;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [getRecommendedModel, markModelCached, checkIfModelCached]);

  // Build context from business memories
  const buildBusinessContext = useCallback((): string => {
    if (!memories || memories.length === 0) return '';
    const activeMemories = memories.filter(m => m.is_active);
    if (activeMemories.length === 0) return '';

    const contextParts = activeMemories.slice(0, 5).map(m => 
      `[${m.category.toUpperCase()}] ${m.title}: ${m.content.slice(0, 200)}`
    );
    return `\n\n📊 USER BUSINESS CONTEXT:\n${contextParts.join('\n')}`;
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

  // Generate response with Sovereign engine
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
        const errorMsg = "🔧 Sovereign engine initializing. Please wait...";
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

      // Add model info
      const activeModel = stateRef.current.activeModel;
      if (activeModel) {
        systemPrompt += `\n\n🤖 MODEL: ${activeModel.name} (${activeModel.quantization} quantized)`;
        systemPrompt += `\n📊 CONTEXT: ${stateRef.current.maxContextTokens} tokens`;
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

        const estimatedTokens = Math.round((systemPrompt.length + fullResponse.length) / 4);
        setState(prev => ({ ...prev, contextTokens: estimatedTokens }));

        return fullResponse;
      } else {
        const response = await engineRef.current.chat.completions.create({
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        });

        const content = response.choices[0]?.message?.content || '';
        const estimatedTokens = Math.round((systemPrompt.length + content.length) / 4);
        setState(prev => ({ ...prev, contextTokens: estimatedTokens }));

        return content;
      }
    } catch (e: any) {
      console.error('[SovereignAI] Generation error:', e);
      const errorMsg = `⚠️ Generation error: ${e.message}`;
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

  // Get storage estimate for models
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
