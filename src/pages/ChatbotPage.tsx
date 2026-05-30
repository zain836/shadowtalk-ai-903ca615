import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMode } from "@/components/chat/ModeSelector";
import { AIProvider } from "@/components/chat/ProviderSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatToolbar } from "@/components/chat/ChatToolbar";
import { ChatIconRail } from "@/components/chat/ChatIconRail";
import { ChatShadowSidebar } from "@/components/chat/ChatShadowSidebar";
import { ShadowTalkOrb } from "@/components/chat/ShadowTalkOrb";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ImageGenerator } from "@/components/chat/ImageGenerator";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { MissionControl } from "@/components/chat/MissionControl";

const ShadowTalkLive = lazy(() =>
  import("@/components/chat/ShadowTalkLive").then((m) => ({ default: m.ShadowTalkLive })),
);
const ShadowBrowser = lazy(() =>
  import("@/components/chat/ShadowBrowser").then((m) => ({ default: m.ShadowBrowser })),
);
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineChatHistory } from "@/hooks/useOfflineChatHistory";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useGuestUsage, GUEST_LIMITS } from "@/hooks/useGuestUsage";
import { useToolOrchestrator } from "@/hooks/useToolOrchestrator";
import { Loader2 } from "lucide-react";
import { useShadowMemoryContext } from "@/contexts/ShadowMemoryContext";
import { useIntelligenceHub } from "@/hooks/useIntelligenceHub";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { useCustomApiKeys } from "@/hooks/useCustomApiKeys";
import { stringifyChatBody } from "@/lib/chatRequest";
import { useAutoBrowse } from "@/components/chat/BrowseActivityPanel";
// Types
interface Message { 
  id: string; 
  type: "user" | "ai"; 
  content: string; 
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string;
}
type Conversation = { id: string; title: string; created_at: string };
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

/** Legacy E2EE payloads stored before vault unlock was removed from chat */
function displayStoredText(raw: string): string {
  if (raw.startsWith("e2e:")) return "[Encrypted message]";
  return raw;
}

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription, isOffline, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Hooks
  const { checkAccess, isElite } = useFeatureGating();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackConversationCreated } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const toolOrchestrator = useToolOrchestrator();
  const gemmaOffline = useGemmaOffline();
  const { aiConfig, hasVerifiedKey } = useCustomApiKeys();
  
  // State
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
  const [selectedFile, setSelectedFile] = useState<{ type: 'image' | 'file'; data: string; name: string; mimeType: string } | null>(null);
  
  // Modals
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useGeoLocation();

  useEffect(() => {
    const offlineSession = getOfflineSession();
    if (user || offlineSession) {
      loadConversations();
      checkSubscription();
      if (isElite) requestPermission();
    } else if (!user && !offlineSession && !isOffline) {
      const guestConvId = 'guest-' + Date.now();
      setCurrentConversationId(guestConvId);
      setMessages([{ 
        id: 'welcome', 
        type: 'ai', 
        content: `👋 Welcome to ShadowTalk AI! Your neural workspace is ready for guest access.`, 
        timestamp: new Date() 
      }]);
      setConversations([{ id: guestConvId, title: 'Guest Conversation', created_at: new Date().toISOString() }]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const offlineSession = getOfflineSession();

  useEffect(() => {
    if (!authLoading && !user && !offlineSession && !isOffline) {
      navigate("/auth");
    }
  }, [authLoading, user, offlineSession, isOffline, navigate]);

  const loadConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (data && !error) {
      const rows = data.map((c) => ({
        ...c,
        title: displayStoredText(c.title || 'Untitled'),
      }));
      setConversations(rows);
      if (rows.length > 0 && !currentConversationId) {
        loadConversation(rows[0].id);
      } else if (rows.length === 0) {
        setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
      }
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data && !error) {
      const loadedMessages: Message[] = data.map((m) => ({
        id: m.id,
        type: m.role === 'user' ? 'user' : 'ai',
        content: displayStoredText(m.content),
        timestamp: new Date(m.created_at),
      }));
      setMessages(loadedMessages.length === 0 ? [{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }] : loadedMessages);
    }
  };

  const getWelcomeMessage = () => {
    return "👋 Welcome back! Your neural workspace is ready.";
  };

  const welcomeMessage = (): Message => ({
    id: "welcome",
    type: "ai",
    content: getWelcomeMessage(),
    timestamp: new Date(),
  });

  const isGuestConversationId = (id: string | null) =>
    !!id && (id.startsWith("guest-") || !user);

  const resetToNewChat = () => {
    setCurrentConversationId(null);
    setMessages([welcomeMessage()]);
    setMessage("");
    setSelectedFile(null);
  };

  const handleNewChat = () => {
    resetToNewChat();
    setShowSidebar(false);
    toast({ title: "New chat", description: "Started a fresh conversation." });
  };

  const handleClearCurrentChat = async () => {
    const convId = currentConversationId;
    if (!convId) {
      resetToNewChat();
      return;
    }

    if (isGuestConversationId(convId)) {
      resetToNewChat();
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      const guestConvId = `guest-${Date.now()}`;
      setCurrentConversationId(guestConvId);
      setConversations([{ id: guestConvId, title: "Guest Conversation", created_at: new Date().toISOString() }]);
      toast({ title: "Chat cleared" });
      return;
    }

    if (!user) return;

    const { error: msgError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", convId)
      .eq("user_id", user.id);

    if (msgError) {
      const { error: convError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", convId)
        .eq("user_id", user.id);
      if (convError) {
        toast({ title: "Could not clear chat", description: convError.message, variant: "destructive" });
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      resetToNewChat();
    } else {
      await supabase
        .from("conversations")
        .update({ title: "New Chat", updated_at: new Date().toISOString() })
        .eq("id", convId)
        .eq("user_id", user.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: "New Chat" } : c)),
      );
      setMessages([welcomeMessage()]);
    }

    toast({ title: "Chat cleared", description: "Messages in this conversation were removed." });
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (isGuestConversationId(conversationId)) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentConversationId === conversationId) resetToNewChat();
      return;
    }

    if (!user) return;

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    const wasActive = currentConversationId === conversationId;
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== conversationId);
      if (wasActive) {
        if (next.length > 0) {
          void loadConversation(next[0].id);
        } else {
          resetToNewChat();
        }
      }
      return next;
    });
    toast({ title: "Conversation deleted" });
  };

  const handleClearAllChats = async () => {
    if (!user) {
      const guestConvId = `guest-${Date.now()}`;
      setConversations([{ id: guestConvId, title: "Guest Conversation", created_at: new Date().toISOString() }]);
      setCurrentConversationId(guestConvId);
      setMessages([
        {
          id: "welcome",
          type: "ai",
          content: "👋 Welcome to ShadowTalk AI! Your neural workspace is ready for guest access.",
          timestamp: new Date(),
        },
      ]);
      setShowSidebar(false);
      toast({ title: "All chats cleared" });
      return;
    }

    const { error } = await supabase.from("conversations").delete().eq("user_id", user.id);

    if (error) {
      toast({ title: "Could not delete chats", description: error.message, variant: "destructive" });
      return;
    }

    setConversations([]);
    resetToNewChat();
    setShowSidebar(false);
    toast({ title: "All chats deleted", description: "Your conversation history was cleared." });
  };

  const ensureConversation = async (): Promise<string | null> => {
    if (!user) return currentConversationId;
    if (currentConversationId) return currentConversationId;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Chat' })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Could not start chat", description: "Try again in a moment.", variant: "destructive" });
      return null;
    }

    setCurrentConversationId(data.id);
    setConversations((prev) => [
      { id: data.id, title: data.title || 'New Chat', created_at: data.created_at },
      ...prev,
    ]);
    return data.id;
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant', conversationId: string) => {
    if (!user || !conversationId) return null;

    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: user.id, content, role, personality })
      .select().single();
    
    if (role === 'user' && messages.length <= 1) {
      const title = content.trim().split(/\s+/).slice(0, 3).join(' ').slice(0, 25) || 'New Chat';
      await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
    }
    return data;
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isLoading) return;

    const conversationId = user ? await ensureConversation() : currentConversationId;
    if (!conversationId) return;

    const msgContent = message;
    const userMessage: Message = { id: crypto.randomUUID(), type: "user", content: msgContent, timestamp: new Date(), attachment: selectedFile || undefined };
    setMessages(prev => [...prev, userMessage]);
    setMessage(""); setSelectedFile(null); setIsLoading(true);
    if (user) await saveMessage(msgContent, 'user', conversationId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const chatMessages = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: msgContent });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: stringifyChatBody({
          messages: chatMessages,
          personality,
          mode: chatMode,
          ...(aiConfig.useCustomKey && aiConfig.preferredProvider
            ? { useCustomApiKey: true, aiProvider: aiConfig.preferredProvider }
            : {}),
        }),
      });

      if (!resp.ok) {
        let detail = "Chat request failed";
        try {
          const errJson = await resp.json();
          detail = typeof errJson.error === "string" ? errJson.error : detail;
        } catch {
          detail = (await resp.text().catch(() => "")) || detail;
        }
        throw new Error(detail);
      }

      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        let detail = "Unexpected response from chat service";
        try {
          const json = await resp.json();
          detail = typeof json.error === "string" ? json.error : detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();
      let assistantContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const exists = prev.find(m => m.id === aiMessageId);
                  if (exists) return prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : m);
                  return [...prev, { id: aiMessageId, type: 'ai', content: assistantContent, timestamp: new Date() }];
                });
              }
            } catch {}
          }
        }
      }
      if (assistantContent && user) await saveMessage(assistantContent, 'assistant', conversationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error connecting to chat service.";
      toast({ title: "Message failed", description: msg, variant: "destructive" });
      setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: msg, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !offlineSession && !isOffline) {
    return null;
  }

  const isEmptyChat = messages.filter((m) => m.id !== "welcome").length === 0;
  const hasActiveChat = messages.some((m) => m.id !== "welcome");
  const userDisplayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "G";

  const handleExport = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        conversationId: currentConversationId,
        personality,
        mode: chatMode,
        messages: messages.map((m) => ({
          role: m.type,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shadowtalk-history-${currentConversationId || "chat"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Downloaded chat history JSON." });
    } catch {
      toast({ title: "Export failed", description: "Could not export chat history.", variant: "destructive" });
    }
  };

  const handleCommandAction = (action: string) => {
    setShowCommandPalette(false);
    switch (action) {
      case "new-chat":
        handleNewChat();
        return;
      case "deep-research":
        setShowDeepResearch(true);
        return;
      case "image":
        setShowImageGenerator(true);
        return;
      case "voice":
        setShowShadowTalkLive(true);
        return;
      case "browser":
        setShowShadowBrowser(true);
        return;
      case "analytics":
        navigate("/analytics");
        return;
      case "custom-instructions":
      case "gemini-analytics":
        navigate("/profile");
        return;
      case "missions":
        setShowMissionControl(true);
        return;
      case "vault":
        navigate("/vault");
        return;
      default:
        return;
    }
  };

  const chatInputProps = {
    message,
    onMessageChange: setMessage,
    onSend: handleSendMessage,
    onKeyPress: (e: React.KeyboardEvent) => e.key === "Enter" && handleSendMessage(),
    isLoading,
    isListening,
    onToggleVoice: () => setShowShadowTalkLive(true),
    onOpenImageGenerator: () => setShowImageGenerator(true),
    onStopGeneration: () => {},
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
    <div className="shadowtalk-chat-shell min-h-screen neural-bg">
      <div className="shadowtalk-chat-glow" aria-hidden />
      <motion.div
        className="shadowtalk-chat-main flex h-screen w-full relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ChatShadowSidebar
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          onNewChat={handleNewChat}
          onOpenHistory={() => setShowSidebar(true)}
        />
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={handleNewChat}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setToolsMenuOpen(true)}
          onOpenSettings={() => navigate("/profile")}
        />
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.button
                type="button"
                aria-label="Close history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:left-[240px]"
                onClick={() => setShowSidebar(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="fixed left-0 top-0 bottom-0 z-50 md:left-[240px]"
              >
                <ConversationSidebar
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onCreateNew={handleNewChat}
                  onSelect={(id) => {
                    loadConversation(id);
                    setShowSidebar(false);
                  }}
                  onDelete={handleDeleteConversation}
                  onClearAll={handleClearAllChats}
                  onClearCurrent={handleClearCurrentChat}
                  onClose={() => setShowSidebar(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0 bg-background/40 backdrop-blur-[2px]">
          <p className="shadowtalk-chat-top-label hidden md:block">ShadowTalk AI</p>
          <ChatToolbar
            hasActiveChat={hasActiveChat}
            conversationCount={conversations.length}
            onNewChat={handleNewChat}
            onOpenHistory={() => setShowSidebar(true)}
            onClearChat={handleClearCurrentChat}
            onDeleteAllChats={handleClearAllChats}
          />
          <ChatHeader
            variant="minimal"
            userPlan={userPlan}
            personality={personality}
            onPersonalityChange={setPersonality}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onExport={handleExport}
            onManageSubscription={() => navigate("/billing")}
            onSignOut={signOut}
            onOpenAnalytics={() => navigate("/analytics")}
            onOpenScriptAutomation={() => navigate("/workspace")}
            onOpenStealthVault={() => navigate("/vault")}
            onOpenAgentWorkflows={() => navigate("/workspace")}
            onOpenModelFineTuning={() => navigate("/workspace")}
            onOpenWhiteLabelBranding={() => navigate("/workspace")}
            onOpenGeminiAnalytics={() => navigate("/profile")}
            onOpenCanvas={() => navigate("/workspace")}
            onOpenDeepResearch={() => setShowDeepResearch(true)}
            onOpenAgenticRunner={() => setShowMissionControl(true)}
            onOpenVisualReasoning={() => setShowCommandPalette(true)}
            onOpenCreativeSynthesis={() => navigate("/studio")}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onOpenShadowTalkLive={() => setShowShadowTalkLive(true)}
            onOpenBrowser={() => setShowShadowBrowser(true)}
            aiProvider={aiProvider}
            onProviderChange={setAiProvider}
            maxChats="∞"
            dailyChats={dailyChats}
            toolsMenuOpen={toolsMenuOpen}
            onToolsMenuOpenChange={setToolsMenuOpen}
          />
          <div className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shadowtalk-chat-empty"
                >
                  <ShadowTalkOrb />
                  <h1 className="shadowtalk-chat-greeting">
                    Hello, <span className="gradient-text">{userDisplayName}</span>
                  </h1>
                  <p className="shadowtalk-chat-tagline">Think AI. Think ShadowTalk.</p>
                  {hasVerifiedKey && aiConfig.useCustomKey && (
                    <p className="text-[10px] text-muted-foreground/60 mt-2 tracking-wide">
                      {aiConfig.preferredProvider} API connected
                    </p>
                  )}
                  <div className="shadowtalk-chat-input-shell w-full">
                    <div className="shadowtalk-chat-input-inner">
                      <ChatInput {...chatInputProps} isEmptyState />
                    </div>
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
                    onEdit={() => {}}
                    onRegenerate={() => {}}
                    onTextToSpeech={() => {}}
                    onOpenCodeCanvas={() => {}}
                    onOpenIDE={() => {}}
                    onOpenInBrowser={() => { setShowShadowBrowser(true); }}
                    messagesEndRef={messagesEndRef}
                    layout="gemini"
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && (
            <div className="shadowtalk-chat-input-dock">
              <div className="shadowtalk-chat-input-shell w-full">
                <div className="shadowtalk-chat-input-inner">
                  <ChatInput {...chatInputProps} />
                </div>
              </div>
            </div>
          )}
        </div>
      {showImageGenerator && <ImageGenerator onClose={() => setShowImageGenerator(false)} onImageGenerated={(url) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: '🎨 Generated image', timestamp: new Date(), imageUrl: url }])} />}
      {showDeepResearch && <DeepResearchPanel isOpen={showDeepResearch} onClose={() => setShowDeepResearch(false)} onInsertToChat={(c) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: c, timestamp: new Date() }])} />}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onAction={handleCommandAction} />
      {showMissionControl && (
        <MissionControl
          isOpen={showMissionControl}
          onClose={() => setShowMissionControl(false)}
          onMissionComplete={(result) => {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), type: "ai", content: `✅ S.E.E. mission deliverable:\n\n${result}`, timestamp: new Date() },
            ]);
            setShowMissionControl(false);
          }}
        />
      )}
      {showShadowTalkLive && (
        <Suspense fallback={null}>
          <ShadowTalkLive
            isOpen={showShadowTalkLive}
            onClose={() => setShowShadowTalkLive(false)}
            onInsertToChat={(content) => setMessage(content)}
          />
        </Suspense>
      )}
      {showShadowBrowser && (
        <Suspense fallback={null}>
          <ShadowBrowser
            isOpen={showShadowBrowser}
            onClose={() => setShowShadowBrowser(false)}
            onInsertToChat={(content) => setMessage(content)}
          />
        </Suspense>
      )}
      </motion.div>
    </div>
  );
};
export default ChatbotPage;
