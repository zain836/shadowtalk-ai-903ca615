import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { useE2EE } from "@/hooks/useE2EE";

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  attachment?: { type: "image" | "file"; data: string; name: string; mimeType: string };
  imageUrl?: string;
  toolExecution?: {
    tool: string;
    status: "pending" | "running" | "complete" | "error" | "confirm";
    params?: Record<string, string>;
    result?: string;
  };
}

type E2EEApi = Pick<
  ReturnType<typeof useE2EE>,
  "isUnlocked" | "isEncrypted" | "unwrapEncrypted" | "decryptData" | "encryptData" | "wrapEncrypted"
>;

export function useChatConversations(
  userId: string | undefined,
  e2ee: E2EEApi,
  options?: { onConversationCreated?: () => void }
) {
  const { toast } = useToast();

  const decryptText = useCallback(
    async (text: string) => {
      if (!e2ee.isEncrypted(text)) return text;
      const unwrapped = e2ee.unwrapEncrypted(text);
      if (!unwrapped) return text;
      return (await e2ee.decryptData(unwrapped.data, unwrapped.iv)) || "[DECRYPTION_FAILED]";
    },
    [e2ee]
  );

  const encryptText = useCallback(
    async (text: string) => {
      if (!e2ee.isUnlocked) return text;
      const encrypted = await e2ee.encryptData(text);
      if (encrypted) return e2ee.wrapEncrypted(encrypted.data, encrypted.iv);
      return text;
    },
    [e2ee]
  );

  const loadConversations = useCallback(async (): Promise<ChatConversation[]> => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Chat] load conversations:", error);
      toast({ title: "Could not load chats", description: error.message, variant: "destructive" });
      return [];
    }

    return Promise.all(
      (data || []).map(async (c) => ({
        id: c.id,
        title: await decryptText(c.title || "New Chat"),
        created_at: c.created_at,
      }))
    );
  }, [userId, decryptText, toast]);

  const loadMessages = useCallback(
    async (conversationId: string): Promise<ChatMessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Chat] load messages:", error);
        return [];
      }

      return Promise.all(
        (data || []).map(async (m) => ({
          id: m.id,
          type: (m.role === "user" ? "user" : "ai") as "user" | "ai",
          content: await decryptText(m.content),
          timestamp: new Date(m.created_at),
        }))
      );
    },
    [decryptText]
  );

  const createConversation = useCallback(
    async (title = "New Chat"): Promise<string | null> => {
      if (!userId) return null;
      const titleToSave = await encryptText(title);
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: titleToSave })
        .select("id, created_at")
        .single();

      if (error || !data) {
        console.error("[Chat] create conversation:", error);
        toast({
          title: "Could not start chat",
          description: error?.message || "Unknown error",
          variant: "destructive",
        });
        return null;
      }

      options?.onConversationCreated?.();
      return data.id;
    },
    [userId, encryptText, toast, options]
  );

  const saveMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      role: "user" | "assistant",
      personality: string,
      options?: { updateTitleFromContent?: boolean }
    ) => {
      if (!userId || !conversationId) return null;
      const contentToSave = await encryptText(content);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: contentToSave,
          role,
          personality,
        })
        .select()
        .single();

      if (error) {
        console.error("[Chat] save message:", error);
        return null;
      }

      if (options?.updateTitleFromContent && role === "user") {
        const title = content.trim().split(/\s+/).slice(0, 3).join(" ").slice(0, 25) || "New Chat";
        const titleToSave = await encryptText(title);
        await supabase
          .from("conversations")
          .update({ title: titleToSave, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      } else {
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      return data;
    },
    [userId, encryptText]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return false;
      }
      return true;
    },
    [toast]
  );

  return {
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    decryptText,
    encryptText,
  };
}
