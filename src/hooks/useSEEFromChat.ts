import { useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectComplexTask } from "@/lib/see/complexTaskDetector";
import { useMissions, Mission } from "@/hooks/useMissions";
import { useMissionExecutor } from "@/hooks/useMissionExecutor";
import { useMissionQuota } from "@/hooks/useMissionQuota";

export interface SEEChatMissionState {
  mission: Mission | null;
  goal: string;
  status: "idle" | "running" | "paused" | "completed" | "failed";
  result: string | null;
}

export const useSEEFromChat = () => {
  const { toast } = useToast();
  const { createMission, setActiveMission, activeMission, fetchMissions } = useMissions();
  const {
    executeMission,
    isExecuting,
    pendingApproval,
    approvePendingStep,
    rejectPendingStep,
    cancelExecution,
  } = useMissionExecutor();
  const { canCreateMission, consumeMission } = useMissionQuota();

  const [chatMission, setChatMission] = useState<SEEChatMissionState>({
    mission: null,
    goal: "",
    status: "idle",
    result: null,
  });

  useEffect(() => {
    if (!activeMission) return;
    if (chatMission.mission?.id === activeMission.id || chatMission.status === "idle") {
      setChatMission((prev) => ({
        ...prev,
        mission: activeMission,
        status:
          activeMission.status === "paused"
            ? "paused"
            : activeMission.status === "completed"
              ? "completed"
              : activeMission.status === "failed"
                ? "failed"
                : activeMission.status === "running"
                  ? "running"
                  : prev.status,
        result:
          activeMission.status === "completed" && activeMission.result
            ? String((activeMission.result as { output?: string }).output || "")
            : prev.result,
      }));
    }
  }, [activeMission, chatMission.mission?.id, chatMission.status]);

  const shouldRouteToSEE = useCallback((message: string) => detectComplexTask(message), []);

  const launchMissionFromChat = useCallback(
    async (goal: string, options?: { autoApprove?: boolean }): Promise<SEEChatMissionState | null> => {
      const detection = detectComplexTask(goal);
      if (!detection.useSEE) return null;

      if (!canCreateMission) {
        toast({
          title: "Mission quota reached",
          description: "Upgrade your plan or wait until next month for more S.E.E. missions.",
          variant: "destructive",
        });
        return null;
      }

      const title = goal.trim().slice(0, 56) + (goal.length > 56 ? "…" : "");
      const mission = await createMission(title, goal.trim(), {
        auto_approve: options?.autoApprove ?? false,
        description: `Launched from chat · ${detection.reason}`,
      });

      if (!mission) return null;

      await consumeMission();
      setActiveMission(mission);
      setChatMission({ mission, goal: goal.trim(), status: "running", result: null });

      const finalResult = await executeMission(mission);
      await fetchMissions();

      const { data: updatedRow } = await supabase
        .from("missions")
        .select("*")
        .eq("id", mission.id)
        .single();

      const updatedMission = updatedRow
        ? ({ ...updatedRow, steps: (updatedRow.steps as Mission["steps"]) || [] } as Mission)
        : mission;

      if (finalResult) {
        const state: SEEChatMissionState = {
          mission: { ...updatedMission, status: "completed", progress: 100, result: { output: finalResult } },
          goal: goal.trim(),
          status: "completed",
          result: finalResult,
        };
        setChatMission(state);
        return state;
      }

      if (updatedMission.status === "paused") {
        const paused: SEEChatMissionState = { mission: updatedMission, goal: goal.trim(), status: "paused", result: null };
        setChatMission(paused);
        return paused;
      }

      const failed: SEEChatMissionState = { mission: updatedMission, goal: goal.trim(), status: "failed", result: null };
      setChatMission(failed);
      return failed;
    },
    [canCreateMission, consumeMission, createMission, executeMission, fetchMissions, setActiveMission, toast]
  );

  const approveChatMissionStep = useCallback(async () => {
    const result = await approvePendingStep();
    if (result) {
      setChatMission((prev) => ({
        mission: prev.mission ? { ...prev.mission, status: "completed", progress: 100 } : null,
        goal: prev.goal,
        status: "completed",
        result,
      }));
      await fetchMissions();
    }
    return result;
  }, [approvePendingStep, fetchMissions]);

  const dismissChatMission = useCallback(() => {
    setChatMission({ mission: null, goal: "", status: "idle", result: null });
    setActiveMission(null);
  }, [setActiveMission]);

  return {
    chatMission,
    activeMission,
    isExecuting,
    pendingApproval,
    shouldRouteToSEE,
    launchMissionFromChat,
    approveChatMissionStep,
    rejectPendingStep,
    cancelExecution,
    dismissChatMission,
    setChatMission,
  };
};
