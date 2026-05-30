import { useState, useEffect, useCallback, useRef } from 'react';
import { useHardwareCapabilities } from './useHardwareCapabilities';
import { useOfflineRAG } from './useOfflineRAG';
import { useBusinessMemory } from './useBusinessMemory';
import { SHADOWTALK_SELF_KNOWLEDGE_BRIEF } from '@/lib/shadowTalkProductKnowledge';

interface WebLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ModelInfo {
  id: string;
  name: string;
  size: string;
  capabilities: string[];
  status: 'not_loaded' | 'downloading' | 'ready' | 'error';
  downloadProgress: number;
  downloadedSize?: number;
}

interface AdvancedOfflineAIState {
  isReady: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadStage: string;
  error: string | null;
  activeModel: string | null;
  availableModels: ModelInfo[];
  performanceTier: 'low' | 'mid' | 'high' | 'enterprise';
  contextTokens: number;
  maxContextTokens: number;
}

// Extended model catalog with capabilities
const MODEL_CATALOG: Record<string, Omit<ModelInfo, 'status' | 'downloadProgress'>> = {
  'SmolLM2-360M-Instruct-q4f16_1-MLC': {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M',
    size: '360M',
    capabilities: ['chat', 'basic-qa'],
  },
  'SmolLM2-1.7B-Instruct-q4f16_1-MLC': {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B',
    size: '1.7B',
    capabilities: ['chat', 'reasoning', 'code-basic'],
  },
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    size: '1.5B',
    capabilities: ['chat', 'code', 'multilingual'],
  },
  'Qwen2.5-3B-Instruct-q4f16_1-MLC': {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B',
    size: '3B',
    capabilities: ['chat', 'code', 'reasoning', 'multilingual'],
  },
  'Phi-3.5-mini-instruct-q4f16_1-MLC': {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi-3.5 Mini (3.8B)',
    size: '3.8B',
    capabilities: ['chat', 'reasoning', 'code', 'analysis', 'math'],
  },
  'Llama-3.2-1B-Instruct-q4f16_1-MLC': {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    size: '1B',
    capabilities: ['chat', 'reasoning'],
  },
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    size: '3B',
    capabilities: ['chat', 'reasoning', 'analysis'],
  },
};

// Enhanced system prompt for sovereign mode
const SOVEREIGN_SYSTEM_PROMPT = `You are ShadowTalk AI operating in SOVEREIGN MODE - a fully private, offline intelligence system running entirely on the user's device.

CAPABILITIES (Available Offline):
- Deep reasoning and analysis
- Code generation and debugging
- Mathematical computations
- Multi-language support
- Business strategy and planning
- Document analysis

BEHAVIOR RULES:
1. Respond with the SAME depth and quality as if you were online
2. Never apologize for being "limited" or "offline" - you are POWERFUL
3. Use markdown formatting for structured responses
4. When you don't know something, reason through it logically
5. Leverage any business context provided naturally
6. Be concise but comprehensive
7. For code, always include explanations
8. For analysis, provide structured insights

You are not a "fallback" - you are the PRIMARY intelligence system running with full local capabilities.`;

export const useAdvancedOfflineAI = () => {
  const { capabilities, getOptimalModel, getModelForTask, canRunModel } = useHardwareCapabilities();
  const { search: ragSearch, documentCount } = useOfflineRAG();
  const { memories } = useBusinessMemory();

  const [state, setState] = useState<AdvancedOfflineAIState>({
    isReady: false,
    isLoading: false,
    loadProgress: 0,
    loadStage: '',
    error: null,
    activeModel: null,
    availableModels: [],
    performanceTier: 'low',
    contextTokens: 0,
    maxContextTokens: 4096,
  });

  const engineRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<boolean> | null>(null);
  const stateRef = useRef(state);
  const conversationContextRef = useRef<WebLLMMessage[]>([]);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize available models based on hardware
  useEffect(() => {
    const tier = capabilities.tier;
    const recommendedModels = capabilities.recommendedModels;

    const availableModels: ModelInfo[] = Object.entries(MODEL_CATALOG)
      .filter(([id]) => recommendedModels.includes(id) || canRunModel(MODEL_CATALOG[id].size))
      .map(([, model]) => ({
        ...model,
        status: 'not_loaded' as const,
        downloadProgress: 0,
      }));

    setState(prev => ({
      ...prev,
      availableModels,
      performanceTier: tier,
      maxContextTokens: tier === 'enterprise' ? 8192 : tier === 'high' ? 4096 : 2048,
    }));
  }, [capabilities, canRunModel]);

  // Build context from business memories
  const buildBusinessContext = useCallback((): string => {
    if (!memories || memories.length === 0) return '';

    const activeMemories = memories.filter(m => m.is_active);
    if (activeMemories.length === 0) return '';

    const contextParts = activeMemories.map(m => 
      `[${m.category.toUpperCase()}] ${m.title}: ${m.content}`
    );

    return `\n\nUSER'S BUSINESS CONTEXT:\n${contextParts.join('\n')}`;
  }, [memories]);

  // Build RAG context from relevant documents
  const buildRAGContext = useCallback(async (query: string): Promise<string> => {
    if (documentCount === 0) return '';

    try {
      const results = await ragSearch(query, 3, 0.4);
      if (results.length === 0) return '';

      const contextParts = results.map((r, i) => 
        `[Source ${i + 1}]: ${r.text.slice(0, 500)}...`
      );

      return `\n\nRELEVANT KNOWLEDGE:\n${contextParts.join('\n')}`;
    } catch (e) {
      console.warn('[AdvancedOfflineAI] RAG search failed:', e);
      return '';
    }
  }, [documentCount, ragSearch]);

  // Load a specific model
  const loadModel = useCallback(async (modelId?: string): Promise<boolean> => {
    const targetModel = modelId || getOptimalModel();

    // Return existing promise if already loading
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Already loaded this model
    if (stateRef.current.activeModel === targetModel && engineRef.current) {
      return true;
    }

    // Check if model is supported
    const modelInfo = MODEL_CATALOG[targetModel];
    if (!modelInfo) {
      setState(prev => ({ ...prev, error: `Unknown model: ${targetModel}` }));
      return false;
    }

    if (!canRunModel(modelInfo.size)) {
      console.warn('[AdvancedOfflineAI] Model too large for device:', targetModel);
      // Try to fall back to optimal model
      const optimalModel = getOptimalModel();
      if (optimalModel !== targetModel) {
        return loadModel(optimalModel);
      }
      setState(prev => ({ ...prev, error: 'No compatible models for this device' }));
      return false;
    }

    initPromiseRef.current = (async () => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        loadStage: `Initializing ${modelInfo.name}...`,
        loadProgress: 0,
      }));

      // Update model status
      setState(prev => ({
        ...prev,
        availableModels: prev.availableModels.map(m =>
          m.id === targetModel ? { ...m, status: 'downloading' as const } : m
        ),
      }));

      try {
        const webllm = await import('@mlc-ai/web-llm');

        const progressCallback = (progress: any) => {
          const percent = Math.round((progress.progress || 0) * 100);
          setState(prev => ({
            ...prev,
            loadProgress: percent,
            loadStage: progress.text || `Loading ${modelInfo.name}...`,
            availableModels: prev.availableModels.map(m =>
              m.id === targetModel ? { ...m, downloadProgress: percent } : m
            ),
          }));
        };

        // Unload previous model if exists
        if (engineRef.current) {
          try {
            await engineRef.current.unload();
          } catch (e) {
            console.warn('[AdvancedOfflineAI] Error unloading previous model:', e);
          }
        }

        // Load with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Model loading timeout (120s)')), 120000)
        );

        const loadPromise = webllm.CreateMLCEngine(targetModel, {
          initProgressCallback: progressCallback,
        });

        engineRef.current = await Promise.race([loadPromise, timeoutPromise]);

        setState(prev => ({
          ...prev,
          isReady: true,
          isLoading: false,
          loadProgress: 100,
          loadStage: `${modelInfo.name} ready!`,
          activeModel: targetModel,
          error: null,
          availableModels: prev.availableModels.map(m =>
            m.id === targetModel 
              ? { ...m, status: 'ready' as const, downloadProgress: 100 }
              : m
          ),
        }));

        console.log('[AdvancedOfflineAI] Model loaded:', targetModel);
        return true;
      } catch (e: any) {
        console.error('[AdvancedOfflineAI] Failed to load model:', e);

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: e.message || 'Failed to load model',
          availableModels: prev.availableModels.map(m =>
            m.id === targetModel ? { ...m, status: 'error' as const } : m
          ),
        }));

        // Try fallback to smaller model
        const currentIndex = stateRef.current.availableModels.findIndex(m => m.id === targetModel);
        const fallbackModel = stateRef.current.availableModels[currentIndex + 1];
        
        if (fallbackModel) {
          console.log('[AdvancedOfflineAI] Trying fallback model:', fallbackModel.id);
          initPromiseRef.current = null;
          return loadModel(fallbackModel.id);
        }

        return false;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [getOptimalModel, canRunModel]);

  // Generate response with full capabilities
  const generateResponse = useCallback(async (
    messages: WebLLMMessage[],
    options?: {
      onChunk?: (chunk: string) => void;
      useRAG?: boolean;
      useBusinessContext?: boolean;
      taskType?: 'chat' | 'code' | 'reasoning' | 'fast';
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> => {
    const {
      onChunk,
      useRAG = true,
      useBusinessContext = true,
      taskType = 'chat',
      maxTokens = 1024,
      temperature = 0.7,
    } = options || {};

    // Ensure model is loaded
    if (!engineRef.current || !stateRef.current.isReady) {
      const optimalModel = getModelForTask(taskType);
      const loaded = await loadModel(optimalModel);
      
      if (!loaded || !engineRef.current) {
        const errorMsg = "I'm having trouble loading the AI model. Please try again in a moment.";
        if (onChunk) onChunk(errorMsg);
        return errorMsg;
      }
    }

    try {
      // Build enhanced system prompt
      let systemPrompt = SOVEREIGN_SYSTEM_PROMPT;
      
      // Add business context
      if (useBusinessContext) {
        systemPrompt += buildBusinessContext();
      }

      // Add RAG context
      if (useRAG && messages.length > 0) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
        const ragContext = await buildRAGContext(lastUserMessage);
        systemPrompt += ragContext;
      }

      // Add capability information
      systemPrompt += `\n\nMODEL: ${stateRef.current.activeModel}`;
      systemPrompt += `\nCONTEXT WINDOW: ${stateRef.current.maxContextTokens} tokens`;
      if (documentCount > 0) {
        systemPrompt += `\nINDEXED DOCUMENTS: ${documentCount}`;
      }

      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages,
      ];

      // Store context for continuity
      conversationContextRef.current = formattedMessages;

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

        // Update context tokens estimate
        const estimatedTokens = Math.round((systemPrompt.length + fullResponse.length) / 4);
        setState(prev => ({ ...prev, contextTokens: estimatedTokens }));

        return fullResponse;
      } else {
        // Non-streaming response
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
      console.error('[AdvancedOfflineAI] Generation error:', e);
      const errorMsg = `Error generating response: ${e.message}`;
      if (onChunk) onChunk(errorMsg);
      return errorMsg;
    }
  }, [loadModel, buildBusinessContext, buildRAGContext, documentCount, getModelForTask]);

  // Switch to a different model
  const switchModel = useCallback(async (modelId: string): Promise<boolean> => {
    if (stateRef.current.activeModel === modelId && engineRef.current) {
      return true;
    }
    return loadModel(modelId);
  }, [loadModel]);

  // Unload current model
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
          availableModels: prev.availableModels.map(m => ({
            ...m,
            status: 'not_loaded' as const,
          })),
        }));
        console.log('[AdvancedOfflineAI] Model unloaded');
      } catch (e) {
        console.error('[AdvancedOfflineAI] Error unloading:', e);
      }
    }
  }, []);

  // Clear conversation context
  const clearContext = useCallback(() => {
    conversationContextRef.current = [];
    setState(prev => ({ ...prev, contextTokens: 0 }));
  }, []);

  // Auto-initialize when offline
  useEffect(() => {
    const handleOffline = () => {
      if (!stateRef.current.isReady && !stateRef.current.isLoading) {
        console.log('[AdvancedOfflineAI] Went offline, auto-initializing...');
        loadModel();
      }
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [loadModel]);

  return {
    ...state,
    loadModel,
    generateResponse,
    switchModel,
    unloadModel,
    clearContext,
    getModelForTask,
    capabilities,
  };
};
