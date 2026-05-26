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
import { useOfflineChatHistory } from "@/hooks/useOfflineChatHistory";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useGuestUsage, GUEST_LIMITS } from "@/hooks/useGuestUsage";
import { useChatToolRouter } from "@/hooks/useChatToolRouter";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { ShadowTalkLive } from "@/components/chat/ShadowTalkLive";
import { CodeCanvas } from "@/components/chat/CodeCanvas";
import { useE2EE } from "@/hooks/useE2EE";
import { Shield, Lock, Key, Loader2, Sparkles } from "lucide-react";
import { useShadowMemoryContext } from "@/contexts/ShadowMemoryContext";
import { useIntelligenceHub } from "@/hooks/useIntelligenceHub";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { useAutoBrowse } from "@/components/chat/BrowseActivityPanel";
import { Button } from "@/components/ui/button";

// Types
interface Message { 
  id: string; 
  type: "user" | "ai"; 
  content: string; 
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string;
  toolExecution?: {
    tool: string;
    status: "pending" | "running" | "complete" | "error" | "confirm";
    params?: Record<string, string>;
    result?: string;
  };
}
type Conversation = { id: string; title: string; created_at: string };
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

function chatModeToCategory(mode: ChatMode): QueryCategory {
  const map: Partial<Record<ChatMode, QueryCategory>> = {
    general: "general",
    code: "code",
    translate: "translate",
    summarize: "summarize",
    debug: "debug",
    brainstorm: "brainstorm",
    image: "image",
    explain: "explain",
    creative: "creative",
    music: "music",
    research: "search",
  };
  return map[mode] || "general";
}

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription, isOffline } = useAuth();
  const { toast } = useToast();
  const e2ee = useE2EE();
  
  // Hooks
  const { checkAccess, isElite } = useFeatureGating();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackConversationCreated, trackImageGeneration } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const gemmaOffline = useGemmaOffline();
  
  // State
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
  const [selectedFile, setSelectedFile] = useState<{ type: 'image' | 'file'; data: string; name: string; mimeType: string } | null>(null);
  
  // Modals
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
    openShadowTalkLive: () => setShowShadowTalkLive(true),
    openAnalytics: () => setShowAnalytics(true),
    openCommandPalette: () => setShowCommandPalette(true),
    openCodeCanvas: () => setShowCodeCanvas(true),
    setChatMode: (mode) => setChatMode(mode as ChatMode),
  });

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
  }, [user, e2ee.isUnlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user || !e2ee.isUnlocked) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (data && !error) {
      const decryptedData = await Promise.all(data.map(async (c) => {
        let title = c.title || 'Untitled';
        if (e2ee.isEncrypted(title)) {
          const unwrapped = e2ee.unwrapEncrypted(title);
          if (unwrapped) {
            const decrypted = await e2ee.decryptData(unwrapped.data, unwrapped.iv);
            title = decrypted || 'Encrypted Chat';
          }
        }
        return { ...c, title };
      }));
      setConversations(decryptedData);
      if (decryptedData.length > 0 && !currentConversationId) loadConversation(decryptedData[0].id);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!e2ee.isUnlocked) return;
    setCurrentConversationId(conversationId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data && !error) {
      const loadedMessages: Message[] = await Promise.all(data.map(async (m) => {
        let content = m.content;
        if (e2ee.isEncrypted(content)) {
          const unwrapped = e2ee.unwrapEncrypted(content);
          if (unwrapped) content = await e2ee.decryptData(unwrapped.data, unwrapped.iv) || "[DECRYPTION_FAILED]";
        }
        return { id: m.id, type: m.role === 'user' ? 'user' : 'ai', content, timestamp: new Date(m.created_at) };
      }));
      setMessages(loadedMessages.length === 0 ? [{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }] : loadedMessages);
    }
  };

  const getWelcomeMessage = () => {
    return "👋 Welcome back! Your connection is fully End-to-End Encrypted.";
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!user || !currentConversationId || !e2ee.isUnlocked) return null;
    let contentToSave = content;
    const encrypted = await e2ee.encryptData(content);
    if (encrypted) contentToSave = e2ee.wrapEncrypted(encrypted.data, encrypted.iv);
    
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: currentConversationId, user_id: user.id, content: contentToSave, role, personality })
      .select().single();
    
    if (role === 'user' && messages.length <= 1) {
      const title = content.trim().split(/\s+/).slice(0, 3).join(' ').slice(0, 25);
      let titleToSave = title;
      const encryptedTitle = await e2ee.encryptData(title);
      if (encryptedTitle) titleToSave = e2ee.wrapEncrypted(encryptedTitle.data, encryptedTitle.iv);
      await supabase.from('conversations').update({ title: titleToSave, updated_at: new Date().toISOString() }).eq('id', currentConversationId);
      setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, title } : c));
    }
    return data;
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isLoading || !currentConversationId) return;
    const msgContent = message.trim() || (selectedFile ? "[attachment]" : "");
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
    void trackChatMessage(
      chatModeToCategory(chatMode),
      personality,
      msgContent.length,
      !!selectedFile,
      selectedFile?.type
    );

    try {
      await chatRouter.runChatTurn({
        msgContent,
        messages,
        personality,
        chatMode,
        attachment: selectedFile
          ? { type: selectedFile.type, data: selectedFile.data, mimeType: selectedFile.mimeType }
          : undefined,
        onMessagesUpdate: (updater) => setMessages(updater),
        saveAssistant: (content) => saveMessage(content, "assistant"),
      });
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
    if (success) { setE2EEPassphrase(""); loadConversations(); }
  };

  if (!user && !isOffline) { navigate("/auth"); return null; }

  if (!e2ee.isUnlocked) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#1e1f20]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-2xl text-center">
          <div className="mx-auto w-20 h-20 mb-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Neural Vault Locked</h1>
          <p className="text-muted-foreground/60 mb-10 leading-relaxed">Enter your Master Passphrase to decrypt your ShadowTalk workspace.</p>
          <div className="space-y-4">
            <input type="password" value={e2eePassphrase} onChange={(e) => setE2EEPassphrase(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlockE2EE()} placeholder="Passphrase" className="w-full h-16 bg-white/5 border border-white/10 rounded-[20px] px-6 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-mono tracking-widest" />
            <Button onClick={handleUnlockE2EE} disabled={isUnlocking || !e2eePassphrase} className="w-full h-16 rounded-[20px] bg-white text-black hover:bg-white/90 text-lg font-bold">
              {isUnlocking ? <Loader2 className="h-6 w-6 animate-spin" /> : "Unlock Workspace"}
            </Button>
            <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] pt-6 flex items-center justify-center gap-2"><Shield className="h-3 w-3" /> E2EE PROTECTED</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isEmptyChat = messages.length <= 1;
  const userDisplayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "G";

  return (
    <motion.div className="min-h-screen neural-bg relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>{isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="neural-thinking-glow" />}</AnimatePresence>
      <div className="flex h-screen w-full relative z-10">
        <ChatIconRail userInitials={userInitials} onNewChat={() => { setCurrentConversationId(null); setMessages([]); }} onOpenHistory={() => setShowSidebar(true)} onOpenSettings={() => navigate("/profile")} />
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 z-50 md:left-[72px]">
              <ConversationSidebar conversations={conversations} currentConversationId={currentConversationId} onCreateNew={() => { setCurrentConversationId(null); setMessages([]); setShowSidebar(false); }} onSelect={(id) => { loadConversation(id); setShowSidebar(false); }} onDelete={() => {}} onClearAll={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader userPlan={userPlan} personality={personality} onPersonalityChange={setPersonality} onToggleSidebar={() => setShowSidebar(!showSidebar)} onExport={() => {}} onManageSubscription={() => {}} onSignOut={signOut} onOpenAnalytics={() => setShowAnalytics(true)} onOpenDeepResearch={() => setShowDeepResearch(true)} onOpenImageGenerator={() => setShowImageGenerator(true)} onOpenShadowTalkLive={() => setShowShadowTalkLive(true)} onOpenBrowser={() => setShowShadowBrowser(true)} aiProvider={aiProvider} onProviderChange={setAiProvider} maxChats="∞" dailyChats={dailyChats} />
          <div className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="home-centered-content">
                  <h1 className="text-5xl md:text-[4.5rem] font-bold text-white tracking-tight mb-8">Hello, {userDisplayName}.</h1>
                  <div className="w-full max-w-2xl px-4">
                    <ChatInput message={message} onMessageChange={setMessage} onSend={handleSendMessage} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} isLoading={isLoading} isListening={isListening} onToggleVoice={() => {}} onOpenImageGenerator={() => setShowImageGenerator(true)} onStopGeneration={() => {}} selectedFile={selectedFile} onFileSelect={setSelectedFile} chatMode={chatMode} onModeChange={setChatMode} personality={personality} />
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col overflow-hidden">
                  <ChatMessages messages={messages} isLoading={isLoading} showSuggestions={false} personality={personality} userPlan={userPlan} speakingMessageId={speakingMessageId} isSpeaking={isSpeaking} onSelectPrompt={setMessage} onEdit={() => {}} onRegenerate={() => {}} onTextToSpeech={() => {}} onOpenCodeCanvas={() => setShowCodeCanvas(true)} onOpenIDE={() => {}} onOpenInBrowser={(url) => { setBrowserInitialUrl(url); setShowShadowBrowser(true); }} messagesEndRef={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && <div className="p-4 max-w-4xl mx-auto w-full"><ChatInput message={message} onMessageChange={setMessage} onSend={handleSendMessage} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} isLoading={isLoading} isListening={isListening} onToggleVoice={() => {}} onOpenImageGenerator={() => setShowImageGenerator(true)} onStopGeneration={() => {}} selectedFile={selectedFile} onFileSelect={setSelectedFile} chatMode={chatMode} onModeChange={setChatMode} personality={personality} /></div>}
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
        onClose={() => setShowShadowTalkLive(false)}
        onInsertToChat={(c) =>
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: "ai", content: c, timestamp: new Date() }])
        }
      />
      {showCodeCanvas && (
        <CodeCanvas
          code={
            [...messages]
              .reverse()
              .find((m) => m.type === "ai" && m.content.includes("```"))
              ?.content.match(/```[\w]*\n([\s\S]*?)```/)?.[1] ||
            "// Use chat to generate code, then open Code Canvas"
          }
          language="typescript"
          onClose={() => setShowCodeCanvas(false)}
        />
      )}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onAction={() => {}} />
    </motion.div>
  );
};
export default ChatbotPage;
