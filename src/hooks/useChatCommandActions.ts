import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ChatMode } from "@/components/chat/ModeSelector";

export interface ChatCommandHandlers {
  startNewChat: () => void | Promise<void>;
  openDeepResearch: () => void;
  openImageGenerator: () => void;
  openShadowTalkLive: (autoConnect?: boolean) => void;
  openShadowBrowser: () => void;
  openAnalytics: () => void;
  openCodeCanvas: () => void;
  setChatMode: (mode: ChatMode) => void;
}

export function useChatCommandActions(handlers: ChatCommandHandlers) {
  const navigate = useNavigate();

  return useCallback(
    (action: string) => {
      switch (action) {
        case "new-chat":
          void handlers.startNewChat();
          break;
        case "deep-research":
          handlers.openDeepResearch();
          break;
        case "image":
          handlers.openImageGenerator();
          break;
        case "voice":
          handlers.openShadowTalkLive(true);
          break;
        case "browser":
          handlers.openShadowBrowser();
          break;
        case "analytics":
          handlers.openAnalytics();
          break;
        case "code":
          handlers.openCodeCanvas();
          break;
        case "research":
          handlers.setChatMode("research");
          handlers.openDeepResearch();
          break;
        case "eco":
          handlers.setChatMode("ppag");
          break;
        case "security":
          handlers.setChatMode("hsca");
          break;
        case "vault":
          navigate("/vault");
          break;
        case "missions":
          navigate("/missioncontrol");
          break;
        case "knowledge-vault":
          navigate("/knowledge");
          break;
        case "memory":
          navigate("/shadow-memory");
          break;
        case "sovereign":
          navigate("/personal-llm");
          break;
        case "offline":
          navigate("/offline-license");
          break;
        case "agentic":
          navigate("/missioncontrol");
          break;
        case "creative":
          navigate("/studio");
          break;
        case "document":
          handlers.setChatMode("creative");
          break;
        case "multi-model":
          navigate("/strategy");
          break;
        case "script-automation":
          navigate("/workspace");
          break;
        case "agent-workflows":
          navigate("/agents");
          break;
        case "fine-tuning":
          navigate("/personal-llm");
          break;
        case "white-label":
          navigate("/enterprise");
          break;
        case "gemini-analytics":
          navigate("/analytics");
          break;
        case "google":
          navigate("/developers");
          break;
        case "planner":
          handlers.setChatMode("email");
          break;
        case "organize":
          handlers.setChatMode("organize");
          break;
        case "camera":
          handlers.setChatMode("camera");
          break;
        case "vision":
          handlers.setChatMode("camera");
          break;
        default:
          console.warn("[CommandPalette] Unhandled action:", action);
      }
    },
    [handlers, navigate]
  );
}
