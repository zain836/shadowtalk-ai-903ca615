import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShadowToolBridge } from "@/hooks/useShadowToolBridge";
import type { ChatMode } from "@/components/chat/ModeSelector";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export interface ChatToolRouterMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  toolExecution?: {
    tool: string;
    status: "pending" | "running" | "complete" | "error" | "confirm";
    params?: Record<string, string>;
    result?: string;
  };
}

export interface RunChatTurnParams {
  msgContent: string;
  messages: ChatToolRouterMessage[];
  personality: string;
  chatMode: ChatMode;
  attachment?: { type: string; data: string; mimeType: string };
  onMessagesUpdate: (updater: (prev: ChatToolRouterMessage[]) => ChatToolRouterMessage[]) => void;
  saveAssistant: (content: string) => Promise<void>;
}

export function useChatToolRouter(handlers: Parameters<typeof useShadowToolBridge>[0]) {
  const toolBridge = useShadowToolBridge(handlers);

  const streamChat = useCallback(
    async (
      chatMessages: Array<{ role: string; content: string }>,
      personality: string,
      chatMode: string,
      bodyExtras: Record<string, unknown>,
      onMessagesUpdate: RunChatTurnParams["onMessagesUpdate"],
      saveAssistant: (content: string) => Promise<void>
    ) => {
      const { data: { session } } = await supabase.auth.getSession();
      const aiMessageId = crypto.randomUUID();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: chatMessages,
          personality,
          mode: chatMode,
          ...bodyExtras,
        }),
      });

      if (!resp.ok) throw new Error("Chat request failed");

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                onMessagesUpdate((prev) => {
                  const exists = prev.find((m) => m.id === aiMessageId);
                  if (exists) {
                    return prev.map((m) =>
                      m.id === aiMessageId ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: aiMessageId,
                      type: "ai",
                      content: assistantContent,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (assistantContent) await saveAssistant(assistantContent);
      return assistantContent;
    },
    []
  );

  const runChatTurn = useCallback(
    async (params: RunChatTurnParams) => {
      const { msgContent, messages, personality, chatMode, attachment, onMessagesUpdate, saveAssistant } =
        params;

      if (/\b(what tools|list tools|what can you do|show (me )?features|available tools)\b/i.test(msgContent)) {
        const help = toolBridge.listAvailableTools();
        onMessagesUpdate((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "ai", content: help, timestamp: new Date() },
        ]);
        return;
      }

      const toolRun = await toolBridge.runDetectedTool(msgContent, {
        personality,
        mode: chatMode,
        attachment,
      });

      if (toolRun.handled && toolRun.skipNormalChat && toolRun.assistantContent) {
        onMessagesUpdate((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "ai",
            content: toolRun.assistantContent!,
            timestamp: new Date(),
            imageUrl: toolRun.imageUrl,
            toolExecution: toolRun.tool
              ? { tool: toolRun.tool, status: "complete", result: toolRun.assistantContent }
              : undefined,
          },
        ]);
        await saveAssistant(toolRun.assistantContent);
        return;
      }

      const chatMessages = messages
        .filter((m) => m.id !== "welcome" && m.content)
        .map((m) => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: msgContent });

      const bodyExtras: Record<string, unknown> = { ...(toolRun.chatBodyExtras || {}) };
      if (chatMode === "research" && !bodyExtras.deepResearch) {
        bodyExtras.webSearch = true;
        bodyExtras.searchQuery = msgContent;
      }

      if (toolRun.handled && toolRun.assistantContent && !toolRun.skipNormalChat) {
        onMessagesUpdate((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "ai",
            content: toolRun.assistantContent!,
            timestamp: new Date(),
            toolExecution: toolRun.tool ? { tool: toolRun.tool, status: "complete" } : undefined,
          },
        ]);
      }

      await streamChat(chatMessages, personality, chatMode, bodyExtras, onMessagesUpdate, saveAssistant);
    },
    [streamChat, toolBridge]
  );

  return { runChatTurn, listAvailableTools: toolBridge.listAvailableTools };
}
