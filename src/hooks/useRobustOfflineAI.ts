 import { useState, useEffect, useCallback, useRef } from 'react';
 
 // =============================================================================
 // ROBUST OFFLINE AI - 100% Reliable Local LLM
 // =============================================================================
 // Based on latest WebLLM best practices (2025)
 // Features:
 // - Automatic smallest-model-first fallback
 // - Pre-flight caching checks
 // - Graceful degradation to simpler responses
 // - Persistent IndexedDB model storage
 // - Auto-recovery from failures
 // =============================================================================
 
 interface OfflineAIState {
   isReady: boolean;
   isLoading: boolean;
   loadProgress: number;
   loadStage: string;
   activeModel: string | null;
   error: string | null;
   hasWebGPU: boolean;
   hasCachedModel: boolean;
 }
 
 // Model catalog - smallest first for fastest loading and reliability
 const OFFLINE_MODELS = [
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen2.5 Mini', size: '0.5B', bytes: 350_000_000 },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen2.5 1.5B', size: '1.5B', bytes: 900_000_000 },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', size: '1B', bytes: 700_000_000 },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B', size: '3B', bytes: 1_800_000_000 },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '3.8B', bytes: 2_200_000_000 },
 ];
 
 const STORAGE_KEY = 'shadowtalk_robust_offline_model';

// Clear invalid cached model on startup
const clearInvalidCache = () => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const isValid = OFFLINE_MODELS.some(m => m.id === cached);
    if (!isValid) {
      console.log('[RobustOfflineAI] Clearing invalid cached model:', cached);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

// Run on module load
clearInvalidCache();
 
 // Simple fallback responses when AI is unavailable
 const FALLBACK_RESPONSES: Record<string, string> = {
   greeting: "👋 Hi! I'm in basic offline mode. How can I help?",
   help: "I'm running in limited offline mode. I can help with:\n• Basic questions\n• Simple calculations\n• Time and date\n\nFor full AI capabilities, please ensure you have a model downloaded or connect to the internet.",
   math: "I can do basic math! Try: 2+2, 10*5, 100/4",
   default: "I'm currently in basic offline mode with limited capabilities. For full AI responses, please download an offline model or connect to the internet.",
 };
 
 export const useRobustOfflineAI = () => {
   const [state, setState] = useState<OfflineAIState>({
     isReady: false,
     isLoading: false,
     loadProgress: 0,
     loadStage: '',
     activeModel: null,
     error: null,
     hasWebGPU: false,
     hasCachedModel: false,
   });
 
   const engineRef = useRef<any>(null);
   const loadingRef = useRef<Promise<boolean> | null>(null);
   const mountedRef = useRef(true);
 
   // Check WebGPU availability
   useEffect(() => {
     const checkWebGPU = async () => {
       if ('gpu' in navigator) {
         try {
           const adapter = await (navigator as any).gpu?.requestAdapter();
           if (adapter && mountedRef.current) {
             setState(prev => ({ ...prev, hasWebGPU: true }));
             console.log('[RobustOfflineAI] ✓ WebGPU available');
           }
         } catch {
           console.log('[RobustOfflineAI] WebGPU check failed, will use CPU');
         }
       }
     };
 
     checkWebGPU();
     return () => { mountedRef.current = false; };
   }, []);
 
   // Check for cached models on mount
   useEffect(() => {
     const checkCachedModels = async () => {
       try {
         const webllm = await import('@mlc-ai/web-llm');
         
         for (const model of OFFLINE_MODELS) {
          try {
            const inCache = await webllm.hasModelInCache(model.id);
            if (inCache) {
              console.log('[RobustOfflineAI] ✓ Found cached model:', model.name);
              localStorage.setItem(STORAGE_KEY, model.id);
              if (mountedRef.current) {
                setState(prev => ({ ...prev, hasCachedModel: true }));
              }
              return;
             }
          } catch (e) {
            // Model might not exist in config, skip it
            console.warn(`[RobustOfflineAI] Skipping ${model.id}:`, e);
           }
         }
         console.log('[RobustOfflineAI] No cached models found');
       } catch (e) {
         console.warn('[RobustOfflineAI] Cache check failed:', e);
       }
     };
 
     checkCachedModels();
   }, []);
 
   // Load the best available model
   const loadModel = useCallback(async (preferredModelId?: string): Promise<boolean> => {
     // Return existing promise if loading
     if (loadingRef.current) {
       return loadingRef.current;
     }
 
     // Already ready
     if (engineRef.current && state.isReady) {
       return true;
     }
 
     loadingRef.current = (async () => {
       setState(prev => ({ 
         ...prev, 
         isLoading: true, 
         error: null, 
         loadStage: 'Preparing offline AI...' 
       }));
 
       try {
         const webllm = await import('@mlc-ai/web-llm');
         console.log('[RobustOfflineAI] WebLLM imported');
 
         // Build model queue - cached models first, then by size
         const modelQueue: typeof OFFLINE_MODELS[0][] = [];
         const cachedModels: typeof OFFLINE_MODELS[0][] = [];
 
         // Check cache status for all models
         for (const model of OFFLINE_MODELS) {
           try {
             const inCache = await webllm.hasModelInCache(model.id);
             if (inCache) {
               cachedModels.push(model);
             }
           } catch {
             // Ignore cache check errors
           }
         }
 
         // If preferred model specified, put it first
         if (preferredModelId) {
           const preferred = OFFLINE_MODELS.find(m => m.id === preferredModelId);
           if (preferred) modelQueue.push(preferred);
         }
 
         // Add cached models
         for (const model of cachedModels) {
           if (!modelQueue.find(m => m.id === model.id)) {
             modelQueue.push(model);
           }
         }
 
         // Add remaining models by size
         for (const model of OFFLINE_MODELS) {
           if (!modelQueue.find(m => m.id === model.id)) {
             modelQueue.push(model);
           }
         }
 
         console.log('[RobustOfflineAI] Model queue:', modelQueue.map(m => m.name).join(' → '));
 
         // Try each model
         for (const model of modelQueue) {
           const isCached = cachedModels.includes(model);
           
           if (mountedRef.current) {
             setState(prev => ({
               ...prev,
               loadStage: isCached 
                 ? `Loading ${model.name} from cache...` 
                 : `Downloading ${model.name} (${model.size})...`,
               loadProgress: 0,
             }));
           }
 
           try {
             console.log(`[RobustOfflineAI] Attempting: ${model.name}${isCached ? ' (cached)' : ''}`);
 
             // Unload previous engine
             if (engineRef.current) {
               try { await engineRef.current.unload(); } catch {}
               engineRef.current = null;
             }
 
             // Create engine with progress tracking
             const engine = await Promise.race([
               webllm.CreateMLCEngine(model.id, {
                 initProgressCallback: (progress: any) => {
                   const percent = Math.round((progress.progress || 0) * 100);
                   if (mountedRef.current) {
                     setState(prev => ({
                       ...prev,
                       loadProgress: percent,
                       loadStage: isCached
                         ? `Loading ${model.name}... ${percent}%`
                         : `Downloading ${model.name}... ${percent}%`,
                     }));
                   }
                 },
               }),
               new Promise<never>((_, reject) => 
                 setTimeout(() => reject(new Error('Timeout')), isCached ? 60000 : 180000)
               ),
             ]);
 
             engineRef.current = engine;
             localStorage.setItem(STORAGE_KEY, model.id);
 
             if (mountedRef.current) {
               setState(prev => ({
                 ...prev,
                 isReady: true,
                 isLoading: false,
                 loadProgress: 100,
                 loadStage: `${model.name} ready`,
                 activeModel: model.name,
                 hasCachedModel: true,
                 error: null,
               }));
             }
 
             console.log(`[RobustOfflineAI] ✅ ${model.name} loaded successfully`);
             loadingRef.current = null;
             return true;
 
           } catch (e: any) {
             console.warn(`[RobustOfflineAI] ${model.name} failed:`, e.message);
             
             // Update status for next attempt
             const nextModel = modelQueue[modelQueue.indexOf(model) + 1];
             if (nextModel && mountedRef.current) {
               setState(prev => ({
                 ...prev,
                 loadStage: `Trying ${nextModel.name}...`,
               }));
             }
           }
         }
 
         // All models failed
         const errorMsg = cachedModels.length > 0 
           ? 'Failed to load cached models. Try refreshing the page.'
           : 'No offline models available. Download one while online.';
 
         if (mountedRef.current) {
           setState(prev => ({
             ...prev,
             isLoading: false,
             error: errorMsg,
             loadStage: 'Failed',
           }));
         }
 
         loadingRef.current = null;
         return false;
 
       } catch (e: any) {
         console.error('[RobustOfflineAI] Critical error:', e);
         
         if (mountedRef.current) {
           setState(prev => ({
             ...prev,
             isLoading: false,
             error: e.message,
             loadStage: 'Error',
           }));
         }
 
         loadingRef.current = null;
         return false;
       }
     })();
 
     return loadingRef.current;
   }, [state.isReady]);
 
   // Download a specific model for offline use
   const downloadModel = useCallback(async (modelId: string): Promise<boolean> => {
     const model = OFFLINE_MODELS.find(m => m.id === modelId);
     if (!model) return false;
 
     setState(prev => ({
       ...prev,
       isLoading: true,
       loadStage: `Downloading ${model.name}...`,
       loadProgress: 0,
     }));
 
     try {
       const webllm = await import('@mlc-ai/web-llm');
       
       // Create engine to trigger download
       const engine = await webllm.CreateMLCEngine(modelId, {
         initProgressCallback: (progress: any) => {
           const percent = Math.round((progress.progress || 0) * 100);
           if (mountedRef.current) {
             setState(prev => ({
               ...prev,
               loadProgress: percent,
               loadStage: `Downloading ${model.name}... ${percent}%`,
             }));
           }
         },
       });
 
       // Keep engine loaded
       engineRef.current = engine;
       localStorage.setItem(STORAGE_KEY, modelId);
 
       if (mountedRef.current) {
         setState(prev => ({
           ...prev,
           isReady: true,
           isLoading: false,
           loadProgress: 100,
           activeModel: model.name,
           hasCachedModel: true,
           loadStage: `${model.name} ready`,
         }));
       }
 
       console.log(`[RobustOfflineAI] ✅ Downloaded ${model.name}`);
       return true;
 
     } catch (e: any) {
       console.error(`[RobustOfflineAI] Download failed:`, e);
       
       if (mountedRef.current) {
         setState(prev => ({
           ...prev,
           isLoading: false,
           error: `Download failed: ${e.message}`,
         }));
       }
 
       return false;
     }
   }, []);
 
   // Generate response - with graceful fallback
   const generateResponse = useCallback(async (
     messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
     onChunk?: (chunk: string) => void
   ): Promise<string> => {
     const userMessage = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
 
     // If no engine, try to load
     if (!engineRef.current) {
       // Show loading indicator
       if (onChunk) {
         onChunk('🔄 Loading offline AI... ');
       }
 
       const loaded = await loadModel();
       
       if (!loaded) {
         // Use basic fallback responses
         const fallback = getBasicFallback(userMessage);
         if (onChunk) onChunk(fallback);
         return fallback;
       }
 
       if (onChunk) onChunk('Ready!\n\n');
     }
 
     try {
       // Build system prompt
       const systemPrompt = `You are ShadowTalk AI running locally on the user's device.
 You have full capabilities: reasoning, code, math, creative writing.
 Respond helpfully and concisely. Use markdown formatting.`;
 
       const formattedMessages = [
         { role: 'system' as const, content: systemPrompt },
         ...messages,
       ];
 
       let fullResponse = '';
 
       // Generate with streaming
       const response = await engineRef.current.chat.completions.create({
         messages: formattedMessages,
         stream: true,
         max_tokens: 1024,
         temperature: 0.7,
       });
 
       for await (const chunk of response) {
         const content = chunk.choices?.[0]?.delta?.content || '';
         if (content) {
           fullResponse += content;
           if (onChunk) onChunk(content);
         }
       }
 
       return fullResponse || 'I generated an empty response. Please try again.';
 
     } catch (e: any) {
       console.error('[RobustOfflineAI] Generation error:', e);
       
       // Try to recover by reloading
       engineRef.current = null;
       setState(prev => ({ ...prev, isReady: false }));
       
       const errorMsg = `\n\n⚠️ Generation error: ${e.message}\n\nPlease try again.`;
       if (onChunk) onChunk(errorMsg);
       return errorMsg;
     }
   }, [loadModel]);
 
   // Basic fallback for when AI isn't available
   const getBasicFallback = (message: string): string => {
     const lowerMsg = message.toLowerCase();
 
     // Greetings
     if (/^(hi|hello|hey|greetings)/i.test(lowerMsg)) {
       return FALLBACK_RESPONSES.greeting;
     }
 
     // Help
     if (/help|what can you do/i.test(lowerMsg)) {
       return FALLBACK_RESPONSES.help;
     }
 
     // Time
     if (/what time|current time/i.test(lowerMsg)) {
       return `🕐 The current time is: **${new Date().toLocaleTimeString()}**`;
     }
 
     // Date
     if (/what date|today|what day/i.test(lowerMsg)) {
       return `📅 Today is: **${new Date().toLocaleDateString('en-US', { 
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
       })}**`;
     }
 
     // Simple math
     const mathMatch = message.match(/(\d+)\s*([+\-*/×÷])\s*(\d+)/);
     if (mathMatch) {
       const [, a, op, b] = mathMatch;
       const n1 = parseFloat(a), n2 = parseFloat(b);
       let result: number;
       switch (op) {
         case '+': result = n1 + n2; break;
         case '-': result = n1 - n2; break;
         case '*': case '×': result = n1 * n2; break;
         case '/': case '÷': result = n2 !== 0 ? n1 / n2 : NaN; break;
         default: result = NaN;
       }
       if (!isNaN(result)) {
         return `🧮 **${n1} ${op} ${n2} = ${result}**`;
       }
     }
 
     // Default
     return FALLBACK_RESPONSES.default;
   };
 
   // Unload model
   const unloadModel = useCallback(async () => {
     if (engineRef.current) {
       try {
         await engineRef.current.unload();
       } catch {}
       engineRef.current = null;
     }
     setState(prev => ({ ...prev, isReady: false, activeModel: null }));
   }, []);
 
   return {
     ...state,
     models: OFFLINE_MODELS,
     loadModel,
     downloadModel,
     generateResponse,
     unloadModel,
     getBasicFallback,
   };
 };