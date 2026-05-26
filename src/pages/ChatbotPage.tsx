import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMode } from "@/components/chat/ModeSelector";
import { AIProvider } from "@/components/chat/ProviderSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatIconRail } from "@/components/chat/ChatIconRail";
import { ChatInput } from "@/components/chat/ChatInput";
import { GeminiEmptyState } from "@/components/chat/GeminiEmptyState";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ImageGenerator } from "@/components/chat/ImageGenerator";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";
import { useE2EE } from "@/hooks/useE2EE";
import { Shield, Lock, Loader2 } from "lucide-react";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { Button } from "@/components/ui/button";

// Types
interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  attachment?: { type: "image" | "file"; data: string; name: string; mimeType: string };
  imageUrl?: string;
}
type Conversation = { id: string; title: string; created_at: string };
type Personality =
  | "friendly"
  | "sarcastic"
  | "professional"
  | "creative"
  | "meticulous"
  | "curious"
  | "diplomatic"
  | "witty"
  | "pragmatic"
  | "inquisitive"
  | "spicy";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription, isOffline } = useAuth();
  const { toast } = useToast();
  const e2ee = useE2EE();

  const { isElite } = useFeatureGating();
  const { requestPermission } = usePushNotifications();
  const { getOfflineSession } = useOfflineAuth();
  useToolOrchestrator();
  useGemmaOffline();

  const [e2eePassphrase, setE2EEPassphrase] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyChats, setDailyChats] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [personality, setPersonality] = useState<Personality>("friendly");
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [aiProvider, setAiProvider] = useState<AIProvider>("lovable");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    type: "image" | "file";
    data: string;
    name: string;
    mimeType: string;
  } | null>(null);

  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useGeoLocation();

  useEffect(() => {
    const offlineSession = getOfflineSession();
    if ((user || offlineSession) && e2ee.isUnlocked) {
      loadConversations();
      checkSubscription();
      if (isElite) requestPermission();
    } else if (!user && !offlineSession && !isOffline) {
      const guestConvId = "guest-" + Date.now();
      setCurrentConversationId(guestConvId);
      setMessages([
        {
          id: "welcome",
          type: "ai",
          content: `👋 Welcome to ShadowTalk AI! Your neural workspace is ready for guest access.`,
          timestamp: new Date(),
        },
      ]);
      setConversations([
        { id: guestConvId, title: "Guest Conversation", created_at: new Date().toISOString() },
      ]);
    }
  }, [user, e2ee.isUnlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user || !e2ee.isUnlocked) return;
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data && !error) {
      const decryptedData = await Promise.all(
        data.map(async (c) => {
          let title = c.title || "Untitled";
          if (e2ee.isEncrypted(title)) {
            const unwrapped = e2ee.unwrapEncrypted(title);
            if (unwrapped) {
              const decrypted = await e2ee.decryptData(unwrapped.data, unwrapped.iv);
              title = decrypted || "Encrypted Chat";
            }
          }
          return { ...c, title };
        })
      );
      setConversations(decryptedData);
      if (decryptedData.length > 0 && !currentConversationId)
        loadConversation(decryptedData[0].id);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!e2ee.isUnlocked) return;
    setCurrentConversationId(conversationId);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data && !error) {
      const loadedMessages: Message[] = await Promise.all(
        data.map(async (m) => {
          let content = m.content;
          if (e2ee.isEncrypted(content)) {
            const unwrapped = e2ee.unwrapEncrypted(content);
            if (unwrapped)
              content =
                (await e2ee.decryptData(unwrapped.data, unwrapped.iv)) || "[DECRYPTION_FAILED]";
          }
          return {
            id: m.id,
            type: m.role === "user" ? "user" : "ai",
            content,
            timestamp: new Date(m.created_at),
          };
        })
      );
      setMessages(
        loadedMessages.length === 0
          ? [{ id: "welcome", type: "ai", content: getWelcomeMessage(), timestamp: new Date() }]
          : loadedMessages
      );
    }
  };

  const getWelcomeMessage = () => {
    return "👋 Welcome back! Your connection is fully End-to-End Encrypted.";
  };

  const saveMessage = async (content: string, role: "user" | "assistant") => {
    if (!user || !currentConversationId || !e2ee.isUnlocked) return null;
    let contentToSave = content;
    const encrypted = await e2ee.encryptData(content);
    if (encrypted) contentToSave = e2ee.wrapEncrypted(encrypted.data, encrypted.iv);

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: contentToSave,
        role,
        personality,
      })
      .select()
      .single();

    if (role === "user" && messages.length <= 1) {
      const title = content.trim().split(/\s+/).slice(0, 3).join(" ").slice(0, 25);
      let titleToSave = title;
      const encryptedTitle = await e2ee.encryptData(title);
      if (encryptedTitle) titleToSave = e2ee.wrapEncrypted(encryptedTitle.data, encryptedTitle.iv);
      await supabase
        .from("conversations")
        .update({ title: titleToSave, updated_at: new Date().toISOString() })
        .eq("id", currentConversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConversationId ? { ...c, title } : c))
      );
    }
    return data;
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isLoading || !currentConversationId) return;
    const msgContent = message;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: msgContent,
      timestamp: new Date(),
      attachment: selectedFile || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setSelectedFile(null);
    setIsLoading(true);
    await saveMessage(msgContent, "user");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const chatMessages = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: msgContent });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: chatMessages, personality, mode: chatMode }),
      });

      if (!resp.ok) throw new Error("Failed");
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();
      let assistantContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const exists = prev.find((m) => m.id === aiMessageId);
                  if (exists)
                    return prev.map((m) =>
                      m.id === aiMessageId ? { ...m, content: assistantContent } : m
                    );
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
              /* ignore malformed SSE chunks */
            }
          }
        }
      }
      if (assistantContent) await saveMessage(assistantContent, "assistant");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "ai",
          content: "Error connecting to neural host.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockE2EE = async () => {
    if (!e2eePassphrase) return;
    setIsUnlocking(true);
    const success = await e2ee.unlock(e2eePassphrase);
    setIsUnlocking(false);
    if (success) {
      setE2EEPassphrase("");
      loadConversations();
    }
  };

  if (!user && !isOffline) {
    navigate("/auth");
    return null;
  }

  if (!e2ee.isUnlocked) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#1e1f20]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-2xl text-center"
        >
          <div className="mx-auto w-20 h-20 mb-8 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-xl">
            <Lock className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Neural Vault Locked</h1>
          <p className="text-muted-foreground/60 mb-10 leading-relaxed">
            Enter your Master Passphrase to decrypt your ShadowTalk workspace.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={e2eePassphrase}
              onChange={(e) => setE2EEPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlockE2EE()}
              placeholder="Passphrase"
              className="w-full h-16 bg-white/5 border border-white/10 rounded-[20px] px-6 text-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white font-mono tracking-widest"
            />
            <Button
              onClick={handleUnlockE2EE}
              disabled={isUnlocking || !e2eePassphrase}
              className="w-full h-16 rounded-[20px] bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold"
            >
              {isUnlocking ? <Loader2 className="h-6 w-6 animate-spin" /> : "Unlock Workspace"}
            </Button>
            <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] pt-6 flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" /> E2EE PROTECTED
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isEmptyChat = messages.length <= 1;
  const userDisplayName =
    user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "G";

  const geminiChatInputProps = {
    message,
    onMessageChange: setMessage,
    onSend: handleSendMessage,
    onKeyPress: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) handleSendMessage();
    },
    isLoading,
    isListening,
    isSpeaking,
    onToggleVoice: () => setIsListening((v) => !v),
    onOpenImageGenerator: () => setShowImageGenerator(true),
    onStopGeneration: () => {
      abortControllerRef.current?.abort();
      setIsLoading(false);
    },
    selectedFile,
    onFileSelect: setSelectedFile,
    chatMode,
    onModeChange: setChatMode,
    personality,
    layout: "gemini" as const,
    aiProvider,
    onProviderChange: setAiProvider,
  };

  return (
    <motion.div
      className="min-h-screen gemini-chat-shell relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="neural-thinking-glow"
          />
        )}
      </AnimatePresence>
      <div className="flex h-screen w-full relative z-10 gemini-chat-main">
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={() => {
            setCurrentConversationId(null);
            setMessages([]);
          }}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setToolsMenuOpen(true)}
          onOpenSettings={() => navigate("/profile")}
        />
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowSidebar(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="fixed left-0 top-0 bottom-0 z-50 md:left-[72px]"
              >
                <ConversationSidebar
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onCreateNew={() => {
                    setCurrentConversationId(null);
                    setMessages([]);
                    setShowSidebar(false);
                  }}
                  onSelect={(id) => {
                    loadConversation(id);
                    setShowSidebar(false);
                  }}
                  onDelete={() => {}}
                  onClearAll={() => {}}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            userPlan={userPlan}
            personality={personality}
            onPersonalityChange={setPersonality}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onExport={() => {}}
            onManageSubscription={() => navigate("/pricing")}
            onSignOut={signOut}
            onOpenAnalytics={() => {}}
            onOpenScriptAutomation={() => {}}
            onOpenStealthVault={() => {}}
            onOpenAgentWorkflows={() => {}}
            onOpenModelFineTuning={() => {}}
            onOpenWhiteLabelBranding={() => {}}
            onOpenGeminiAnalytics={() => {}}
            onOpenCanvas={(_type: "document" | "code") => {}}
            onOpenDeepResearch={() => setShowDeepResearch(true)}
            onOpenAgenticRunner={() => {}}
            onOpenVisualReasoning={() => {}}
            onOpenCreativeSynthesis={() => {}}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onOpenShadowTalkLive={() => {}}
            onOpenBrowser={() => setShowShadowBrowser(true)}
            aiProvider={aiProvider}
            onProviderChange={setAiProvider}
            maxChats="∞"
            dailyChats={dailyChats}
            variant="minimal"
            toolsMenuOpen={toolsMenuOpen}
            onToolsMenuOpenChange={setToolsMenuOpen}
          />
          <div
            className={`flex-1 overflow-hidden relative flex flex-col min-h-0 ${
              isEmptyChat ? "justify-center" : ""
            }`}
          >
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center flex-1 w-full px-4 py-8 gap-8"
                >
                  <GeminiEmptyState userName={userDisplayName} onSelectPrompt={setMessage} />
                  <div className="floating-prompt-bar w-full">
                    <ChatInput {...geminiChatInputProps} isEmptyState />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col min-h-0"
                >
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    showSuggestions={false}
                    personality={personality}
                    userPlan={userPlan}
                    speakingMessageId={speakingMessageId}
                    isSpeaking={isSpeaking}
                    onSelectPrompt={setMessage}
                    onEdit={() => {}}
                    onRegenerate={() => {}}
                    onTextToSpeech={() => {}}
                    onOpenCodeCanvas={() => {}}
                    onOpenIDE={() => {}}
                    onOpenInBrowser={() => setShowShadowBrowser(true)}
                    messagesEndRef={messagesEndRef}
                    layout="gemini"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && (
            <div className="shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-sm">
              <ChatInput {...geminiChatInputProps} />
            </div>
          )}
        </div>
      </div>
      {showImageGenerator && (
        <ImageGenerator
          onClose={() => setShowImageGenerator(false)}
          onImageGenerated={(url) =>
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: "ai",
                content: "🎨 Generated image",
                timestamp: new Date(),
                imageUrl: url,
              },
            ])
          }
        />
      )}
      {showDeepResearch && (
        <DeepResearchPanel
          isOpen={showDeepResearch}
          onClose={() => setShowDeepResearch(false)}
          onInsertToChat={(c) =>
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), type: "ai", content: c, timestamp: new Date() },
            ])
          }
        />
      )}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onAction={() => {}}
      />
    </motion.div>
  );
};
export default ChatbotPage;
