import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ToolDetectionResult } from "@/hooks/useToolOrchestrator";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";

export interface ToolDispatchUI {
  openDeepResearch: (query?: string) => void;
  openImageGenerator: () => void;
  openAgenticRunner: (goal: string) => void;
  openBrowser: () => void;
  openShadowLive: () => void;
  openMissionControl: () => void;
  setPendingMessage: (text: string) => void;
  appendAssistantMessage: (content: string, toolExecution?: {
    tool: string;
    status: "complete" | "confirm" | "running";
    params?: Record<string, string>;
    result?: string;
  }) => void;
}

export type ToolDispatchOutcome =
  | { handled: true }
  | { handled: false; chatFlags?: { webSearch?: boolean; searchQuery?: string; deepResearch?: boolean; researchQuery?: string; decodeImage?: boolean; imageDataUrl?: string } };

const MIN_CONFIDENCE = 50;

export function useAgenticToolDispatch() {
  const navigate = useNavigate();
  const { detectTool, executeCalculator } = useToolOrchestrator();

  const dispatchDetection = useCallback(
    (message: string, ui: ToolDispatchUI): ToolDispatchOutcome => {
      const detection = detectTool(message);
      if (!detection.tool || detection.confidence < MIN_CONFIDENCE) {
        return { handled: false };
      }

      const params = detection.params ?? {};
      const tool = detection.tool;

      switch (tool) {
        case "calculator": {
          const expr = params.expression ?? message.replace(/^(calc|calculate|compute)\s*/i, "");
          const result = executeCalculator(expr);
          ui.appendAssistantMessage(result, {
            tool: "calculator",
            status: "complete",
            params,
            result,
          });
          return { handled: true };
        }

        case "web_search":
          if (detection.autoExecute) {
            return {
              handled: false,
              chatFlags: { webSearch: true, searchQuery: params.query ?? message },
            };
          }
          ui.appendAssistantMessage(
            "I can search the live web for this. Confirm to run, or rephrase with “search the web for …”.",
            { tool: "web_search", status: "confirm", params }
          );
          return { handled: true };

        case "deep_research":
          if (detection.autoExecute) {
            return {
              handled: false,
              chatFlags: { deepResearch: true, researchQuery: params.query ?? message },
            };
          }
          ui.openDeepResearch(params.query ?? message);
          ui.appendAssistantMessage("Opening **Deep Research** — multi-source synthesis with citations.", {
            tool: "deep_research",
            status: "complete",
            params,
          });
          return { handled: true };

        case "image_generator":
          ui.setPendingMessage(params.prompt ?? message);
          ui.openImageGenerator();
          ui.appendAssistantMessage("Opening **image generation** with your prompt.", {
            tool: "image_generator",
            status: "complete",
            params,
          });
          return { handled: true };

        case "image_decoder":
          return {
            handled: false,
            chatFlags: {
              decodeImage: true,
              imageDataUrl: params.image ?? params.data,
            },
          };

        case "agentic_runner":
          ui.openAgenticRunner(params.goal ?? params.prompt ?? message);
          ui.appendAssistantMessage("Launching **Agentic Task Runner** — I’ll plan steps and execute them.", {
            tool: "agentic_runner",
            status: "complete",
            params,
          });
          return { handled: true };

        case "mission_control":
          ui.openMissionControl();
          ui.appendAssistantMessage("Opening **Mission Control** for long-running autonomous missions.", {
            tool: "mission_control",
            status: "complete",
            params,
          });
          return { handled: true };

        case "shadow_browser":
          ui.openBrowser();
          return { handled: true };

        case "shadow_live":
          ui.openShadowLive();
          return { handled: true };

        case "document_generator":
        case "presentation_builder":
        case "code_canvas":
        case "strategy_agent":
          navigate(
            tool === "presentation_builder"
              ? "/presentations"
              : tool === "strategy_agent"
                ? "/strategy"
                : "/workspace"
          );
          return { handled: true };

        default:
          if (!detection.autoExecute) {
            ui.appendAssistantMessage(
              `Detected **${tool.replace(/_/g, " ")}** intent. Open **Tools** (⌘K) or say it more explicitly to run.`,
              { tool, status: "confirm", params }
            );
            return { handled: true };
          }
          return { handled: false };
      }
    },
    [detectTool, executeCalculator, navigate]
  );

  return { dispatchDetection, detectTool };
}
