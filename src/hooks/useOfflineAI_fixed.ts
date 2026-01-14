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
  fallbackMode: boolean; // NEW: indicates using fallback instead of WebLLM
}

// Model configuration - using smaller, more compatible models
const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
const FALLBACK_MODEL = 'SmolLM2-135M-Instruct-q4f16_1-MLC';
const TERTIARY_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';

// Simple rule-based fallback responses
const FALLBACK_RESPONSES = {
  greeting: [
    "Hello! I'm running in offline mode with limited capabilities. How can I help you?",
    "Hi there! I'm working offline right now. What can I assist you with?",
  ],
  help: [
    "I'm currently in offline mode. I can provide basic assistance, but my capabilities are limited compared to when I'm online.",
  ],
  default: [
    "I understand you're asking about that. However, I'm running in offline mode and my capabilities are limited. For the best experience, please connect to the internet.",
    "I'm working offline right now, so I can't provide a detailed response. Please try again when you're online for a better answer.",
  ],
};

export const useOfflineAI = () => {
  const [state, setState] = useState<OfflineAIState>({
    isModelLoaded: false,
    isLoading: false,
    loadProgress: 0,
    loadStage: '',
    error: null,
    isSupported: false,
    fallbackMode: false,
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
        
        // WebGPU not supported - enable fallback mode
        console.log('[Offline AI] WebGPU not supported, using fallback mode');
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          fallbackMode: true,
          isModelLoaded: true, // Fallback is always "ready"
          error: null,
        }));
      } catch (e) {
        console.log('[Offline AI] WebGPU check failed, using fallback mode');
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          fallbackMode: true,
          isModelLoaded: true,
          error: null,
        }));
      }
    };
    checkSupport();
  }, []);

  // Initialize the model
  const initializeModel = useCallback(async (): Promise<boolean> => {
    // If in fallback mode, no need to load model
    if (state.fallbackMode) {
      return true;
    }

    // Return existing promise if already initializing
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Already loaded
    if (state.isModelLoaded && engineRef.current) {
      return true;
    }

    if (!state.isSupported) {
      // Switch to fallback mode
      setState(prev => ({ ...prev, fallbackMode: true, isModelLoaded: true }));
      return true;
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
            
            // Set timeout for model loading (60 seconds)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Model loading timeout')), 60000)
            );
            
            const loadPromise = webllm.CreateMLCEngine(model, {
              initProgressCallback: progressCallback,
            });
            
            engineRef.current = await Promise.race([loadPromise, timeoutPromise]);
            modelToUse = model;
            loadSuccess = true;
            break;
          } catch (e: any) {
            console.warn(`[Offline AI] Failed to load ${model}:`, e.message);
            if (model === modelsToTry[modelsToTry.length - 1]) {
              // All models failed, switch to fallback
              console.log('[Offline AI] All models failed, switching to fallback mode');
              setState(prev => ({
                ...prev,
                isModelLoaded: true,
                isLoading: false,
                loadProgress: 100,
                loadStage: 'Using simple fallback mode',
                fallbackMode: true,
              }));
              return true;
            }
          }
        }

        if (loadSuccess) {
          setState(prev => ({
            ...prev,
            isModelLoaded: true,
            isLoading: false,
            loadProgress: 100,
            loadStage: 'Model ready!',
            fallbackMode: false,
          }));

          console.log('[Offline AI] Model loaded:', modelToUse);
        }
        
        return true;
      } catch (e: any) {
        console.error('[Offline AI] Error loading model:', e);
        
        // Switch to fallback mode instead of failing
        setState(prev => ({
          ...prev,
          isLoading: false,
          isModelLoaded: true,
          fallbackMode: true,
          error: null,
          loadStage: 'Using simple fallback mode',
        }));
        
        return true;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [state.isSupported, state.isModelLoaded, state.fallbackMode]);

  // Simple fallback response generator
  const generateFallbackResponse = (messages: WebLLMMessage[]): string => {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Check for greetings
    if (lastMessage.match(/\b(hi|hello|hey|greetings)\b/i)) {
      return FALLBACK_RESPONSES.greeting[Math.floor(Math.random() * FALLBACK_RESPONSES.greeting.length)];
    }
    
    // Check for help requests
    if (lastMessage.match(/\b(help|assist|support)\b/i)) {
      return FALLBACK_RESPONSES.help[0];
    }
    
    // Default response
    return FALLBACK_RESPONSES.default[Math.floor(Math.random() * FALLBACK_RESPONSES.default.length)];
  };

  // Generate response
  const generateResponse = useCallback(async (
    messages: WebLLMMessage[],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    // If in fallback mode, use simple responses
    if (state.fallbackMode) {
      const response = generateFallbackResponse(messages);
      if (onChunk) {
        // Simulate streaming
        for (let i = 0; i < response.length; i += 3) {
          onChunk(response.substring(i, i + 3));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      return response;
    }

    if (!engineRef.current) {
      const loaded = await initializeModel();
      if (!loaded && !state.fallbackMode) {
        throw new Error('Failed to load AI model');
      }
      
      // If we switched to fallback during init
      if (state.fallbackMode) {
        return generateFallbackResponse(messages);
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
      
      // Fall back to simple responses on error
      setState(prev => ({ ...prev, fallbackMode: true }));
      return generateFallbackResponse(messages);
    }
  }, [initializeModel, state.fallbackMode]);

  // Unload model to free memory
  const unloadModel = useCallback(async () => {
    if (engineRef.current && !state.fallbackMode) {
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
  }, [state.fallbackMode]);

  return {
    ...state,
    initializeModel,
    generateResponse,
    unloadModel,
  };
};
