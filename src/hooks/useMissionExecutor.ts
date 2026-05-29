import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMissions, Mission, MissionStep } from "./useMissions";
import { generateMissionPlan } from "@/lib/see/generateMissionPlan";
import { executeMissionTool } from "@/lib/see/missionToolExecutor";
import { streamChatCompletion } from "@/lib/see/chatCompletion";
import type { MissionPlanStep } from "@/lib/see/types";
import { trackAgenticEvent } from "@/lib/agenticMetrics";

export interface PendingApproval {
  missionId: string;
  stepIndex: number;
  step: MissionPlanStep;
}

interface ExecutionContext {
  missionId: string;
  accessToken: string;
  autoApprove: boolean;
}

function planToMissionSteps(steps: MissionPlanStep[]): MissionStep[] {
  return steps.map((s) => ({
    id: s.id,
    action: s.action,
    status: s.status as MissionStep["status"],
    result: s.result,
    duration_ms: s.duration_ms,
    tool_name: s.tool_name,
    requires_approval: s.requires_approval,
    tool_params: s.tool_params,
    proof: s.proof,
  }));
}

export const useMissionExecutor = () => {
  const { toast } = useToast();
  const { updateMissionStatus, addAction, updateAction } = useMissions();

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const missionRef = useRef<Mission | null>(null);
  const stepsRef = useRef<MissionPlanStep[]>([]);
  const resultsRef = useRef<string[]>([]);
  const contextRef = useRef<ExecutionContext | null>(null);

  const persistSteps = useCallback(
    async (missionId: string, steps: MissionPlanStep[], extra?: Record<string, unknown>) => {
      await supabase
        .from("missions")
        .update({
          steps: JSON.parse(JSON.stringify(planToMissionSteps(steps))),
          ...extra,
        })
        .eq("id", missionId);
    },
    []
  );

  const runStep = useCallback(
    async (
      stepIndex: number,
      goal: string,
      ctx: ExecutionContext,
      forceApprove = false
    ): Promise<"ok" | "paused" | "failed"> => {
      const steps = stepsRef.current;
      const step = steps[stepIndex];
      const previousResults = resultsRef.current;
      const startTime = Date.now();

      steps[stepIndex] = { ...step, status: "running" };
      stepsRef.current = steps;
      await persistSteps(ctx.missionId, steps, {
        current_step: stepIndex,
        progress: Math.round((stepIndex / steps.length) * 100),
      });

      const action = await addAction(ctx.missionId, "execute_step", step.action, {
        tool_name: step.tool_name,
        input_data: { goal, tool_params: step.tool_params },
        requires_approval: step.requires_approval,
      });
      if (action) await updateAction(action.id, "running");

      const toolResult = await executeMissionTool(step, goal, ctx.accessToken, previousResults, {
        autoApprove: ctx.autoApprove || forceApprove,
        signal: abortRef.current?.signal,
      });

      if (toolResult.requiresApproval && !ctx.autoApprove && !forceApprove) {
        steps[stepIndex] = {
          ...step,
          status: "awaiting_approval",
          result: toolResult.output,
        };
        stepsRef.current = steps;
        await persistSteps(ctx.missionId, steps, { status: "paused" });
        await updateMissionStatus(ctx.missionId, "paused", { steps: planToMissionSteps(steps) });

        if (action) {
          await updateAction(action.id, "success", {
            output_data: { output: toolResult.output, awaiting_approval: true },
            duration_ms: Date.now() - startTime,
          });
        }

        setPendingApproval({ missionId: ctx.missionId, stepIndex, step: steps[stepIndex] });
        setIsExecuting(false);
        return "paused";
      }

      const duration = Date.now() - startTime;

      if (toolResult.success) {
        steps[stepIndex] = {
          ...step,
          status: "completed",
          result: toolResult.output,
          duration_ms: duration,
          proof: toolResult.proof,
        };
        resultsRef.current = [...previousResults, toolResult.output];
        stepsRef.current = steps;

        if (action) {
          await updateAction(action.id, "success", {
            output_data: { output: toolResult.output, proof: toolResult.proof },
            duration_ms: duration,
          });
        }
        return "ok";
      }

      steps[stepIndex] = { ...step, status: "failed", result: toolResult.output, duration_ms: duration };
      stepsRef.current = steps;
      if (action) {
        await updateAction(action.id, "failed", {
          error_message: toolResult.error || toolResult.output,
          duration_ms: duration,
        });
      }
      return "failed";
    },
    [addAction, persistSteps, updateAction, updateMissionStatus]
  );

  const finishMission = useCallback(
    async (mission: Mission, ctx: ExecutionContext): Promise<string> => {
      const results = resultsRef.current;
      const steps = stepsRef.current;

      const finalResult = await streamChatCompletion(
        ctx.accessToken,
        `Compile the final deliverable for this ShadowTalk S.E.E. mission.

Goal: ${mission.goal}

Step outputs:
${results.map((r, idx) => `### Step ${idx + 1}\n${r}`).join("\n\n")}

Provide a comprehensive, actionable final report with citations where available.`,
        { model: "google/gemini-2.5-pro", signal: abortRef.current?.signal }
      );

      await trackAgenticEvent("mission_complete", { missionId: mission.id });
      await updateMissionStatus(mission.id, "completed", {
        result: { output: finalResult, steps: results },
        progress: 100,
        completed_at: new Date().toISOString(),
        actual_duration_ms:
          Date.now() - new Date(mission.started_at || mission.created_at).getTime(),
        steps: planToMissionSteps(steps),
      });

      toast({ title: "Mission complete", description: `"${mission.title}" finished with verified steps.` });
      return finalResult;
    },
    [toast, updateMissionStatus]
  );

  const runStepsFrom = useCallback(
    async (startIndex: number, skipAtIndex?: number): Promise<string | null> => {
      const mission = missionRef.current;
      const ctx = contextRef.current;
      if (!mission || !ctx) return null;

      const steps = stepsRef.current;
      let i = startIndex;

      if (skipAtIndex !== undefined) {
        steps[skipAtIndex] = { ...steps[skipAtIndex], status: "skipped" };
        stepsRef.current = steps;
        await persistSteps(ctx.missionId, steps);
      }

      trackAgenticEvent("mission_start", { missionId: mission.id });
      setIsExecuting(true);
      setCurrentMissionId(mission.id);
      await updateMissionStatus(mission.id, "running");

      for (; i < steps.length; i++) {
        if (abortRef.current?.signal.aborted) {
          await updateMissionStatus(mission.id, "cancelled");
          setIsExecuting(false);
          setCurrentMissionId(null);
          return null;
        }

        const outcome = await runStep(i, mission.goal, ctx);
        if (outcome === "paused") return null;

        await persistSteps(ctx.missionId, stepsRef.current, {
          progress: Math.round(((i + 1) / steps.length) * 100),
        });
      }

      const final = await finishMission(mission, ctx);
      setIsExecuting(false);
      setCurrentMissionId(null);
      abortRef.current = null;
      return final;
    },
    [finishMission, persistSteps, runStep, updateMissionStatus]
  );

  const executeMission = useCallback(
    async (mission: Mission): Promise<string | null> => {
      if (isExecuting) {
        toast({ title: "Already executing", description: "Wait for the current mission to finish." });
        return null;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      const ctx: ExecutionContext = {
        missionId: mission.id,
        accessToken: session.access_token,
        autoApprove: mission.auto_approve,
      };

      abortRef.current = new AbortController();
      missionRef.current = mission;
      contextRef.current = ctx;
      setIsExecuting(true);
      setCurrentMissionId(mission.id);
      setPendingApproval(null);

      try {
        await updateMissionStatus(mission.id, "running", {
          started_at: new Date().toISOString(),
        });
        await addAction(mission.id, "planning", "Generating execution plan with real tools");

        const steps = await generateMissionPlan(mission.goal, ctx.accessToken, abortRef.current.signal);
        stepsRef.current = steps;
        resultsRef.current = [];

        await persistSteps(mission.id, steps, { progress: 5 });

        return await runStepsFrom(0);
      } catch (error) {
        console.error("Mission execution error:", error);
        await updateMissionStatus(mission.id, "failed", {
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
        toast({
          title: "Mission failed",
          description: error instanceof Error ? error.message : "Execution error",
          variant: "destructive",
        });
        setIsExecuting(false);
        setCurrentMissionId(null);
        return null;
      }
    },
    [addAction, isExecuting, persistSteps, runStepsFrom, toast, updateMissionStatus]
  );

  const approvePendingStep = useCallback(async (): Promise<string | null> => {
    if (!pendingApproval || !missionRef.current || !contextRef.current) return null;
    const idx = pendingApproval.stepIndex;
    setPendingApproval(null);
    if (!abortRef.current) abortRef.current = new AbortController();

    const outcome = await runStep(idx, missionRef.current.goal, contextRef.current, true);
    if (outcome === "paused") return null;
    return runStepsFrom(idx + 1);
  }, [pendingApproval, runStep, runStepsFrom]);

  const rejectPendingStep = useCallback(async (): Promise<string | null> => {
    if (!pendingApproval) return null;
    const idx = pendingApproval.stepIndex;
    setPendingApproval(null);
    if (!abortRef.current) abortRef.current = new AbortController();
    return runStepsFrom(idx + 1, idx);
  }, [pendingApproval, runStepsFrom]);

  const cancelExecution = useCallback(() => {
    abortRef.current?.abort();
    setPendingApproval(null);
    setIsExecuting(false);
    setCurrentMissionId(null);
  }, []);

  return {
    isExecuting,
    currentMissionId,
    pendingApproval,
    executeMission,
    approvePendingStep,
    rejectPendingStep,
    cancelExecution,
  };
};
