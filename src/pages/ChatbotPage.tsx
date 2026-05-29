import { useState, useEffect, useRef, lazy, Suspense } from "react";
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

      if (!resp.ok) throw new Error("Failed");
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
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: "Error connecting to neural host.", timestamp: new Date() }]);
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

  const isEmptyChat = messages.length <= 1;
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
        setCurrentConversationId(null);
        setMessages([]);
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

  return (
    <motion.div className="min-h-screen neural-bg relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>{isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="neural-thinking-glow" />}</AnimatePresence>
      <div className="flex h-screen w-full relative z-10">
        <ChatIconRail
          userInitials={userInitials}
          onNewChat={() => { setCurrentConversationId(null); setMessages([]); }}
          onOpenHistory={() => setShowSidebar(true)}
          onOpenTools={() => setToolsMenuOpen(true)}
          onOpenSettings={() => navigate("/profile")}
        />
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 z-50 md:left-[72px]">
              <ConversationSidebar conversations={conversations} currentConversationId={currentConversationId} onCreateNew={() => { setCurrentConversationId(null); setMessages([]); setShowSidebar(false); }} onSelect={(id) => { loadConversation(id); setShowSidebar(false); }} onDelete={() => {}} onClearAll={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
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
                <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="home-centered-content">
                  <h1 className="text-5xl md:text-[4.5rem] font-bold text-white tracking-tight mb-8">Hello, {userDisplayName}.</h1>
                  {hasVerifiedKey && aiConfig.useCustomKey && (
                    <p className="text-sm text-primary/80 mb-4 -mt-4">
                      Using your connected {aiConfig.preferredProvider} API key
                    </p>
                  )}
                  <div className="w-full max-w-2xl px-4">
                    <ChatInput
                      message={message}
                      onMessageChange={setMessage}
                      onSend={handleSendMessage}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      isLoading={isLoading}
                      isListening={isListening}
                      onToggleVoice={() => setShowShadowTalkLive(true)}
                      onOpenImageGenerator={() => setShowImageGenerator(true)}
                      onStopGeneration={() => {}}
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
                  <ChatMessages messages={messages} isLoading={isLoading} showSuggestions={false} personality={personality} userPlan={userPlan} speakingMessageId={speakingMessageId} isSpeaking={isSpeaking} onSelectPrompt={setMessage} onEdit={() => {}} onRegenerate={() => {}} onTextToSpeech={() => {}} onOpenCodeCanvas={() => {}} onOpenIDE={() => {}} onOpenInBrowser={(url) => { setShowShadowBrowser(true); }} messagesEndRef={messagesEndRef} />
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
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                isLoading={isLoading}
                isListening={isListening}
                onToggleVoice={() => setShowShadowTalkLive(true)}
                onOpenImageGenerator={() => setShowImageGenerator(true)}
                onStopGeneration={() => {}}
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
  );
};
export default ChatbotPage;
