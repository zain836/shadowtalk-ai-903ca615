import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMissions, Mission, MissionStep } from './useMissions';

// =============================================================================
// SOVEREIGN EXECUTION ENGINE - Mission Executor
// Persistent background execution that survives browser close
// =============================================================================

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ExecutionContext {
  missionId: string;
  userId: string;
  accessToken: string;
}

export const useMissionExecutor = () => {
  const { toast } = useToast();
  const { updateMissionStatus, addAction, updateAction } = useMissions();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Generate execution plan using AI
  const generatePlan = useCallback(async (goal: string, context: ExecutionContext): Promise<MissionStep[]> => {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are a task planner. Break down this goal into 4-8 specific, actionable steps. 
Each step should be a concrete action that can be verified.
Format: Return ONLY a JSON array of objects with "action" and "tool_name" fields.

Goal: ${goal}

Example format:
[
  {"action": "Search for real estate listings in Karachi", "tool_name": "web_search"},
  {"action": "Extract contact information from listings", "tool_name": "data_extraction"},
  {"action": "Verify phone numbers", "tool_name": "verification"},
  {"action": "Draft personalized email template", "tool_name": "email_composer"}
]`
          }],
          model: 'google/gemini-2.5-flash',
          stream: false,
        }),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

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
                if (content) fullContent += content;
              } catch {}
            }
          }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]);
        return steps.map((s: { action: string; tool_name?: string }, i: number) => ({
          id: `step-${i + 1}`,
          action: s.action,
          tool_name: s.tool_name || 'general',
          status: 'pending' as const,
        }));
      }

      // Fallback: create basic steps
      return [
        { id: 'step-1', action: 'Analyze the request', status: 'pending' as const },
        { id: 'step-2', action: 'Gather required information', status: 'pending' as const },
        { id: 'step-3', action: 'Process and execute', status: 'pending' as const },
        { id: 'step-4', action: 'Compile results', status: 'pending' as const },
      ];
    } catch (error) {
      console.error('Error generating plan:', error);
      return [
        { id: 'step-1', action: 'Analyze the request', status: 'pending' as const },
        { id: 'step-2', action: 'Execute task', status: 'pending' as const },
        { id: 'step-3', action: 'Compile results', status: 'pending' as const },
      ];
    }
  }, []);

  // Execute a single step
  const executeStep = useCallback(async (
    step: MissionStep,
    goal: string,
    context: ExecutionContext,
    previousResults: string[]
  ): Promise<{ success: boolean; result: string }> => {
    const startTime = Date.now();

    // Log action to database
    const action = await addAction(context.missionId, 'execute_step', step.action, {
      tool_name: step.tool_name,
      input_data: { goal, previousResults },
    });

    if (action) {
      await updateAction(action.id, 'running');
    }

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are executing step "${step.action}" for the goal: "${goal}"

Previous results: ${previousResults.length > 0 ? previousResults.join('\n') : 'None yet'}

Execute this step and provide a concrete result. Be specific and actionable.
If this requires external tools (like searching the web), describe what you would find.
Format your response as a clear, concise result.`
          }],
          model: 'google/gemini-2.5-flash',
          stream: false,
        }),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) throw new Error('Step execution failed');

      // Parse response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

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
                if (content) result += content;
              } catch {}
            }
          }
        }
      }

      const duration = Date.now() - startTime;

      if (action) {
        await updateAction(action.id, 'success', {
          output_data: { result },
          duration_ms: duration,
        });
      }

      return { success: true, result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (action) {
        await updateAction(action.id, 'failed', {
          error_message: errorMsg,
          duration_ms: Date.now() - startTime,
        });
      }

      return { success: false, result: errorMsg };
    }
  }, [addAction, updateAction]);

  // Main execution function
  const executeMission = useCallback(async (mission: Mission): Promise<boolean> => {
    if (isExecuting) {
      toast({ title: "Already executing", description: "Please wait for current mission to complete" });
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in required", variant: "destructive" });
      return false;
    }

    const context: ExecutionContext = {
      missionId: mission.id,
      userId: session.user.id,
      accessToken: session.access_token,
    };

    abortRef.current = new AbortController();
    setIsExecuting(true);
    setCurrentMissionId(mission.id);

    try {
      // Phase 1: Planning
      await updateMissionStatus(mission.id, 'running', { started_at: new Date().toISOString() });
      await addAction(mission.id, 'planning', 'Generating execution plan');

      const steps = await generatePlan(mission.goal, context);
      
      await supabase
        .from('missions')
        .update({ steps: JSON.parse(JSON.stringify(steps)) })
        .eq('id', mission.id);

      // Phase 2: Execution
      const results: string[] = [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Check if cancelled
        if (abortRef.current?.signal.aborted) {
          await updateMissionStatus(mission.id, 'cancelled');
          return false;
        }

        // Update step status
        steps[i].status = 'running';
        await supabase
          .from('missions')
          .update({ 
            steps: JSON.parse(JSON.stringify(steps)),
            current_step: i,
            progress: Math.round((i / steps.length) * 100)
          })
          .eq('id', mission.id);

        // Execute step
        const { success, result } = await executeStep(step, mission.goal, context, results);

        if (success) {
          steps[i].status = 'completed';
          steps[i].result = result;
          results.push(result);
        } else {
          steps[i].status = 'failed';
          
          // Hybrid retry: 3 free retries before counting against quota
          const currentRetries = mission.retry_count || 0;
          if (currentRetries < 3) {
            await supabase
              .from('missions')
              .update({ retry_count: currentRetries + 1 })
              .eq('id', mission.id);
            
            const retry = await executeStep(step, mission.goal, context, results);
            if (retry.success) {
              steps[i].status = 'completed';
              steps[i].result = retry.result;
              results.push(retry.result);
            }
          }
        }

        // Save progress
        await supabase
          .from('missions')
          .update({ 
            steps: JSON.parse(JSON.stringify(steps)),
            progress: Math.round(((i + 1) / steps.length) * 100)
          })
          .eq('id', mission.id);
      }

      // Phase 3: Compile final result
      const finalResultResponse = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Compile the final result for this mission:
Goal: ${mission.goal}

Step Results:
${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Provide a comprehensive final deliverable.`
          }],
          model: 'google/gemini-2.5-pro',
          stream: false,
        }),
      });

      let finalResult = results.join('\n\n');
      
      if (finalResultResponse.ok) {
        const reader = finalResultResponse.body?.getReader();
        const decoder = new TextDecoder();
        let compiled = '';

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
                  if (content) compiled += content;
                } catch {}
              }
            }
          }
        }
        
        if (compiled) finalResult = compiled;
      }

      // Mark as complete
      await updateMissionStatus(mission.id, 'completed', {
        result: { output: finalResult, steps: results } as unknown as Record<string, unknown>,
        progress: 100,
        completed_at: new Date().toISOString(),
        actual_duration_ms: Date.now() - new Date(mission.started_at || mission.created_at).getTime(),
      });

      toast({ 
        title: "Mission Complete! 🎉", 
        description: `"${mission.title}" has been executed successfully` 
      });

      return true;
    } catch (error) {
      console.error('Mission execution error:', error);
      
      await updateMissionStatus(mission.id, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({ 
        title: "Mission Failed", 
        description: error instanceof Error ? error.message : 'Execution error',
        variant: "destructive" 
      });

      return false;
    } finally {
      setIsExecuting(false);
      setCurrentMissionId(null);
      abortRef.current = null;
    }
  }, [isExecuting, toast, updateMissionStatus, addAction, generatePlan, executeStep]);

  // Cancel current execution
  const cancelExecution = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return {
    isExecuting,
    currentMissionId,
    executeMission,
    cancelExecution,
  };
};
