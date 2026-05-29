import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useToolOrchestrator, type ToolType } from "@/hooks/useToolOrchestrator";
import { executeShadowTool } from "@/lib/shadowTools/executeShadowTool";
import { SHADOWTALK_SELF_KNOWLEDGE_BRIEF } from "@/lib/shadowTalkProductKnowledge";
import type { ShadowToolResult } from "@/lib/shadowTools/types";
import { supabase } from "@/integrations/supabase/client";

export interface ShadowToolUIHandlers {
  openImageGenerator: (prompt: string, autoGenerate?: boolean) => void;
  openDeepResearch: (query: string, autoResearch?: boolean) => void;
  openShadowBrowser: (url?: string) => void;
  openShadowTalkLive: () => void;
  openAnalytics: () => void;
  openCommandPalette: () => void;
  openCodeCanvas?: () => void;
  setChatMode?: (mode: string) => void;
}

export interface ToolRunResult {
  handled: boolean;
  skipNormalChat?: boolean;
  assistantContent?: string;
  imageUrl?: string;
  chatBodyExtras?: Record<string, unknown>;
  tool?: ToolType;
}

export function useShadowToolBridge(handlers: ShadowToolUIHandlers) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { detectTool } = useToolOrchestrator();

  const applyUIResult = useCallback(
    (result: ShadowToolResult & { kind: "ui" }) => {
      const { tool, path, message } = result;

      switch (tool) {
        case "deep_research":
          handlers.openDeepResearch("", true);
          break;
        case "shadow_browser":
          handlers.openShadowBrowser();
          break;
        case "shadow_live":
          handlers.openShadowTalkLive();
          break;
        case "analytics":
          handlers.openAnalytics();
          break;
        case "command_palette":
          handlers.openCommandPalette();
          break;
        case "code_canvas":
          handlers.openCodeCanvas?.();
          break;
        case "eco_actions":
          handlers.setChatMode?.("ppag");
          toast({ title: "Eco mode", description: "Switched to Planetary Action Guide mode." });
          break;
        default:
          if (path) navigate(path);
          break;
      }

      if (path && tool !== "eco_actions") navigate(path);
      return message;
    },
    [handlers, navigate, toast]
  );

  const runDetectedTool = useCallback(
    async (
      message: string,
      options: {
        personality: string;
        mode: string;
        attachment?: { type: string; data: string; mimeType: string };
        forceTool?: ToolType;
      }
    ): Promise<ToolRunResult> => {
      const detection = options.forceTool
        ? {
            tool: options.forceTool,
            confidence: 100,
            autoExecute: true,
            params: {},
            originalMessage: message,
          }
        : detectTool(message);

      if (!detection.tool || detection.confidence < 30) {
        return { handled: false };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      try {
        const result = await executeShadowTool(
          detection.tool,
          detection.params,
          message,
          {
            accessToken: session?.access_token,
            personality: options.personality,
            mode: options.mode,
            attachment: options.attachment,
          }
        );

        if (result.kind === "inline") {
          return {
            handled: true,
            skipNormalChat: true,
            assistantContent: result.content,
            imageUrl: result.imageUrl,
            tool: detection.tool,
          };
        }

        if (result.kind === "chat_flags") {
          return {
            handled: true,
            skipNormalChat: false,
            chatBodyExtras: result.flags,
            assistantContent: result.preamble,
            tool: detection.tool,
          };
        }

        if (result.kind === "ui") {
          if (detection.tool === "image_generator" && detection.params?.prompt) {
            handlers.openImageGenerator(detection.params.prompt, true);
          } else if (detection.tool === "deep_research" && (detection.params?.query || message)) {
            handlers.openDeepResearch(detection.params?.query || message, true);
          } else {
            applyUIResult(result);
          }
          return {
            handled: true,
            skipNormalChat: true,
            assistantContent: `✓ ${result.message}`,
            tool: detection.tool,
          };
        }

        return { handled: false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool execution failed";
        toast({ title: "Tool error", description: msg, variant: "destructive" });
        return {
          handled: true,
          skipNormalChat: true,
          assistantContent: `⚠️ **${detection.tool}** failed: ${msg}`,
          tool: detection.tool,
        };
      }
    },
    [applyUIResult, detectTool, handlers, toast]
  );

  const listAvailableTools = useCallback((): string => {
    return `${SHADOWTALK_SELF_KNOWLEDGE_BRIEF}

### Chat-routable tools (ask naturally)

| Area | Examples |
|------|----------|
| **Search** | "search for latest AI news", "look up …" |
| **Research** | "research competitors in …", "deep dive on …" |
| **Images** | "generate an image of …", "analyze this image" (attach file) |
| **Code** | "write a React component …", "debug this code" |
| **Security** | "security audit https://…", paste code in HSCA mode |
| **Web** | "scrape https://…", "browse …" |
| **Missions** | "run a mission to …", "mission control" |
| **Presentations** | "create a presentation about …" |
| **Productivity** | "read my calendar", "draft an email", "plan my day" |
| **Apps** | strategy, workspace, vault, analytics, knowledge graph — say "open …" |

Ask **"what is ShadowTalk?"**, **"what plans do you offer?"**, or **"how do I use …?"** for full product answers.`;
  }, []);

  return { detectTool, runDetectedTool, listAvailableTools };
}
