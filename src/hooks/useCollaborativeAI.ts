import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface SharedAIMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  isShared: boolean;
}

interface UseCollaborativeAIOptions {
  roomId: string;
  enabled?: boolean;
}

export const useCollaborativeAI = ({ roomId, enabled = true }: UseCollaborativeAIOptions) => {
  const { user } = useAuth();
  const [sharedMessages, setSharedMessages] = useState<SharedAIMessage[]>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [activeAIUser, setActiveAIUser] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user || !roomId || !enabled) return;

    const channel = supabase.channel(`collab-ai:${roomId}`)
      .on("broadcast", { event: "ai_message" }, ({ payload }) => {
        const msg = payload as SharedAIMessage;
        setSharedMessages(prev => [...prev, msg]);
      })
      .on("broadcast", { event: "ai_status" }, ({ payload }) => {
        setIsAIProcessing(payload.isProcessing);
        setActiveAIUser(payload.isProcessing ? payload.userName : null);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roomId, enabled]);

  const sendSharedAIQuery = useCallback(async (query: string) => {
    if (!channelRef.current || !user) return;

    const userName = user.email?.split("@")[0] || "Anonymous";

    // Broadcast AI processing status
    channelRef.current.send({
      type: "broadcast",
      event: "ai_status",
      payload: { isProcessing: true, userName, userId: user.id },
    });

    // Broadcast user message
    const userMsg: SharedAIMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName,
      content: query,
      role: "user",
      timestamp: Date.now(),
      isShared: true,
    };

    channelRef.current.send({
      type: "broadcast",
      event: "ai_message",
      payload: userMsg,
    });

    setSharedMessages(prev => [...prev, userMsg]);

    try {
      // Call chat function
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: query }],
          personality: "default",
          sessionType: "collaborative",
        },
      });

      if (error) throw error;

      const responseText = typeof data === "string"
        ? data
        : data?.choices?.[0]?.message?.content || data?.response || "No response.";

      const aiMsg: SharedAIMessage = {
        id: crypto.randomUUID(),
        userId: "ai",
        userName: `ShadowTalk (via ${userName})`,
        content: responseText,
        role: "assistant",
        timestamp: Date.now(),
        isShared: true,
      };

      channelRef.current?.send({
        type: "broadcast",
        event: "ai_message",
        payload: aiMsg,
      });

      setSharedMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error("[CollaborativeAI] Error:", err);
    } finally {
      channelRef.current?.send({
        type: "broadcast",
        event: "ai_status",
        payload: { isProcessing: false, userName, userId: user.id },
      });
    }
  }, [user]);

  return {
    sharedMessages,
    isAIProcessing,
    activeAIUser,
    sendSharedAIQuery,
  };
};
