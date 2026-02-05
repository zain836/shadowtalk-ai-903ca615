 import { useState, useEffect, useCallback, useRef } from 'react';
 
 // =============================================================================
 // AUTO OFFLINE AI - Silent Background Model Manager
 // =============================================================================
 // Silently downloads a small LLM when online and auto-activates when offline
 // No user interaction required - completely invisible to the user
 // =============================================================================
 
 interface AutoOfflineState {
   isModelReady: boolean;
   isDownloading: boolean;
   isLoadingEngine: boolean;
   downloadProgress: number;
   activeModelName: string | null;
   error: string | null;
 }
 
 // Use the smallest, fastest-loading model for seamless offline experience
 const AUTO_OFFLINE_MODEL = 'SmolLM2-135M-Instruct-q4f16_1-MLC';
 const AUTO_OFFLINE_MODEL_NAME = 'SmolLM2 Nano';
 
 // Storage key to track if model is downloaded
 const STORAGE_KEY = 'shadowtalk_auto_offline_ready';
 
 export const useAutoOfflineAI = () => {
   const [state, setState] = useState<AutoOfflineState>({
     isModelReady: false,
     isDownloading: false,
     isLoadingEngine: false,
     downloadProgress: 0,
     activeModelName: null,
     error: null,
   });
 
   const engineRef = useRef<any>(null);
   const isInitializedRef = useRef(false);
   const downloadAttemptedRef = useRef(false);
 
   // Check if model is already cached
   const checkModelCache = useCallback(async (): Promise<boolean> => {
     try {
       const webllm = await import('@mlc-ai/web-llm');
       const inCache = await webllm.hasModelInCache(AUTO_OFFLINE_MODEL);
       
       if (inCache) {
         console.log('[AutoOfflineAI] ✓ Model already cached');
         localStorage.setItem(STORAGE_KEY, 'true');
         setState(prev => ({ ...prev, isModelReady: true }));
         return true;
       }
       return false;
     } catch (e) {
       console.warn('[AutoOfflineAI] Cache check failed:', e);
       return false;
     }
   }, []);
 
   // Silently download model in background (only when online & idle)
   const silentDownload = useCallback(async () => {
     if (downloadAttemptedRef.current || !navigator.onLine) return;
     downloadAttemptedRef.current = true;
 
     // Check if already cached first
     const cached = await checkModelCache();
     if (cached) return;
 
     console.log('[AutoOfflineAI] Starting silent background download...');
     setState(prev => ({ ...prev, isDownloading: true, downloadProgress: 0 }));
 
     try {
       const webllm = await import('@mlc-ai/web-llm');
       
       // Create engine to trigger download (will be cached automatically)
       const engine = await webllm.CreateMLCEngine(AUTO_OFFLINE_MODEL, {
         initProgressCallback: (progress: any) => {
           const percent = Math.round((progress.progress || 0) * 100);
           setState(prev => ({ ...prev, downloadProgress: percent }));
         },
       });
       
       // Unload after download - we just wanted to cache it
       await engine.unload();
       
       localStorage.setItem(STORAGE_KEY, 'true');
       setState(prev => ({ 
         ...prev, 
         isDownloading: false, 
         isModelReady: true,
         downloadProgress: 100 
       }));
       
       console.log('[AutoOfflineAI] ✅ Model downloaded and cached');
     } catch (e: any) {
       console.warn('[AutoOfflineAI] Silent download failed:', e.message);
       setState(prev => ({ 
         ...prev, 
         isDownloading: false, 
         error: e.message 
       }));
       // Don't retry immediately - will try on next page load
     }
   }, [checkModelCache]);
 
   // Load engine for inference (called when going offline)
   const loadEngine = useCallback(async (): Promise<boolean> => {
     if (engineRef.current) {
       console.log('[AutoOfflineAI] Engine already loaded');
       return true;
     }
 
     // Check if model is cached
     const cached = await checkModelCache();
     if (!cached) {
       console.warn('[AutoOfflineAI] No cached model available');
       setState(prev => ({ 
         ...prev, 
         error: 'No offline model available. Connect to internet to download.' 
       }));
       return false;
     }
 
     console.log('[AutoOfflineAI] Loading engine from cache...');
     setState(prev => ({ ...prev, isLoadingEngine: true, error: null }));
 
     try {
       const webllm = await import('@mlc-ai/web-llm');
       
       engineRef.current = await webllm.CreateMLCEngine(AUTO_OFFLINE_MODEL, {
         initProgressCallback: (progress: any) => {
           const percent = Math.round((progress.progress || 0) * 100);
           setState(prev => ({ ...prev, downloadProgress: percent }));
         },
       });
 
       setState(prev => ({ 
         ...prev, 
         isLoadingEngine: false, 
         isModelReady: true,
         activeModelName: AUTO_OFFLINE_MODEL_NAME 
       }));
       
       console.log('[AutoOfflineAI] ✅ Engine loaded and ready');
       return true;
     } catch (e: any) {
       console.error('[AutoOfflineAI] Failed to load engine:', e);
       setState(prev => ({ 
         ...prev, 
         isLoadingEngine: false, 
         error: e.message 
       }));
       return false;
     }
   }, [checkModelCache]);
 
   // Generate response using local model
   const generateResponse = useCallback(async (
     messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
     onChunk?: (chunk: string) => void
   ): Promise<string> => {
     // Ensure engine is loaded
     if (!engineRef.current) {
       const loaded = await loadEngine();
       if (!loaded) {
         return '⚠️ Offline AI is not available. Please connect to the internet.';
       }
     }
 
     try {
       const systemPrompt = `You are ShadowTalk AI running in offline mode. Provide helpful, accurate responses. Be concise but comprehensive.`;
       
       const fullMessages = [
         { role: 'system' as const, content: systemPrompt },
         ...messages
       ];
 
       let fullResponse = '';
       
       const response = await engineRef.current.chat.completions.create({
         messages: fullMessages,
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
 
       return fullResponse;
     } catch (e: any) {
       console.error('[AutoOfflineAI] Generation error:', e);
       return `⚠️ Error generating response: ${e.message}`;
     }
   }, [loadEngine]);
 
   // Unload engine to free memory
   const unloadEngine = useCallback(async () => {
     if (engineRef.current) {
       try {
         await engineRef.current.unload();
         engineRef.current = null;
         setState(prev => ({ ...prev, activeModelName: null }));
         console.log('[AutoOfflineAI] Engine unloaded');
       } catch (e) {
         console.warn('[AutoOfflineAI] Error unloading:', e);
       }
     }
   }, []);
 
   // Initialize on mount
   useEffect(() => {
     if (isInitializedRef.current) return;
     isInitializedRef.current = true;
 
     // Check existing cache status
     const wasReady = localStorage.getItem(STORAGE_KEY) === 'true';
     if (wasReady) {
       checkModelCache();
     }
 
     // If online and model not ready, schedule silent download
     // Use requestIdleCallback if available, otherwise setTimeout
     if (navigator.onLine && !wasReady) {
       const scheduleDownload = () => {
         if ('requestIdleCallback' in window) {
           (window as any).requestIdleCallback(() => silentDownload(), { timeout: 30000 });
         } else {
           // Delay download to not interfere with initial page load
           setTimeout(silentDownload, 10000);
         }
       };
       
       // Wait for page to be fully loaded
       if (document.readyState === 'complete') {
         scheduleDownload();
       } else {
         window.addEventListener('load', scheduleDownload, { once: true });
       }
     }
   }, [checkModelCache, silentDownload]);
 
   // Auto-load engine when going offline
   useEffect(() => {
     const handleOffline = async () => {
       console.log('[AutoOfflineAI] Network offline - loading local AI...');
       await loadEngine();
     };
 
     const handleOnline = () => {
       console.log('[AutoOfflineAI] Network online - keeping engine loaded');
       // Optionally unload to save memory:
       // unloadEngine();
     };
 
     window.addEventListener('offline', handleOffline);
     window.addEventListener('online', handleOnline);
 
     // If currently offline, load immediately
     if (!navigator.onLine && state.isModelReady && !engineRef.current) {
       loadEngine();
     }
 
     return () => {
       window.removeEventListener('offline', handleOffline);
       window.removeEventListener('online', handleOnline);
     };
   }, [loadEngine, unloadEngine, state.isModelReady]);
 
   return {
     ...state,
     isEngineLoaded: !!engineRef.current,
     generateResponse,
     loadEngine,
     unloadEngine,
     checkModelCache,
   };
 };