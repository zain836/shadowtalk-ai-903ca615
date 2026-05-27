import { useState, useEffect, useRef, useCallback, useContext } from "react";
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
import { AgenticTaskRunner } from "@/components/chat/AgenticTaskRunner";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { GeminiLiveMode } from "@/components/chat/GeminiLiveMode";
import { ShareDialog } from "@/components/chat/ShareDialog";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useE2EE } from "@/hooks/useE2EE";
import { useAgenticToolDispatch } from "@/hooks/useAgenticToolDispatch";
import { buildAgenticChatBody, consumeChatSSE } from "@/lib/agenticChatStream";
import { AGENTIC_STARTER_PROMPTS, AGENTIC_MODE_LABEL } from "@/lib/agenticPrompts";
import { CHAT_EMPTY_HEADLINE, pickChatWelcome } from "@/lib/brand";
import { saveTextWithDialog } from "@/lib/desktopBridge";
import { CommandPaletteContext } from "@/App";
import { Shield, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ToolType } from "@/hooks/useToolOrchestrator";
import { executeShadowTool } from "@/lib/shadowTools";
import { trackAgenticEvent } from "@/lib/agenticMetrics";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { runLocalChat, isAnyLocalModelReady, getActiveLocalTier } from "@/lib/offline/localChat";
import { OfflineBootstrapBanner, OfflineReadyBadge } from "@/components/offline/OfflineBootstrapBanner";
import type { RouterMessage } from "@/lib/offline/hybridRouter";

interface Message {
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

type Conversation = { id: string; title: string; created_at: string };
type Personality =
  | "friendly" | "sarcastic" | "professional" | "creative" | "meticulous"
  | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription, isOffline } = useAuth();
  const { toast } = useToast();
  const e2ee = useE2EE();
  const { open: openGlobalPalette } = useContext(CommandPaletteContext);
  const { dispatchDetection } = useAgenticToolDispatch();
  const gemmaOffline = useGemmaOffline();
  const [localTier, setLocalTier] = useState<"smollm" | "gemma" | null>(null);
  const { requestPermission } = usePushNotifications();
  const { getOfflineSession } = useOfflineAuth();
  const { isElite } = useFeatureGating();

  const [e2eePassphrase, setE2EEPassphrase] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [personality, setPersonality] = useState<Personality>("friendly");
  const [chatMode, setChatMode] = useState<ChatMode>("agent");
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
  const [deepResearchSeed, setDeepResearchSeed] = useState("");
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAgenticRunner, setShowAgenticRunner] = useState(false);
  const [agenticGoal, setAgenticGoal] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imagePromptRef = useRef("");

  useGeoLocation();

  const appendAssistant = useCallback(
    (content: string, toolExecution?: Message["toolExecution"]) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "ai",
          content,
          timestamp: new Date(),
          toolExecution,
        },
      ]);
    },
    []
  );

  const toolUi = useCallback(
    () => ({
      openDeepResearch: (query?: string) => {
        if (query) setDeepResearchSeed(query);
        setShowDeepResearch(true);
      },
      openImageGenerator: () => setShowImageGenerator(true),
      openAgenticRunner: (goal: string) => {
        setAgenticGoal(goal);
        setShowAgenticRunner(true);
      },
      openBrowser: () => setShowShadowBrowser(true),
      openShadowLive: () => setShowShadowTalkLive(true),
      openMissionControl: () => navigate("/missioncontrol"),
      setPendingMessage: (text: string) => {
        imagePromptRef.current = text;
      },
      appendAssistantMessage: appendAssistant,
    }),
    [appendAssistant, navigate]
  );

  const streamChat = useCallback(
    async (msgContent: string, flags?: {
      webSearch?: boolean;
      searchQuery?: string;
      deepResearch?: boolean;
      researchQuery?: string;
      decodeImage?: boolean;
      imageDataUrl?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: (m.type === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));
      history.push({ role: "user", content: msgContent });

      const body = buildAgenticChatBody(history, {
        personality,
        mode: chatMode,
        agenticSystemHint: chatMode === "agent",
        webSearch: flags?.webSearch,
        searchQuery: flags?.searchQuery,
        deepResearch: flags?.deepResearch,
        researchQuery: flags?.researchQuery,
        decodeImage: flags?.decodeImage,
        imageDataUrl: flags?.imageDataUrl ?? selectedFile?.data,
      });

      abortControllerRef.current?.abort();
      trackAgenticEvent("chat_stream_start", { mode: chatMode });

      abortControllerRef.current = new AbortController();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) throw new Error("Chat request failed");

      const aiMessageId = crypto.randomUUID();
      let assistantContent = "";

      const final = await consumeChatSSE(resp, (accumulated) => {
        assistantContent = accumulated;
        setMessages((prev) => {
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
      });

      if (final) {
        await saveMessage(final, "assistant");
        trackAgenticEvent("chat_stream_complete", { mode: chatMode });
      }
      return final;
    },
    [messages, personality, chatMode, selectedFile]
  );


  const streamLocalChat = useCallback(
    async (routerMessages: RouterMessage[]) => {
      const aiMessageId = crypto.randomUUID();
      let assistantContent = "";

      const { content, tier } = await runLocalChat(routerMessages, (delta) => {
        assistantContent += delta;
        setMessages((prev) => {
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
              type: "ai" as const,
              content: assistantContent,
              timestamp: new Date(),
            },
          ];
        });
      });

      setLocalTier(tier === "none" ? null : tier);
      if (content) await saveMessage(content, "assistant");
      trackAgenticEvent("chat_stream_complete", { mode: chatMode, source: "local", tier });
      return content;
    },
    [chatMode, messages, saveMessage]
  );

  const updateMessageTool = useCallback(
    (messageId: string, patch: Partial<NonNullable<Message["toolExecution"]>>) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.toolExecution
            ? { ...m, toolExecution: { ...m.toolExecution, ...patch } }
            : m
        )
      );
    },
    []
  );

  const handleConfirmTool = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg?.toolExecution || msg.toolExecution.status !== "confirm") return;

      const tool = msg.toolExecution.tool as ToolType;
      const params = msg.toolExecution.params;
      updateMessageTool(messageId, { status: "running" });
      trackAgenticEvent("tool_confirmed", { tool });
      trackAgenticEvent("tool_run", { tool, source: "hitl" });

      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const result = await executeShadowTool(
          tool,
          params,
          params?.query || msg.content,
          { accessToken: session?.access_token, personality, mode: chatMode }
        );

        if (result.kind === "inline") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: result.content,
                    toolExecution: {
                      ...m.toolExecution!,
                      status: "complete",
                      result: result.content.slice(0, 300),
                    },
                  }
                : m
            )
          );
          trackAgenticEvent("tool_complete", { tool });
        } else if (result.kind === "chat_flags") {
          const flags = result.flags as {
            webSearch?: boolean;
            searchQuery?: string;
            deepResearch?: boolean;
            researchQuery?: string;
          };
          await streamChat(params?.query || "Continue", flags);
          updateMessageTool(messageId, { status: "complete" });
        } else if (result.kind === "ui" && result.path) {
          navigate(result.path);
          updateMessageTool(messageId, { status: "complete", result: result.message });
        }
      } catch {
        updateMessageTool(messageId, { status: "error" });
        trackAgenticEvent("tool_error", { tool });
        toast({ title: "Tool failed", description: "Could not run tool. Try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, personality, chatMode, navigate, streamChat, toast, updateMessageTool]
  );

  const handleCancelTool = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);


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
          content: `👋 ${pickChatWelcome(0)}`,
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      if (decryptedData.length > 0 && !currentConversationId) {
        loadConversation(decryptedData[0].id);
      }
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
            if (unwrapped) {
              content =
                (await e2ee.decryptData(unwrapped.data, unwrapped.iv)) ||
                "[DECRYPTION_FAILED]";
            }
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

  const getWelcomeMessage = () =>
    `👋 ${pickChatWelcome()} Your agentic workspace is ready — ask for a plan, research, or say "run this for me".`;

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

    const msgContent =
      message.trim() ||
      (selectedFile?.type === "file" ? `[Attached: ${selectedFile.name}]` : "Analyze this image");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: msgContent,
      timestamp: new Date(),
      attachment: selectedFile || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    const fileSnapshot = selectedFile;
    setSelectedFile(null);
    setIsLoading(true);
    await saveMessage(msgContent, "user");

    try {
      const outcome = dispatchDetection(msgContent, toolUi());
      if (outcome.handled) trackAgenticEvent("tool_run", { source: "dispatch" });
      if (outcome.handled) {
        return;
      }

      const routerMessages: RouterMessage[] = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: (m.type === "user" ? "user" : "assistant") as RouterMessage["role"],
          content: m.content,
        }));
      routerMessages.push({ role: "user", content: msgContent });

      const routeDecision = gemmaOffline.route(routerMessages);

      if (routeDecision.target === "local") {
        if (!isAnyLocalModelReady()) {
          appendAssistant(
            "📴 **Offline AI not installed yet.** Use the banner above to install the included on-device model (~130 MB), or open **Profile → Offline AI** for Gemma."
          );
          return;
        }
        trackAgenticEvent("chat_stream_start", { mode: chatMode, source: "local" });
        await streamLocalChat(routerMessages);
        return;
      }

      if (!gemmaOffline.isOnline && !isAnyLocalModelReady()) {
        appendAssistant(
          "You're offline and no on-device model is loaded. Install offline AI when you're back online."
        );
        return;
      }

      await streamChat(msgContent, outcome.chatFlags);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        appendAssistant(
          "Connection issue — retry in a moment. For heavy missions, try **Mission Control** (⌘K → missions)."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleCommandAction = (action: string) => {
    setShowCommandPalette(false);
    switch (action) {
      case "agentic":
        setAgenticGoal("");
        setShowAgenticRunner(true);
        break;
      case "missions":
        navigate("/missioncontrol");
        break;
      case "deep-research":
        setShowDeepResearch(true);
        break;
      case "image":
        setShowImageGenerator(true);
        break;
      case "browser":
        setShowShadowBrowser(true);
        break;
      case "voice":
        setShowShadowTalkLive(true);
        break;
      case "new-chat":
        setCurrentConversationId(null);
        setMessages([]);
        break;
      case "analytics":
        navigate("/analytics");
        break;
      default:
        toast({ title: "Tool", description: `Use chat or visit /workspace for "${action}".` });
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

  const handleExport = async () => {
    const md = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => `### ${m.type === "user" ? "You" : "ShadowTalk"}\n\n${m.content}\n`)
      .join("\n");
    const saved = await saveTextWithDialog("shadowtalk-chat.md", md);
    if (saved) {
      toast({ title: "Exported", description: saved });
    } else {
      setShowExportDialog(true);
    }
  };

  const noop = () => {};

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
          <div className="mx-auto w-20 h-20 mb-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Neural Vault Locked</h1>
          <p className="text-muted-foreground/60 mb-10 leading-relaxed">
            Unlock to use ShadowTalk&apos;s agentic workspace (E2E encrypted).
          </p>
          <div className="space-y-4">
            <input
              type="password"
              value={e2eePassphrase}
              onChange={(e) => setE2EEPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlockE2EE()}
              placeholder="Passphrase"
              className="w-full h-16 bg-white/5 border border-white/10 rounded-[20px] px-6 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono tracking-widest"
            />
            <Button
              onClick={handleUnlockE2EE}
              disabled={isUnlocking || !e2eePassphrase}
              className="w-full h-16 rounded-[20px] bg-white text-black hover:bg-white/90 text-lg font-bold"
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

  const headerProps = {
    userPlan,
    personality,
    onPersonalityChange: setPersonality,
    onToggleSidebar: () => setShowSidebar(!showSidebar),
    onExport: handleExport,
    onManageSubscription: () => navigate("/billing"),
    onSignOut: signOut,
    onOpenAnalytics: () => navigate("/analytics"),
    onOpenScriptAutomation: () => navigate("/workspace"),
    onOpenStealthVault: () => navigate("/vault"),
    onOpenAgentWorkflows: () => navigate("/workspace"),
    onOpenModelFineTuning: noop,
    onOpenWhiteLabelBranding: noop,
    onOpenGeminiAnalytics: () => navigate("/analytics"),
    onOpenCanvas: () => navigate("/workspace"),
    onOpenDeepResearch: () => setShowDeepResearch(true),
    onOpenAgenticRunner: () => setShowAgenticRunner(true),
    onOpenVisualReasoning: noop,
    onOpenCreativeSynthesis: () => navigate("/studio"),
    onOpenImageGenerator: () => setShowImageGenerator(true),
    onOpenShadowTalkLive: () => setShowShadowTalkLive(true),
    onOpenBrowser: () => setShowShadowBrowser(true),
    aiProvider,
    onProviderChange: setAiProvider,
    maxChats: "∞",
    dailyChats: 0,
    toolsMenuOpen,
    onToolsMenuOpenChange: setToolsMenuOpen,
  };

  return (
    <motion.div
      className="min-h-screen neural-bg relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

      <div className="flex h-screen w-full relative z-10">
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={() => {
            setCurrentConversationId(null);
            setMessages([]);
          }}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setShowCommandPalette(true)}
          onOpenSettings={() => navigate("/profile")}
        />

        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
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
                onDelete={noop}
                onClearAll={noop}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-center gap-2 py-1.5 border-b border-white/5 bg-black/20">
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
              {AGENTIC_MODE_LABEL} workspace
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              ⌘K tools · agents execute, not just chat
            </span>
          </div>

          <ChatHeader {...headerProps} />

          <div
            className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}
          >
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="home-centered-content px-4"
                >
                  <h1 className="text-4xl md:text-[3.5rem] font-bold text-white tracking-tight mb-2">
                    Hello, {userDisplayName}.
                  </h1>
                  <p className="text-lg text-muted-foreground/80 mb-8 max-w-xl mx-auto">
                    {CHAT_EMPTY_HEADLINE}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto">
                    {AGENTIC_STARTER_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMessage(p)}
                        className="text-xs px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-left"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="w-full max-w-2xl mx-auto">
                    <ChatInput
                      message={message}
                      onMessageChange={setMessage}
                      onSend={handleSendMessage}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      isLoading={isLoading}
                      isListening={isListening}
                      onToggleVoice={() => setShowShadowTalkLive(true)}
                      onOpenImageGenerator={() => setShowImageGenerator(true)}
                      onStopGeneration={handleStopGeneration}
                      selectedFile={selectedFile}
                      onFileSelect={setSelectedFile}
                      chatMode={chatMode}
                      onModeChange={setChatMode}
                      personality={personality}
                    />
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
                    speakingMessageId={speakingMessageId}
                    isSpeaking={isSpeaking}
                    onSelectPrompt={setMessage}
                    onEdit={noop}
                    onRegenerate={noop}
                    onTextToSpeech={(text, id) => {
                      setSpeakingMessageId(id);
                      setIsSpeaking(true);
                    }}
                    onOpenCodeCanvas={noop}
                    onOpenIDE={noop}
                    onOpenInBrowser={() => setShowShadowBrowser(true)}
                    onConfirmTool={handleConfirmTool}
                    onCancelTool={handleCancelTool}
                    messagesEndRef={messagesEndRef}
                    thinkingStage={isLoading ? "reasoning" : null}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {!isEmptyChat && (
            <div className="p-4 max-w-4xl mx-auto w-full">
              <ChatInput
                message={message}
                onMessageChange={setMessage}
                onSend={handleSendMessage}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                isLoading={isLoading}
                isListening={isListening}
                onToggleVoice={() => setShowShadowTalkLive(true)}
                onOpenImageGenerator={() => setShowImageGenerator(true)}
                onStopGeneration={handleStopGeneration}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                chatMode={chatMode}
                onModeChange={setChatMode}
                personality={personality}
              />
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
                content: "Generated image",
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

      <AgenticTaskRunner
        isOpen={showAgenticRunner}
        onClose={() => setShowAgenticRunner(false)}
        initialGoal={agenticGoal}
        autoStart={!!agenticGoal}
        onTaskComplete={(result) => {
          appendAssistant(`**Agent run complete**\n\n${result}`);
          setShowAgenticRunner(false);
        }}
      />

      <Dialog open={showShadowBrowser} onOpenChange={setShowShadowBrowser}>
        <DialogContent className="max-w-6xl h-[85vh] p-0 overflow-hidden">
          <ShadowBrowser onClose={() => setShowShadowBrowser(false)} />
        </DialogContent>
      </Dialog>

      {showShadowTalkLive && (
        <GeminiLiveMode isOpen={showShadowTalkLive} onClose={() => setShowShadowTalkLive(false)} />
      )}

      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onAction={handleCommandAction}
      />

      <ShareDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        messages={messages}
        conversationTitle={conversations.find((c) => c.id === currentConversationId)?.title}
      />
    </motion.div>
  );
};

export default ChatbotPage;
