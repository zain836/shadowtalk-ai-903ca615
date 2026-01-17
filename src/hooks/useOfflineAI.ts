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
  fallbackMode: boolean;
}

// Model configuration - using smaller, more compatible models
const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
const FALLBACK_MODEL = 'SmolLM2-135M-Instruct-q4f16_1-MLC';
const TERTIARY_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';

// Enhanced rule-based fallback responses
const FALLBACK_RESPONSES = {
  greeting: [
    "Hello! I'm running in offline mode with limited capabilities. How can I help you?",
    "Hi there! I'm working offline right now. What can I assist you with?",
    "Hey! 👋 I'm ShadowTalk AI running locally. My capabilities are limited offline, but I'll do my best!",
  ],
  help: [
    "I'm currently in offline mode. I can:\n\n✅ **Available:**\n- Basic Q&A from cached knowledge\n- Simple text processing\n- Chat memory within this session\n\n❌ **Not Available:**\n- Internet search\n- Image generation\n- Complex reasoning\n\nConnect to the internet for full capabilities!",
  ],
  code: [
    "I can help with basic coding questions offline, but for complex debugging or code generation, please connect to the internet for better assistance.",
  ],
  weather: [
    "I can't check the weather in offline mode. Please connect to the internet for real-time weather information.",
  ],
  search: [
    "I can't search the web while offline. Please connect to the internet if you need current information.",
  ],
  default: [
    "I understand you're asking about that. I'm running in offline mode with limited capabilities. For the best experience, please connect to the internet.",
    "I'm working offline right now, so I can't provide a detailed response. Please try again when you're online for a better answer.",
    "That's an interesting question! Unfortunately, my offline capabilities are limited. I'd be able to help better once you're connected to the internet.",
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
  const autoInitAttempted = useRef(false);
  const stateRef = useRef(state);
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check WebGPU support and auto-initialize when offline
  useEffect(() => {
    const checkSupportAndAutoInit = async () => {
      try {
        if ('gpu' in navigator) {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            setState(prev => ({ ...prev, isSupported: true }));
            
            // Auto-initialize if offline
            if (!navigator.onLine && !autoInitAttempted.current) {
              autoInitAttempted.current = true;
              console.log('[Offline AI] Network offline, auto-initializing model...');
              // Delay to allow component to mount fully
              setTimeout(() => {
                initializeModelInternal();
              }, 1000);
            }
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
    
    checkSupportAndAutoInit();

    // Listen for offline events to auto-initialize
    const handleOffline = () => {
      if (!autoInitAttempted.current) {
        autoInitAttempted.current = true;
        console.log('[Offline AI] Went offline, auto-initializing model...');
        initializeModelInternal();
      }
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  // Internal initialize function that doesn't depend on state
  const initializeModelInternal = async (): Promise<boolean> => {
    // Get current state from ref
    const currentState = stateRef.current;
    
    // If in fallback mode, no need to load model
    if (currentState.fallbackMode) {
      console.log('[Offline AI] Already in fallback mode, ready to respond');
      return true;
    }

    // Return existing promise if already initializing
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Already loaded
    if (currentState.isModelLoaded && engineRef.current) {
      return true;
    }

    if (!currentState.isSupported) {
      // Switch to fallback mode
      console.log('[Offline AI] WebGPU not supported, enabling fallback mode');
      setState(prev => ({ ...prev, fallbackMode: true, isModelLoaded: true }));
      return true;
    }

    initPromiseRef.current = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null, loadStage: 'Starting model download...' }));

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
        const modelsToTry = [MODEL_ID, FALLBACK_MODEL, TERTIARY_MODEL];
        
        for (const model of modelsToTry) {
          try {
            console.log('[Offline AI] Attempting to load:', model);
            setState(prev => ({ ...prev, loadStage: `Loading ${model}...` }));
            
            // Set timeout for model loading (90 seconds)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Model loading timeout')), 90000)
            );
            
            const loadPromise = webllm.CreateMLCEngine(model, {
              initProgressCallback: progressCallback,
            });
            
            engineRef.current = await Promise.race([loadPromise, timeoutPromise]);
            
            setState(prev => ({
              ...prev,
              isModelLoaded: true,
              isLoading: false,
              loadProgress: 100,
              loadStage: `${model} ready!`,
              fallbackMode: false,
            }));

            console.log('[Offline AI] Model loaded:', model);
            return true;
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
  };

  // Initialize the model (exposed callback)
  const initializeModel = useCallback(async (): Promise<boolean> => {
    return initializeModelInternal();
  }, [state.isSupported, state.isModelLoaded, state.fallbackMode]);

  // Enhanced fallback response generator with pattern matching
  const generateFallbackResponse = (messages: WebLLMMessage[]): string => {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Greeting patterns
    if (lastMessage.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i)) {
      return FALLBACK_RESPONSES.greeting[Math.floor(Math.random() * FALLBACK_RESPONSES.greeting.length)];
    }
    
    // Help patterns
    if (lastMessage.match(/\b(help|assist|support|what can you do|capabilities)\b/i)) {
      return FALLBACK_RESPONSES.help[0];
    }
    
    // Code patterns
    if (lastMessage.match(/\b(code|programming|function|debug|error|javascript|python|react|typescript)\b/i)) {
      return FALLBACK_RESPONSES.code[0];
    }
    
    // Weather patterns
    if (lastMessage.match(/\b(weather|temperature|rain|sunny|forecast)\b/i)) {
      return FALLBACK_RESPONSES.weather[0];
    }
    
    // Search patterns
    if (lastMessage.match(/\b(search|google|find|look up|lookup|internet)\b/i)) {
      return FALLBACK_RESPONSES.search[0];
    }
    
    // Time/date patterns
    if (lastMessage.match(/\b(what time|current time|tell me the time)\b/i)) {
      return `The current time is: ${new Date().toLocaleTimeString()}`;
    }
    if (lastMessage.match(/\b(what date|today's date|what day)\b/i)) {
      return `Today is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    }
    
    // Math patterns (simple)
    const mathMatch = lastMessage.match(/(\d+)\s*([+\-*/×÷])\s*(\d+)/);
    if (mathMatch) {
      const [, a, op, b] = mathMatch;
      const num1 = parseFloat(a);
      const num2 = parseFloat(b);
      let result: number;
      switch (op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*':
        case '×': result = num1 * num2; break;
        case '/':
        case '÷': result = num2 !== 0 ? num1 / num2 : NaN; break;
        default: result = NaN;
      }
      if (!isNaN(result)) {
        return `${num1} ${op} ${num2} = **${result}**`;
      }
    }
    
    // Thank you patterns
    if (lastMessage.match(/\b(thank|thanks|thx|appreciate)\b/i)) {
      return "You're welcome! Let me know if there's anything else I can help with. 😊";
    }
    
    // Bye patterns
    if (lastMessage.match(/\b(bye|goodbye|see you|farewell)\b/i)) {
      return "Goodbye! Feel free to come back anytime. Take care! 👋";
    }
    
    // Default response
    return FALLBACK_RESPONSES.default[Math.floor(Math.random() * FALLBACK_RESPONSES.default.length)];
  };

  // Generate response - use ref to always get latest state
  const generateResponse = useCallback(async (
    messages: WebLLMMessage[],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    const currentState = stateRef.current;
    console.log('[Offline AI] generateResponse called, fallbackMode:', currentState.fallbackMode, 'isModelLoaded:', currentState.isModelLoaded);
    
    // If in fallback mode, use simple responses immediately
    if (currentState.fallbackMode || !currentState.isSupported) {
      console.log('[Offline AI] Using fallback response');
      const response = generateFallbackResponse(messages);
      if (onChunk) {
        // Simulate streaming for natural feel
        const words = response.split(' ');
        for (const word of words) {
          onChunk(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      return response;
    }

    // Try to initialize model if not loaded
    if (!engineRef.current) {
      const loaded = await initializeModel();
      const stateAfterInit = stateRef.current;
      
      if (!loaded || stateAfterInit.fallbackMode) {
        console.log('[Offline AI] Model failed to load, using fallback');
        const response = generateFallbackResponse(messages);
        if (onChunk) {
          const words = response.split(' ');
          for (const word of words) {
            onChunk(word + ' ');
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }
        return response;
      }
    }

    try {
      const formattedMessages = [
        {
          role: 'system' as const,
          content: 'You are ShadowTalk AI, a helpful assistant running offline on the user\'s device. Be concise and helpful. You have limited knowledge as you are running locally.',
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
      setState(prev => ({ ...prev, fallbackMode: true, isModelLoaded: true }));
      const response = generateFallbackResponse(messages);
      if (onChunk) {
        const words = response.split(' ');
        for (const word of words) {
          onChunk(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      return response;
    }
  }, [initializeModel]);

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
