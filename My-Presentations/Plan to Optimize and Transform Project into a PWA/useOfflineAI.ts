import { useState, useEffect, useCallback, useRef } from 'react';

// WebLLM types
interface WebLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OfflineAIState {
  isModelLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadStage: string;
  error: string | null;
  isSupported: boolean;
}

// Model configuration - using smaller, more compatible models
const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
const FALLBACK_MODEL = 'SmolLM2-135M-Instruct-q4f16_1-MLC';
const TERTIARY_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';

export const useOfflineAI = () => {
  const [state, setState] = useState<OfflineAIState>({
    isModelLoaded: false,
    isLoading: false,
    loadProgress: 0,
    loadStage: '',
    error: null,
    isSupported: false,
  });
  
  const engineRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<boolean> | null>(null);

  // Check WebGPU support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if ('gpu' in navigator) {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            setState(prev => ({ ...prev, isSupported: true }));
            return;
          }
        }
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          error: 'WebGPU not supported. Offline AI requires a modern browser with WebGPU support.'
        }));
      } catch (e) {
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          error: 'Failed to check WebGPU support'
        }));
      }
    };
    checkSupport();
  }, []);

  // Initialize the model
  const initializeModel = useCallback(async (): Promise<boolean> => {
    // Return existing promise if already initializing
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Already loaded
    if (state.isModelLoaded && engineRef.current) {
      return true;
    }

    if (!state.isSupported) {
      return false;
    }

    initPromiseRef.current = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Dynamically import WebLLM to avoid loading it on page load
        const webllm = await import('@mlc-ai/web-llm');
        
        const progressCallback = (progress: any) => {
          setState(prev => ({
            ...prev,
            loadProgress: Math.round((progress.progress || 0) * 100),
            loadStage: progress.text || 'Loading model...',
          }));
        };

        // Try primary model first, then fallback, then tertiary
        let modelToUse = MODEL_ID;
        let loadSuccess = false;
        
        const modelsToTry = [MODEL_ID, FALLBACK_MODEL, TERTIARY_MODEL];
        
        for (const model of modelsToTry) {
          try {
            console.log('[Offline AI] Attempting to load:', model);
            engineRef.current = await webllm.CreateMLCEngine(model, {
              initProgressCallback: progressCallback,
            });
            modelToUse = model;
            loadSuccess = true;
            break;
          } catch (e: any) {
            console.warn(`[Offline AI] Failed to load ${model}:`, e.message);
            if (model === modelsToTry[modelsToTry.length - 1]) {
              throw new Error(`All models failed to load. Last error: ${e.message}`);
            }
          }
        }

        setState(prev => ({
          ...prev,
          isModelLoaded: true,
          isLoading: false,
          loadProgress: 100,
          loadStage: 'Model ready!',
        }));

        console.log('[Offline AI] Model loaded:', modelToUse);
        return true;
      } catch (e: any) {
        console.error('[Offline AI] Error loading model:', e);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: e.message || 'Failed to load AI model',
        }));
        return false;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [state.isSupported, state.isModelLoaded]);

  // Generate response
  const generateResponse = useCallback(async (
    messages: WebLLMMessage[],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    if (!engineRef.current) {
      const loaded = await initializeModel();
      if (!loaded) {
        throw new Error('Failed to load AI model');
      }
    }

    try {
      const formattedMessages = [
        {
          role: 'system' as const,
          content: 'You are ShadowTalk AI, a helpful assistant running offline on the user\'s device. Be concise and helpful.',
        },
        ...messages,
      ];

      if (onChunk) {
        // Streaming response
        let fullResponse = '';
        const asyncGenerator = await engineRef.current.chat.completions.create({
          messages: formattedMessages,
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
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
        // Non-streaming response
        const response = await engineRef.current.chat.completions.create({
          messages: formattedMessages,
          max_tokens: 512,
          temperature: 0.7,
        });
        return response.choices[0]?.message?.content || '';
      }
    } catch (e: any) {
      console.error('[Offline AI] Error generating response:', e);
      throw new Error(e.message || 'Failed to generate response');
    }
  }, [initializeModel]);

  // Unload model to free memory
  const unloadModel = useCallback(async () => {
    if (engineRef.current) {
      try {
        await engineRef.current.unload();
        engineRef.current = null;
        setState(prev => ({
          ...prev,
          isModelLoaded: false,
          loadProgress: 0,
          loadStage: '',
        }));
        console.log('[Offline AI] Model unloaded');
      } catch (e) {
        console.error('[Offline AI] Error unloading model:', e);
      }
    }
  }, []);

  return {
    ...state,
    initializeModel,
    generateResponse,
    unloadModel,
  };
};
