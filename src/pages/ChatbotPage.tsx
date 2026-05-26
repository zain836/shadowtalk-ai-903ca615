import { useState, useEffect, useRef, useCallback } from "react";
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
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ImageGenerator } from "@/components/chat/ImageGenerator";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking, type QueryCategory } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useChatToolRouter } from "@/hooks/useChatToolRouter";
import { useChatConversations, type ChatMessageRow } from "@/hooks/useChatConversations";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { ShadowTalkLive } from "@/components/chat/ShadowTalkLive";
import { CodeCanvas } from "@/components/chat/CodeCanvas";
import { useE2EE } from "@/hooks/useE2EE";
import { useChatSpeech } from "@/hooks/useChatSpeech";
import { useChatCommandActions } from "@/hooks/useChatCommandActions";
import { PersonalIDE } from "@/components/chat/PersonalIDE";
import { CreativeSynthesis } from "@/components/chat/CreativeSynthesis";
import { Shield, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = ChatMessageRow;
type Conversation = { id: string; title: string; created_at: string };
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

function chatModeToCategory(mode: ChatMode): QueryCategory {
  const map: Partial<Record<ChatMode, QueryCategory>> = {
    general: "general", code: "code", translate: "translate", summarize: "summarize",
    debug: "debug", brainstorm: "brainstorm", image: "image", explain: "explain",
    creative: "creative", music: "music", research: "search",
  };
  return map[mode] || "general";
}

const WELCOME = "👋 Welcome back! Your neural workspace is ready. Ask anything or say \"what tools do you have?\"";

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription, isOffline } = useAuth();
  const { toast } = useToast();
  const e2ee = useE2EE();
  const { getOfflineSession } = useOfflineAuth();
  const offlineSession = getOfflineSession();

  const { isElite } = useFeatureGating();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackConversationCreated, trackImageGeneration } = useUsageTracking();

  const chatDb = useChatConversations(user?.id, e2ee, {
    onConversationCreated: () => trackConversationCreated(),
  });

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
  const [selectedFile, setSelectedFile] = useState<{ type: "image" | "file"; data: string; name: string; mimeType: string } | null>(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showCodeCanvas, setShowCodeCanvas] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [imageGenAuto, setImageGenAuto] = useState(false);
  const [deepResearchQuery, setDeepResearchQuery] = useState("");
  const [deepResearchAuto, setDeepResearchAuto] = useState(false);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | undefined>();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [liveAutoConnect, setLiveAutoConnect] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [showPersonalIDE, setShowPersonalIDE] = useState(false);
  const [ideCode, setIdeCode] = useState("");
  const [ideLanguage, setIdeLanguage] = useState("typescript");
  const [showCreativeSynthesis, setShowCreativeSynthesis] = useState(false);
  const [codeCanvasCode, setCodeCanvasCode] = useState("");
  const [codeCanvasLanguage, setCodeCanvasLanguage] = useState("typescript");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  currentConversationIdRef.current = currentConversationId;

  const speech = useChatSpeech();

  const openShadowTalkLive = useCallback((autoConnect = false) => {
    setLiveAutoConnect(autoConnect);
    setShowShadowTalkLive(true);
  }, []);

  const chatRouter = useChatToolRouter({
    openImageGenerator: (prompt, autoGenerate) => {
      setImageGenPrompt(prompt);
      setImageGenAuto(!!autoGenerate);
      setShowImageGenerator(true);
    },
    openDeepResearch: (query, autoResearch) => {
      setDeepResearchQuery(query);
      setDeepResearchAuto(!!autoResearch);
      setShowDeepResearch(true);
    },
    openShadowBrowser: (url) => {
      setBrowserInitialUrl(url);
      setShowShadowBrowser(true);
    },
    openShadowTalkLive: () => openShadowTalkLive(true),
    openAnalytics: () => setShowAnalytics(true),
    openCommandPalette: () => setShowCommandPalette(true),
    openCodeCanvas: () => setShowCodeCanvas(true),
    setChatMode: (mode) => setChatMode(mode as ChatMode),
  });

  useGeoLocation();

  const openConversation = useCallback(
    async (conversationId: string) => {
      setCurrentConversationId(conversationId);
      const loaded = await chatDb.loadMessages(conversationId);
      setMessages(
        loaded.length > 0
          ? loaded
          : [{ id: "welcome", type: "ai", content: WELCOME, timestamp: new Date() }]
      );
    },
    [chatDb]
  );

  const startNewChat = useCallback(async () => {
    const id = await chatDb.createConversation("New Chat");
    if (!id) return;
    const conv = { id, title: "New Chat", created_at: new Date().toISOString() };
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== id)]);
    setCurrentConversationId(id);
    setMessages([{ id: "welcome", type: "ai", content: WELCOME, timestamp: new Date() }]);
  }, [chatDb]);

  const bootstrapChat = useCallback(async () => {
    if (!user?.id || !e2ee.isUnlocked) return;
    setIsBootstrapping(true);
    try {
      const list = await chatDb.loadConversations();
      setConversations(list);
      if (list.length > 0) {
        await openConversation(list[0].id);
      } else {
        await startNewChat();
      }
      await checkSubscription();
      if (isElite) requestPermission();
    } finally {
      setIsBootstrapping(false);
    }
  }, [user?.id, e2ee.isUnlocked, chatDb, openConversation, startNewChat, checkSubscription, isElite, requestPermission]);

  useEffect(() => {
    if (user && e2ee.isUnlocked) {
      void bootstrapChat();
    }
  }, [user?.id, e2ee.isUnlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (currentConversationIdRef.current) return currentConversationIdRef.current;
    const id = await chatDb.createConversation("New Chat");
    if (!id) return null;
    const conv = { id, title: "New Chat", created_at: new Date().toISOString() };
    setConversations((prev) => [conv, ...prev]);
    setCurrentConversationId(id);
    if (messages.length === 0) {
      setMessages([{ id: "welcome", type: "ai", content: WELCOME, timestamp: new Date() }]);
    }
    return id;
  }, [chatDb, messages.length]);

  const saveMessage = useCallback(
    async (content: string, role: "user" | "assistant", isFirstUserMessage: boolean) => {
      const convId = currentConversationIdRef.current;
      if (!convId) return;
      await chatDb.saveMessage(convId, content, role, personality, {
        updateTitleFromContent: isFirstUserMessage && role === "user",
      });
    },
    [chatDb, personality]
  );

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const handleExportHistory = useCallback(() => {
    const exportable = messages.filter((m) => m.id !== "welcome");
    if (exportable.length === 0) {
      toast({ title: "Nothing to export", description: "Start a conversation first." });
      return;
    }
    const body = exportable
      .map((m) => `**${m.type === "user" ? "You" : "ShadowTalk"}** (${m.timestamp.toLocaleString()}):\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadowtalk-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Chat history downloaded." });
  }, [messages, toast]);

  const handleEditMessage = useCallback((index: number, content: string) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, content } : m)));
    toast({ title: "Message updated" });
  }, [toast]);

  const handleOpenCodeCanvas = useCallback((code: string, language: string) => {
    setCodeCanvasCode(code);
    setCodeCanvasLanguage(language || "typescript");
    setShowCodeCanvas(true);
  }, []);

  const handleOpenIDE = useCallback((code: string, language: string) => {
    setIdeCode(code);
    setIdeLanguage(language || "typescript");
    setShowPersonalIDE(true);
  }, []);

  const insertLiveTranscript = useCallback(
    async (markdown: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "ai", content: markdown, timestamp: new Date() },
      ]);
      await saveMessage(markdown, "assistant", false);
      toast({ title: "Live session saved to chat" });
    },
    [saveMessage, toast]
  );

  const handleCommandAction = useChatCommandActions({
    startNewChat,
    openDeepResearch: () => setShowDeepResearch(true),
    openImageGenerator: () => setShowImageGenerator(true),
    openShadowTalkLive,
    openShadowBrowser: () => setShowShadowBrowser(true),
    openAnalytics: () => setShowAnalytics(true),
    openCodeCanvas: () => setShowCodeCanvas(true),
    setChatMode,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleRegenerate = useCallback(
    async (index: number) => {
      const target = messages[index];
      if (!target || target.type !== "ai") return;
      const priorUser = [...messages].slice(0, index).reverse().find((m) => m.type === "user");
      if (!priorUser) return;

      setMessages((prev) => prev.filter((_, i) => i !== index));
      setIsLoading(true);
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const history = messages
        .slice(0, index)
        .filter((m) => m.id !== "welcome" && m.content)
        .map((m) => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));

      try {
        await chatRouter.runChatTurn({
          msgContent: priorUser.content,
          messages: history.map((h, i) => ({
            id: `h-${i}`,
            type: h.role === "user" ? "user" : "ai",
            content: h.content,
            timestamp: new Date(),
          })),
          personality,
          chatMode,
          onMessagesUpdate: (updater) => setMessages(updater),
          saveAssistant: (content) => saveMessage(content, "assistant", false),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast({ title: "Regenerate failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, chatRouter, personality, chatMode, saveMessage, toast]
  );

    const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isLoading) return;

    const convId = await ensureConversation();
    if (!convId) {
      toast({ title: "Cannot send", description: "Could not start a conversation.", variant: "destructive" });
      return;
    }

    const attachmentSnapshot = selectedFile;
    const msgContent = message.trim() || (attachmentSnapshot ? "[attachment]" : "");
    const isFirstUserTurn = messages.filter((m) => m.type === "user").length === 0;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: msgContent,
      timestamp: new Date(),
      attachment: attachmentSnapshot || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setSelectedFile(null);
    setIsLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await saveMessage(msgContent, "user", isFirstUserTurn);
    void trackChatMessage(
      chatModeToCategory(chatMode),
      personality,
      msgContent.length,
      !!attachmentSnapshot,
      attachmentSnapshot?.type
    );

    try {
      await chatRouter.runChatTurn({
        msgContent,
        messages: [...messages, userMessage],
        personality,
        chatMode,
        attachment: attachmentSnapshot
          ? { type: attachmentSnapshot.type, data: attachmentSnapshot.data, mimeType: attachmentSnapshot.mimeType }
          : undefined,
        onMessagesUpdate: (updater) => setMessages(updater),
        saveAssistant: (content) => saveMessage(content, "assistant", false),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "ai",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleUnlockE2EE = async () => {
    if (!e2eePassphrase) return;
    setIsUnlocking(true);
    const success = await e2ee.unlock(e2eePassphrase);
    setIsUnlocking(false);
    if (success) {
      setE2EEPassphrase("");
      await bootstrapChat();
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const ok = await chatDb.deleteConversation(id);
    if (!ok) return;
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (currentConversationId === id) {
      if (remaining.length > 0) await openConversation(remaining[0].id);
      else await startNewChat();
    }
  };

  if (!user && !isOffline && !offlineSession) {
    navigate("/auth");
    return null;
  }

  if (!e2ee.isUnlocked) {
    const isFirstSetup = !e2ee.isVaultConfigured;
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#1e1f20]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-2xl text-center">
          <div className="mx-auto w-20 h-20 mb-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">
            {isFirstSetup ? "Create Neural Vault" : "Neural Vault Locked"}
          </h1>
          <p className="text-muted-foreground/60 mb-10 leading-relaxed">
            {isFirstSetup
              ? "Choose a master passphrase to encrypt your chats. Store it safely — it cannot be recovered."
              : "Enter your master passphrase to unlock your encrypted workspace."}
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={e2eePassphrase}
              onChange={(e) => setE2EEPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlockE2EE()}
              placeholder={isFirstSetup ? "Create passphrase" : "Passphrase"}
              className="w-full h-16 bg-white/5 border border-white/10 rounded-[20px] px-6 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono tracking-widest"
            />
            <Button onClick={handleUnlockE2EE} disabled={isUnlocking || !e2eePassphrase} className="w-full h-16 rounded-[20px] bg-white text-black hover:bg-white/90 text-lg font-bold">
              {isUnlocking ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : isFirstSetup ? "Create & Enter Chat" : "Unlock Workspace"}
            </Button>
            <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] pt-6 flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" /> E2EE PROTECTED
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white/60" />
      </div>
    );
  }

  const isEmptyChat = messages.filter((m) => m.id !== "welcome").length === 0;
  const userDisplayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "G";

  const inputProps = {
    message,
    onMessageChange: setMessage,
    onSend: handleSendMessage,
    onKeyPress: (e: React.KeyboardEvent) => e.key === "Enter" && !e.shiftKey && handleSendMessage(),
    isLoading,
    isListening: speech.isListening,
    onToggleVoice: () => openShadowTalkLive(true),
    onOpenImageGenerator: () => setShowImageGenerator(true),
    onStopGeneration: handleStopGeneration,
    selectedFile,
    onFileSelect: setSelectedFile,
    chatMode,
    onModeChange: setChatMode,
    personality,
  };

  return (
    <motion.div className="min-h-screen neural-bg relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>{isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="neural-thinking-glow" />}</AnimatePresence>
      <div className="flex h-screen w-full relative z-10">
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={() => void startNewChat()}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setToolsMenuOpen(true)}
          onOpenSettings={() => navigate("/profile")}
        />
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 z-50 md:left-[72px]">
              <ConversationSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onCreateNew={() => { void startNewChat(); setShowSidebar(false); }}
                onSelect={(id) => { void openConversation(id); setShowSidebar(false); }}
                onDelete={(id) => void handleDeleteConversation(id)}
                onClearAll={async () => {
                  for (const c of [...conversations]) await handleDeleteConversation(c.id);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            userPlan={userPlan}
            personality={personality}
            onPersonalityChange={setPersonality}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onExport={handleExportHistory}
            onManageSubscription={() => navigate("/pricing")}
            onSignOut={signOut}
            onOpenAnalytics={() => setShowAnalytics(true)}
            onOpenDeepResearch={() => setShowDeepResearch(true)}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onOpenShadowTalkLive={() => openShadowTalkLive(true)}
            onOpenBrowser={() => setShowShadowBrowser(true)}
            onOpenScriptAutomation={() => navigate("/workspace")}
            onOpenStealthVault={() => navigate("/vault")}
            onOpenAgentWorkflows={() => navigate("/agents")}
            onOpenModelFineTuning={() => navigate("/personal-llm")}
            onOpenWhiteLabelBranding={() => navigate("/enterprise")}
            onOpenGeminiAnalytics={() => navigate("/analytics")}
            onOpenCanvas={(type) => {
              if (type === "code") setShowCodeCanvas(true);
              else setShowCreativeSynthesis(true);
            }}
            onOpenAgenticRunner={() => navigate("/missioncontrol")}
            onOpenVisualReasoning={() => setChatMode("camera")}
            onOpenCreativeSynthesis={() => setShowCreativeSynthesis(true)}
            toolsMenuOpen={toolsMenuOpen}
            onToolsMenuOpenChange={setToolsMenuOpen}
            aiProvider={aiProvider}
            onProviderChange={setAiProvider}
            maxChats="∞"
            dailyChats={dailyChats}
          />
          <div className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="home-centered-content">
                  <h1 className="text-5xl md:text-[4.5rem] font-bold text-white tracking-tight mb-8">Hello, {userDisplayName}.</h1>
                  <div className="w-full max-w-2xl px-4">
                    <ChatInput {...inputProps} />
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col overflow-hidden">
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    showSuggestions={false}
                    personality={personality}
                    userPlan={userPlan}
                    speakingMessageId={speech.speakingMessageId}
                    isSpeaking={speech.isSpeaking}
                    onSelectPrompt={setMessage}
                    onEdit={handleEditMessage}
                    onRegenerate={(i) => void handleRegenerate(i)}
                    onTextToSpeech={(text, id) => speech.speakMessage(text, id)}
                    onOpenCodeCanvas={handleOpenCodeCanvas}
                    onOpenIDE={handleOpenIDE}
                    onOpenInBrowser={(url) => { setBrowserInitialUrl(url); setShowShadowBrowser(true); }}
                    messagesEndRef={messagesEndRef}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && (
            <div className="p-4 max-w-4xl mx-auto w-full">
              <ChatInput {...inputProps} />
            </div>
          )}
        </div>
      </div>
      {showImageGenerator && (
        <ImageGenerator
          initialPrompt={imageGenPrompt}
          autoGenerate={imageGenAuto}
          onClose={() => { setShowImageGenerator(false); setImageGenPrompt(""); setImageGenAuto(false); }}
          onImageGenerated={(url, prompt) => {
            void trackImageGeneration(prompt);
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), type: "ai", content: `🎨 ${prompt}`, timestamp: new Date(), imageUrl: url },
            ]);
          }}
        />
      )}
      {showDeepResearch && (
        <DeepResearchPanel
          isOpen={showDeepResearch}
          initialQuery={deepResearchQuery}
          autoResearch={deepResearchAuto}
          onClose={() => { setShowDeepResearch(false); setDeepResearchQuery(""); setDeepResearchAuto(false); }}
          onInsertToChat={(c) =>
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: "ai", content: c, timestamp: new Date() }])
          }
        />
      )}
      {showAnalytics && (
        <AnalyticsDashboard
          onClose={() => setShowAnalytics(false)}
          messageCount={messages.length}
          conversationCount={conversations.length}
        />
      )}
      <ShadowBrowser
        isOpen={showShadowBrowser}
        initialUrl={browserInitialUrl}
        onClose={() => { setShowShadowBrowser(false); setBrowserInitialUrl(undefined); }}
        onInsertToChat={(c) =>
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: "ai", content: c, timestamp: new Date() }])
        }
      />
      <ShadowTalkLive
        isOpen={showShadowTalkLive}
        autoConnect={liveAutoConnect}
        onClose={() => {
          setShowShadowTalkLive(false);
          setLiveAutoConnect(false);
        }}
        onInsertToChat={(c) => void insertLiveTranscript(c)}
        onSessionEnd={(md) => void insertLiveTranscript(md)}
      />
      {showCodeCanvas && (
        <CodeCanvas
          code={codeCanvasCode || "// Generate code in chat, then open Code Canvas"}
          language={codeCanvasLanguage}
          onClose={() => setShowCodeCanvas(false)}
        />
      )}
      {showPersonalIDE && (
        <PersonalIDE initialCode={ideCode} language={ideLanguage} onClose={() => setShowPersonalIDE(false)} />
      )}
      {showCreativeSynthesis && (
        <CreativeSynthesis
          isOpen={showCreativeSynthesis}
          onClose={() => setShowCreativeSynthesis(false)}
          onInsertToChat={(c) =>
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: "ai", content: c, timestamp: new Date() }])
          }
        />
      )}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onAction={handleCommandAction} />
    </motion.div>
  );
};

export default ChatbotPage;
