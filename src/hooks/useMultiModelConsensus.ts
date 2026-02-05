 import { useState, useCallback, useRef } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 // =============================================================================
 // MULTI-MODEL CONSENSUS ENGINE - Beat Grok with Superior Reasoning
 // =============================================================================
 // Query multiple AI models simultaneously and synthesize the best answer
 // This is our key differentiator - Grok only uses one model
 // =============================================================================
 
 interface ConsensusModel {
   id: string;
   name: string;
   provider: 'google' | 'openai';
   speed: 'fast' | 'medium' | 'slow';
   quality: 'good' | 'high' | 'highest';
 }
 
 interface ConsensusResponse {
   modelId: string;
   modelName: string;
   response: string;
   latencyMs: number;
   confidence?: number;
 }
 
 interface ConsensusResult {
   synthesizedAnswer: string;
   responses: ConsensusResponse[];
   totalLatencyMs: number;
   strategy: string;
   agreement: number; // 0-100% agreement between models
 }
 
 interface ConsensusState {
   isRunning: boolean;
   currentModel: string | null;
   completedModels: string[];
   progress: number;
   error: string | null;
 }
 
 // Model configurations - optimized for consensus
 const CONSENSUS_MODELS: ConsensusModel[] = [
   { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', speed: 'fast', quality: 'high' },
   { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', speed: 'fast', quality: 'high' },
   { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', speed: 'fast', quality: 'high' },
 ];
 
 // Premium models for synthesis
 const SYNTHESIS_MODEL = 'google/gemini-2.5-pro';
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
 
 export const useMultiModelConsensus = () => {
   const [state, setState] = useState<ConsensusState>({
     isRunning: false,
     currentModel: null,
     completedModels: [],
     progress: 0,
     error: null,
   });
   
   const abortRef = useRef<AbortController | null>(null);
 
   // Query a single model
   const queryModel = useCallback(async (
     model: ConsensusModel,
     prompt: string,
     systemPrompt: string
   ): Promise<ConsensusResponse | null> => {
     const startTime = Date.now();
     
     try {
       const { data: { session } } = await supabase.auth.getSession();
       
       const response = await fetch(CHAT_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({
           messages: [
             { role: 'system', content: systemPrompt },
             { role: 'user', content: prompt },
           ],
           model: model.id,
           stream: false,
         }),
         signal: abortRef.current?.signal,
       });
 
       if (!response.ok) {
         console.warn(`[Consensus] Model ${model.name} failed:`, response.status);
         return null;
       }
 
       // Parse response (non-streaming)
       const reader = response.body?.getReader();
       const decoder = new TextDecoder();
       let fullResponse = '';
 
       if (reader) {
         while (true) {
           const { done, value } = await reader.read();
           if (done) break;
           const chunk = decoder.decode(value, { stream: true });
           
           for (const line of chunk.split('\n')) {
             if (line.startsWith('data: ') && line !== 'data: [DONE]') {
               try {
                 const data = JSON.parse(line.slice(6));
                 const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                 if (content) fullResponse += content;
               } catch {}
             }
           }
         }
       }
 
       return {
         modelId: model.id,
         modelName: model.name,
         response: fullResponse.trim(),
         latencyMs: Date.now() - startTime,
       };
     } catch (e) {
       if ((e as Error).name === 'AbortError') return null;
       console.error(`[Consensus] Error with ${model.name}:`, e);
       return null;
     }
   }, []);
 
   // Calculate agreement between responses
   const calculateAgreement = (responses: ConsensusResponse[]): number => {
     if (responses.length < 2) return 100;
     
     // Simple word overlap calculation
     const wordSets = responses.map(r => 
       new Set(r.response.toLowerCase().split(/\s+/).filter(w => w.length > 3))
     );
     
     let totalOverlap = 0;
     let comparisons = 0;
     
     for (let i = 0; i < wordSets.length; i++) {
       for (let j = i + 1; j < wordSets.length; j++) {
         const intersection = new Set([...wordSets[i]].filter(w => wordSets[j].has(w)));
         const union = new Set([...wordSets[i], ...wordSets[j]]);
         totalOverlap += union.size > 0 ? (intersection.size / union.size) * 100 : 0;
         comparisons++;
       }
     }
     
     return Math.round(totalOverlap / comparisons);
   };
 
   // Run consensus across multiple models
   const runConsensus = useCallback(async (
     prompt: string,
     options?: {
       strategy?: 'parallel' | 'chain' | 'vote';
       modelsCount?: number;
       synthesize?: boolean;
       onProgress?: (modelName: string, index: number, total: number) => void;
     }
   ): Promise<ConsensusResult | null> => {
     const { 
       strategy = 'parallel', 
       modelsCount = 3, 
       synthesize = true,
       onProgress 
     } = options || {};
 
     abortRef.current = new AbortController();
     const startTime = Date.now();
     
     setState({
       isRunning: true,
       currentModel: null,
       completedModels: [],
       progress: 0,
       error: null,
     });
 
     try {
       const models = CONSENSUS_MODELS.slice(0, modelsCount);
       const responses: ConsensusResponse[] = [];
       
       const systemPrompt = `You are an expert AI assistant. Provide a thorough, accurate answer. Focus on being helpful and precise. Format your response with markdown when appropriate.`;
 
       if (strategy === 'parallel') {
         // Query all models simultaneously
         const promises = models.map(async (model, idx) => {
           setState(prev => ({ ...prev, currentModel: model.name }));
           onProgress?.(model.name, idx, models.length);
           
           const result = await queryModel(model, prompt, systemPrompt);
           
           if (result) {
             responses.push(result);
             setState(prev => ({
               ...prev,
               completedModels: [...prev.completedModels, model.name],
               progress: ((responses.length) / models.length) * 100,
             }));
           }
           
           return result;
         });
 
         await Promise.all(promises);
       } else {
         // Sequential chain
         for (let i = 0; i < models.length; i++) {
           const model = models[i];
           setState(prev => ({ ...prev, currentModel: model.name }));
           onProgress?.(model.name, i, models.length);
 
           const chainPrompt = responses.length > 0
             ? `Previous analysis:\n${responses[responses.length - 1].response}\n\nBuild upon this to answer: ${prompt}`
             : prompt;
 
           const result = await queryModel(model, chainPrompt, systemPrompt);
           
           if (result) {
             responses.push(result);
             setState(prev => ({
               ...prev,
               completedModels: [...prev.completedModels, model.name],
               progress: ((i + 1) / models.length) * 100,
             }));
           }
         }
       }
 
       if (responses.length === 0) {
         throw new Error('No models responded successfully');
       }
 
       // Calculate agreement
       const agreement = calculateAgreement(responses);
 
       // Synthesize final answer
       let synthesizedAnswer = '';
       
       if (synthesize && responses.length > 1) {
         const synthesisPrompt = `You received these analyses from different AI models:
 
 ${responses.map((r, i) => `**${r.modelName}** (${r.latencyMs}ms):\n${r.response}`).join('\n\n---\n\n')}
 
 Synthesize these into the best possible answer. Take the strongest points from each, resolve any contradictions, and provide a comprehensive response to: ${prompt}`;
 
         setState(prev => ({ ...prev, currentModel: 'Synthesizing...' }));
         
         const synthesisResult = await queryModel(
           { id: SYNTHESIS_MODEL, name: 'Synthesis', provider: 'google', speed: 'slow', quality: 'highest' },
           synthesisPrompt,
           'You are an expert at synthesizing multiple AI responses into one optimal answer.'
         );
 
         synthesizedAnswer = synthesisResult?.response || responses[0].response;
       } else {
         // Just use the best response (fastest with good length)
         synthesizedAnswer = responses.sort((a, b) => 
           (b.response.length / b.latencyMs) - (a.response.length / a.latencyMs)
         )[0].response;
       }
 
       const result: ConsensusResult = {
         synthesizedAnswer,
         responses,
         totalLatencyMs: Date.now() - startTime,
         strategy,
         agreement,
       };
 
       setState(prev => ({ ...prev, isRunning: false, progress: 100 }));
       return result;
 
     } catch (e) {
       const error = e instanceof Error ? e.message : 'Consensus failed';
       setState(prev => ({ ...prev, isRunning: false, error }));
       return null;
     }
   }, [queryModel]);
 
   // Cancel ongoing consensus
   const cancel = useCallback(() => {
     abortRef.current?.abort();
     setState(prev => ({ ...prev, isRunning: false }));
   }, []);
 
   return {
     ...state,
     runConsensus,
     cancel,
     availableModels: CONSENSUS_MODELS,
   };
 };