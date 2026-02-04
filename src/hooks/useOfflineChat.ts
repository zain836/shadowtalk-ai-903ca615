import { useState, useCallback, useRef, useEffect } from 'react';
import { useSovereignAI } from './useSovereignAI';
import { useOfflineRAG } from './useOfflineRAG';
import { useOfflineTranslation } from './useOfflineTranslation';
import { useOfflineMath } from './useOfflineMath';
import { useOfflineCodeExecution } from './useOfflineCodeExecution';
import { useHardwareCapabilities } from './useHardwareCapabilities';

// =============================================================================
// OFFLINE CHAT ORCHESTRATOR
// =============================================================================
// Combines Sovereign AI (Llama 3) with RAG, Translation, Math, and Code execution
// Provides zero-latency, high-performance local reasoning
// =============================================================================

interface OfflineChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OfflineChatState {
  isReady: boolean;
  isInitializing: boolean;
  isGenerating: boolean;
  activeModel: string | null;
  modelTier: 'standard' | 'elite' | 'enterprise';
  capabilities: string[];
  error: string | null;
  batteryLevel: number | null;
  isPluggedIn: boolean;
  memoryUsage: number;
}

// Detect language patterns for multilingual support
const LANGUAGE_PATTERNS = {
  urdu: /[\u0600-\u06FF\u0750-\u077F]/,
  arabic: /[\u0600-\u06FF]/,
  hindi: /[\u0900-\u097F]/,
  chinese: /[\u4E00-\u9FFF]/,
  japanese: /[\u3040-\u30FF\u31F0-\u31FF]/,
  korean: /[\uAC00-\uD7AF\u1100-\u11FF]/,
  // Roman Urdu patterns (common transliterations)
  romanUrdu: /\b(kya|kaise|kyun|aap|mujhe|hai|hain|nahi|zaroor|acha|theek|shukriya|khuda|allah|inshallah|mashallah)\b/i,
};

// Code detection patterns
const CODE_PATTERNS = {
  python: /\b(python|def |import |print\(|class |for .* in|if __name__|lambda|numpy|pandas)\b/i,
  javascript: /\b(javascript|const |let |var |function|=>\s*{|require\(|import .* from|async |await )\b/i,
  code: /\b(code|script|program|debug|error|compile|execute|syntax|function|algorithm|loop|array)\b/i,
  math: /\b(calculate|solve|equation|integral|derivative|matrix|vector|sum|product|probability|statistics)\b/i,
};

export const useOfflineChat = () => {
  const sovereignAI = useSovereignAI();
  const rag = useOfflineRAG();
  const translation = useOfflineTranslation();
  const math = useOfflineMath();
  const codeExec = useOfflineCodeExecution();
  const hardware = useHardwareCapabilities();

  const [state, setState] = useState<OfflineChatState>({
    isReady: false,
    isInitializing: false,
    isGenerating: false,
    activeModel: null,
    modelTier: 'standard',
    capabilities: [],
    error: null,
    batteryLevel: null,
    isPluggedIn: true,
    memoryUsage: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const batteryRef = useRef<any>(null);

  // Monitor battery status for resource awareness
  useEffect(() => {
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          batteryRef.current = battery;
          
          const updateBattery = () => {
            setState(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
              isPluggedIn: battery.charging,
            }));
          };
          
          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
          
          return () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        } catch (e) {
          console.warn('[OfflineChat] Battery API not available');
        }
      }
    };
    
    monitorBattery();
  }, []);

  // Sync state with Sovereign AI
  useEffect(() => {
    const tier = sovereignAI.activeModel?.tier || 'standard';
    const capabilities: string[] = ['chat', 'reasoning'];
    
    if (tier === 'elite' || tier === 'enterprise') {
      capabilities.push('code', 'math', 'creative', 'multilingual');
    }
    if (rag.documentCount > 0) {
      capabilities.push('rag', 'documents');
    }
    
    setState(prev => ({
      ...prev,
      isReady: sovereignAI.isReady,
      isInitializing: sovereignAI.isLoading,
      activeModel: sovereignAI.activeModel?.name || null,
      modelTier: tier,
      capabilities,
      error: sovereignAI.error,
    }));
  }, [sovereignAI.isReady, sovereignAI.isLoading, sovereignAI.activeModel, sovereignAI.error, rag.documentCount]);

  // Initialize offline chat with better error handling
  const initialize = useCallback(async (): Promise<boolean> => {
    console.log('[OfflineChat] Initialize called');
    
    if (sovereignAI.isReady) {
      console.log('[OfflineChat] Already ready with:', sovereignAI.activeModel?.name);
      return true;
    }
    
    if (state.isInitializing) {
      console.log('[OfflineChat] Already initializing...');
      return false;
    }
    
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      console.log('[OfflineChat] Starting Sovereign AI initialization...');
      const success = await sovereignAI.initializeSovereignEngine();
      
      if (success) {
        setState(prev => ({ ...prev, isInitializing: false, isReady: true }));
        console.log('[OfflineChat] ✅ Ready with:', sovereignAI.activeModel?.name);
      } else {
        const errorMsg = sovereignAI.error || 'Failed to initialize offline AI';
        console.error('[OfflineChat] ❌ Failed:', errorMsg);
        setState(prev => ({ 
          ...prev, 
          isInitializing: false, 
          error: errorMsg
        }));
      }
      
      return success;
    } catch (e: any) {
      console.error('[OfflineChat] Exception:', e);
      setState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: e.message 
      }));
      return false;
    }
  }, [sovereignAI, state.isInitializing]);

  // Detect message intent for routing
  const detectIntent = useCallback((message: string): {
    type: 'general' | 'code' | 'math' | 'translate' | 'document';
    language?: string;
    codeLanguage?: string;
  } => {
    const lowerMessage = message.toLowerCase();
    
    // Check for code requests
    if (CODE_PATTERNS.code.test(lowerMessage) || 
        CODE_PATTERNS.python.test(lowerMessage) || 
        CODE_PATTERNS.javascript.test(lowerMessage)) {
      const codeLanguage = CODE_PATTERNS.python.test(lowerMessage) ? 'python' : 
                          CODE_PATTERNS.javascript.test(lowerMessage) ? 'javascript' : 
                          'general';
      return { type: 'code', codeLanguage };
    }
    
    // Check for math
    if (CODE_PATTERNS.math.test(lowerMessage)) {
      return { type: 'math' };
    }
    
    // Check for translation needs
    for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (pattern.test(message)) {
        return { type: 'translate', language: lang };
      }
    }
    
    // Check for document-related queries when RAG is available
    if (rag.documentCount > 0 && 
        /\b(document|file|pdf|contract|report|according to|in the|based on|summary|analyze)\b/i.test(lowerMessage)) {
      return { type: 'document' };
    }
    
    return { type: 'general' };
  }, [rag.documentCount]);

  // Build enhanced prompt based on intent
  const buildEnhancedPrompt = useCallback(async (
    message: string, 
    intent: ReturnType<typeof detectIntent>
  ): Promise<string> => {
    let enhancedPrompt = message;
    
    switch (intent.type) {
      case 'code':
        enhancedPrompt = `[CODE REQUEST - ${intent.codeLanguage?.toUpperCase() || 'GENERAL'}]\n${message}\n\nProvide working code with clear explanations. Include comments and handle edge cases.`;
        break;
        
      case 'math':
        enhancedPrompt = `[MATHEMATICAL ANALYSIS]\n${message}\n\nShow step-by-step solution with explanations. Use proper mathematical notation where appropriate.`;
        break;
        
      case 'translate':
        if (intent.language === 'urdu' || intent.language === 'romanUrdu') {
          enhancedPrompt = `[MULTILINGUAL - URDU/ROMAN URDU]\n${message}\n\nRespond naturally in the same language/script the user is using. If they use Roman Urdu, respond in Roman Urdu.`;
        } else {
          enhancedPrompt = `[MULTILINGUAL - ${intent.language?.toUpperCase()}]\n${message}\n\nRespond in the user's language.`;
        }
        break;
        
      case 'document':
        // Query RAG for relevant context
        try {
          const ragResults = await rag.search(message, 3, 0.4);
          if (ragResults.length > 0) {
            const citations = ragResults.map((r, i) => 
              `[Citation ${i + 1}]: ${r.text.slice(0, 500)}...`
            ).join('\n\n');
            enhancedPrompt = `[DOCUMENT ANALYSIS WITH CITATIONS]\nUser Question: ${message}\n\nRelevant Document Context:\n${citations}\n\nProvide a detailed answer citing specific sections from the documents. Use [Citation X] references.`;
          }
        } catch (e) {
          console.warn('[OfflineChat] RAG search failed:', e);
        }
        break;
        
      default:
        // General reasoning - no modification needed
        break;
    }
    
    return enhancedPrompt;
  }, [rag]);

  // Generate response with full offline capabilities
  const generateResponse = useCallback(async (
    messages: OfflineChatMessage[],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    console.log('[OfflineChat] generateResponse called, isReady:', sovereignAI.isReady);
    
    // Initialize if not ready
    if (!sovereignAI.isReady) {
      console.log('[OfflineChat] Engine not ready, initializing...');
      
      // Stream initialization status to user
      if (onChunk) {
        onChunk('🔄 Initializing local AI engine... ');
      }
      
      const initialized = await initialize();
      
      if (!initialized) {
        const errorMsg = `\n\n⚠️ **Offline AI Initialization Failed**\n\nCouldn't start the local AI model. This could be due to:\n• **Insufficient memory** - Close other tabs/apps and try again\n• **Browser compatibility** - Try Chrome, Edge, or Brave\n• **Model not downloaded** - Enable "Bunker Mode" to download offline models\n\nIn the meantime, please connect to the internet for cloud AI.`;
        if (onChunk) onChunk(errorMsg);
        return errorMsg;
      }
      
      if (onChunk) {
        onChunk('Ready!\n\n');
      }
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    abortRef.current = new AbortController();

    try {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      const intent = detectIntent(lastUserMessage);
      
      console.log('[OfflineChat] Generating response, intent:', intent.type, 'model:', sovereignAI.activeModel?.name);
      
      // Build enhanced prompt based on intent
      const enhancedMessage = await buildEnhancedPrompt(lastUserMessage, intent);
      
      // Replace last user message with enhanced version
      const enhancedMessages = [...messages];
      const lastIdx = enhancedMessages.length - 1;
      if (enhancedMessages[lastIdx]?.role === 'user') {
        enhancedMessages[lastIdx] = { 
          ...enhancedMessages[lastIdx], 
          content: enhancedMessage 
        };
      }

      // Generate with Sovereign AI
      const response = await sovereignAI.generateResponse(enhancedMessages, {
        onChunk,
        useRAG: intent.type === 'document',
        useBusinessContext: true,
        maxTokens: intent.type === 'code' ? 2048 : 1024,
        temperature: 0.7,
      });

      console.log('[OfflineChat] Response generated, length:', response.length);
      setState(prev => ({ ...prev, isGenerating: false }));
      return response;
    } catch (e: any) {
      console.error('[OfflineChat] Generation error:', e);
      setState(prev => ({ ...prev, isGenerating: false, error: e.message }));
      
      const errorMsg = `\n\n⚠️ **Generation Error**\n\n${e.message}\n\nPlease try again or refresh the page.`;
      if (onChunk) onChunk(errorMsg);
      return errorMsg;
    }
  }, [sovereignAI, initialize, detectIntent, buildEnhancedPrompt]);

  // Cancel ongoing generation
  const cancelGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(prev => ({ ...prev, isGenerating: false }));
  }, []);

  // Add document to RAG for analysis
  const addDocument = useCallback(async (
    text: string, 
    metadata?: { title?: string; source?: string }
  ): Promise<boolean> => {
    try {
      await rag.loadModel();
      await rag.addDocument(text, undefined, metadata);
      return true;
    } catch (e) {
      console.error('[OfflineChat] Failed to add document:', e);
      return false;
    }
  }, [rag]);

  // Get battery warning if needed
  const getBatteryWarning = useCallback((): string | null => {
    if (state.batteryLevel !== null && state.batteryLevel < 15 && !state.isPluggedIn) {
      return `⚡ Battery at ${state.batteryLevel}%. Consider plugging in for best performance.`;
    }
    if (state.batteryLevel !== null && state.batteryLevel < 30 && !state.isPluggedIn && state.modelTier !== 'standard') {
      return `⚡ Battery at ${state.batteryLevel}%. Using power-efficient mode.`;
    }
    return null;
  }, [state.batteryLevel, state.isPluggedIn, state.modelTier]);

  // Switch to power-saving model
  const enablePowerSaving = useCallback(async () => {
    const smallModel = sovereignAI.availableModels.find(m => m.size === '1B');
    if (smallModel && sovereignAI.activeModel?.id !== smallModel.id) {
      await sovereignAI.switchModel(smallModel.id);
    }
  }, [sovereignAI]);

  return {
    ...state,
    loadProgress: sovereignAI.loadProgress,
    loadStage: sovereignAI.loadStage,
    
    // Core functions
    initialize,
    generateResponse,
    cancelGeneration,
    
    // Document intelligence
    addDocument,
    documentCount: rag.documentCount,
    
    // Resource management
    getBatteryWarning,
    enablePowerSaving,
    unload: sovereignAI.unloadModel,
    
    // Model info
    availableModels: sovereignAI.availableModels,
    switchModel: sovereignAI.switchModel,
    hardwareCapabilities: hardware.capabilities,
  };
};
