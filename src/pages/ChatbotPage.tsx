import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { saveSearchToHistory } from "@/components/chat/SearchHistory";
import { useToast } from "@/hooks/use-toast";
import { ChatMode, getModePrompt } from "@/components/chat/ModeSelector";
import { AIProvider } from "@/components/chat/ProviderSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatIconRail } from "@/components/chat/ChatIconRail";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { CodeCanvas } from "@/components/chat/CodeCanvas";
import { PersonalIDE } from "@/components/chat/PersonalIDE";
import { Canvas } from "@/components/chat/Canvas";
import { ImageGenerator } from "@/components/chat/ImageGenerator";
import { ImageDecoder } from "@/components/chat/ImageDecoder";
import { MusicGenerator } from "@/components/chat/MusicGenerator";

import { EditMessageDialog } from "@/components/chat/EditMessageDialog";
import { AdBanner } from "@/components/chat/AdBanner";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { ScriptAutomation } from "@/components/chat/ScriptAutomation";
import { StealthVault } from "@/components/chat/StealthVault";
import { AIAgentWorkflows } from "@/components/chat/AIAgentWorkflows";
import { ModelFineTuning } from "@/components/chat/ModelFineTuning";
import { WhiteLabelBranding } from "@/components/chat/WhiteLabelBranding";
import { GeminiKeyAnalytics } from "@/components/chat/GeminiKeyAnalytics";
import { DeepResearchPanel } from "@/components/chat/DeepResearchPanel";
import { AgenticTaskRunner } from "@/components/chat/AgenticTaskRunner";
import { VisualReasoning } from "@/components/chat/VisualReasoning";
import { CreativeSynthesis } from "@/components/chat/CreativeSynthesis";
import { ShadowTalkLive } from "@/components/chat/ShadowTalkLive";
import PlanetaryActionPanel from "@/components/chat/PlanetaryActionPanel";
import SecurityAuditPanel from "@/components/chat/SecurityAuditPanel";
import { OfflineAIIndicator } from "@/components/chat/OfflineAIIndicator";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { ScreenAgent } from "@/components/chat/ScreenAgent";
import { WelcomeDialog } from "@/components/chat/WelcomeDialog";
import { MultiModelOrchestrator } from "@/components/chat/MultiModelOrchestrator";
import { APIMarketplace } from "@/components/chat/APIMarketplace";
import { SignInPrompt } from "@/components/chat/SignInPrompt";
import { CameraCapture } from "@/components/chat/CameraCapture";
import { DataOrganizer } from "@/components/chat/DataOrganizer";
import { DocumentGenerator } from "@/components/chat/DocumentGenerator";
import { DailyPlanner } from "@/components/chat/DailyPlanner";
import { WordleGame } from "@/components/chat/WordleGame";
import { VisionAgent } from "@/components/chat/VisionAgent";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { KnowledgeVault } from "@/components/chat/KnowledgeVault";
import { IntelligenceHub } from "@/components/chat/IntelligenceHub";
import { UncensoredArena } from "@/components/chat/UncensoredArena";
import { useIntelligenceHub } from "@/hooks/useIntelligenceHub";
import { MemoryPanel } from "@/components/chat/MemoryPanel";
import { MissionControl } from "@/components/chat/MissionControl";
import { CustomInstructions } from "@/components/chat/CustomInstructions";
import { ConversationBranching } from "@/components/chat/ConversationBranching";
import { BunkerModeToggle } from "@/components/chat/BunkerModeToggle";
import { OfflineDisabledNotice } from "@/components/chat/OfflineDisabledNotice";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { CognitiveLoopPanel } from "@/components/chat/CognitiveLoopPanel";
import { BrowseActivityPanel, useAutoBrowse } from "@/components/chat/BrowseActivityPanel";
import { PluginsManager } from "@/components/chat/PluginsManager";
import { ChatGPTBeaterIndicator } from "@/components/chat/ChatGPTBeaterIndicator";
import { ClaudeBeaterIndicator } from "@/components/chat/ClaudeBeaterIndicator";
import { GeminiBeaterIndicator } from "@/components/chat/GeminiBeaterIndicator";
import { ManusAIBeaterIndicator } from "@/components/chat/ManusAIBeaterIndicator";
import { GoogleIntegrationPanel } from "@/components/chat/GoogleIntegrationPanel";
import { ThinkingTransparency, useThinkingSteps } from "@/components/chat/ThinkingTransparency";
import { LiveCodeArtifact, extractCodeArtifacts } from "@/components/chat/LiveCodeArtifact";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineAI } from "@/hooks/useOfflineAI";
import { useOfflineChat } from "@/hooks/useOfflineChat";
 import { useAutoOfflineAI } from "@/hooks/useAutoOfflineAI";
 import { useRobustOfflineAI } from "@/hooks/useRobustOfflineAI";
import { useOfflineChatHistory } from "@/hooks/useOfflineChatHistory";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useBusinessMemory } from "@/hooks/useBusinessMemory";
import { useGuestUsage, GUEST_LIMITS } from "@/hooks/useGuestUsage";
import { useToolOrchestrator, ToolType } from "@/hooks/useToolOrchestrator";
import { useZeroKnowledgeSync } from "@/hooks/useZeroKnowledgeSync";
import { useE2EE } from "@/hooks/useE2EE";
import { Shield, Lock, Key, Loader2, Sparkles } from "lucide-react";

import { NetworkTransitionOverlay } from "@/components/chat/NetworkTransitionOverlay";
import { useOfflineSessionTracker } from "@/hooks/useOfflineSessionTracker";
import { useLocalVectorStore } from "@/hooks/useLocalVectorStore";
import { useKnowledgeSnapshot } from "@/hooks/useKnowledgeSnapshot";
import { useServerSyncQueue } from "@/hooks/useServerSyncQueue";
import { useGhostAds } from "@/hooks/useGhostAds";
import { useShadowMemoryContext } from "@/contexts/ShadowMemoryContext";
import { Button } from "@/components/ui/button";

// Types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type MessageContent = string | { type: string; text?: string; image_url?: { url: string } }[];
type Message = { 
  id: string; 
  type: "user" | "ai"; 
  content: string; 
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string; // For AI-generated images
  toolExecution?: { tool: string; status: 'pending' | 'running' | 'complete' | 'error' | 'confirm'; params?: Record<string, string>; result?: string };
};
type Conversation = { id: string; title: string; created_at: string };
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const GEMINI_LB_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-load-balancer`;

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription } = useAuth();
  const { toast } = useToast();
  const e2ee = useE2EE();
  const [e2eePassphrase, setE2EEPassphrase] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Core state
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyChats, setDailyChats] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Settings
  const [personality, setPersonality] = useState<Personality>("friendly");
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [aiProvider, setAiProvider] = useState<AIProvider>("lovable");
  const [showSidebar, setShowSidebar] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ type: 'image' | 'file'; data: string; name: string; mimeType: string } | null>(null);
  
  // Modal state
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScriptAutomation, setShowScriptAutomation] = useState(false);
  const [showStealthVault, setShowStealthVault] = useState(false);
  const [showAgentWorkflows, setShowAgentWorkflows] = useState(false);
  const [showModelFineTuning, setShowModelFineTuning] = useState(false);
  const [showWhiteLabelBranding, setShowWhiteLabelBranding] = useState(false);
  const [showGeminiAnalytics, setShowGeminiAnalytics] = useState(false);
  const [codeCanvas, setCodeCanvas] = useState<{ code: string; language: string } | null>(null);
  const [codeWorkspace, setCodeWorkspace] = useState<{ code: string; language: string } | null>(null);
  const [canvasState, setCanvasState] = useState<{ content: string; type: "document" | "code"; language?: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ index: number; content: string } | null>(null);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showAgenticRunner, setShowAgenticRunner] = useState(false);
  const [showVisualReasoning, setShowVisualReasoning] = useState(false);
  const [showCreativeSynthesis, setShowCreativeSynthesis] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [showScreenAgent, setShowScreenAgent] = useState(false);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | undefined>(undefined);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showMultiModel, setShowMultiModel] = useState(false);
  const [showAPIMarketplace, setShowAPIMarketplace] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
   const [signInPromptReason, setSignInPromptReason] = useState<'chats' | 'images' | 'deepResearch' | 'general'>('general');
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showDataOrganizer, setShowDataOrganizer] = useState(false);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [showDailyPlanner, setShowDailyPlanner] = useState(false);
  const [showWordleGame, setShowWordleGame] = useState(false);
  const [showVisionAgent, setShowVisionAgent] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(false);
  const [showSovereignModels, setShowSovereignModels] = useState(false);
  const [showKnowledgeVault, setShowKnowledgeVault] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [showConversationBranching, setShowConversationBranching] = useState(false);
  const [showBunkerMode, setShowBunkerMode] = useState(false);
  const [showCognitiveLoop, setShowCognitiveLoop] = useState(false);
  const [showPluginsManager, setShowPluginsManager] = useState(false);
  const [showIntelligenceHub, setShowIntelligenceHub] = useState(false);
  const [showUncensoredArena, setShowUncensoredArena] = useState(false);
  
  // Tool params for auto-execution
  const [imageGeneratorPrompt, setImageGeneratorPrompt] = useState<string | undefined>(undefined);
  const [imageGeneratorAutoGenerate, setImageGeneratorAutoGenerate] = useState(false);
  const [deepResearchQuery, setDeepResearchQuery] = useState<string | undefined>(undefined);
  const [deepResearchAutoStart, setDeepResearchAutoStart] = useState(false);
  const [agenticGoal, setAgenticGoal] = useState<string | undefined>(undefined);
  const [agenticAutoStart, setAgenticAutoStart] = useState(false);
  const [creativeSynthesisPrompt, setCreativeSynthesisPrompt] = useState<string | undefined>(undefined);
  const [creativeSynthesisAutoGenerate, setCreativeSynthesisAutoGenerate] = useState(false);
  const [showImageDecoder, setShowImageDecoder] = useState(false);
  const [imageDecoderImage, setImageDecoderImage] = useState<string | undefined>(undefined);
  const [imageDecoderAutoAnalyze, setImageDecoderAutoAnalyze] = useState(false);
  const [documentGeneratorTopic, setDocumentGeneratorTopic] = useState<string | undefined>(undefined);
  const [documentGeneratorAutoGenerate, setDocumentGeneratorAutoGenerate] = useState(false);
  const [showMusicGenerator, setShowMusicGenerator] = useState(false);
  const [musicGeneratorPrompt, setMusicGeneratorPrompt] = useState<string | undefined>(undefined);
  const [musicGeneratorAutoGenerate, setMusicGeneratorAutoGenerate] = useState(false);
  
  // Hooks
  const { checkAccess, getDailyMessageLimit, isProOrHigher, isElite } = useFeatureGating();
  const { isOffline, checkSubscription } = useAuth();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackVoiceInput, trackTextToSpeech, trackConversationCreated, trackFileUpload, trackModeSwitch } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const offlineChatHistory = useOfflineChatHistory();
  const guestUsage = useGuestUsage();
  const shadowMemory = useShadowMemoryContext();
  const toolOrchestrator = useToolOrchestrator();
  const autoBrowse = useAutoBrowse();
  const intelligenceHub = useIntelligenceHub();
  const gemmaOffline = useGemmaOffline();
  
  // Determine if user is a guest
  const isGuest = !user;
  
  useGeoLocation();

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const offlineSession = getOfflineSession();
    const shouldLoadConversations = (user || offlineSession) && !isOffline;
    
    if (shouldLoadConversations && e2ee.isUnlocked) {
      loadConversations();
      checkSubscription();
      if (isElite) requestPermission();
    } else if (!user && !offlineSession && !isOffline) {
      const guestConvId = 'guest-' + Date.now();
      setCurrentConversationId(guestConvId);
      setMessages([{ 
        id: 'welcome', 
        type: 'ai', 
        content: `👋 Welcome to ShadowTalk AI! You have **${GUEST_LIMITS.chats} free chats** without signing in.\n\nSign up for FREE to get encrypted history and more!`, 
        timestamp: new Date() 
      }]);
      setConversations([{ id: guestConvId, title: 'Guest Conversation', created_at: new Date().toISOString() }]);
    }
  }, [user, isElite, isOffline, getOfflineSession, checkSubscription, e2ee.isUnlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Conversation Management
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
      
      if (decryptedData.length > 0 && !currentConversationId) {
        loadConversation(decryptedData[0].id);
      } else if (decryptedData.length === 0) {
        createNewConversation();
      }
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
          if (unwrapped) {
            content = await e2ee.decryptData(unwrapped.data, unwrapped.iv) || "[DECRYPTION_FAILED]";
          }
        }

        return {
          id: m.id,
          type: m.role === 'user' ? 'user' : 'ai',
          content,
          timestamp: new Date(m.created_at)
        };
      }));
      
      setMessages(loadedMessages.length === 0 ? [{
        id: 'welcome',
        type: 'ai',
        content: getWelcomeMessage(),
        timestamp: new Date()
      }] : loadedMessages);
    }
  };

  const getWelcomeMessage = () => {
    const messages: Record<Personality, string> = {
      friendly: "👋 Hi there! I'm ShadowTalk AI. Your space is now **End-to-End Encrypted**.",
      sarcastic: "Security engaged. Not that anyone was interested in your chats anyway. 😏",
      professional: "Security protocols established. Your conversation is fully E2EE protected.",
      creative: "✨ Your creative ideas are now locked in a digital vault. Let's explore!",
      meticulous: "Security audit complete. End-to-end encryption is active on all data streams.",
      curious: "Safe and sound! What interesting things shall we talk about today?",
      diplomatic: "Your privacy is my priority. This channel is now fully secure.",
      witty: "Privacy mode engaged. No eavesdropping allowed in this neural workspace!",
      pragmatic: "Security is active. Let's get to work safely.",
      inquisitive: "Ready to assist. Your data is protected by world-class encryption.",
      spicy: "🔥 The vault is locked and the encryption is tight. Let's get spicy! 🌶️"
    };
    return messages[personality];
  };

  const generateSmartTitle = (content: string): string => {
    const words = content.trim().split(/\s+/).slice(0, 3).join(' ');
    return words.length > 25 ? words.slice(0, 22) + '...' : words;
  };

  const createNewConversation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Conversation' })
      .select()
      .single();
    
    if (data && !error) {
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        remaining.length > 0 ? loadConversation(remaining[0].id) : createNewConversation();
      }
      toast({ title: "Conversation deleted" });
    }
  };

  const clearAllConversations = async () => {
    if (!user || conversations.length === 0) return;
    try {
      const { error } = await supabase.from('conversations').delete().eq('user_id', user.id);
      if (error) throw error;
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      await createNewConversation();
      toast({ title: "All chats cleared" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!user || !currentConversationId || !e2ee.isUnlocked) return null;
    
    let contentToSave = content;
    const encrypted = await e2ee.encryptData(content);
    if (encrypted) {
      contentToSave = e2ee.wrapEncrypted(encrypted.data, encrypted.iv);
    }
    
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: currentConversationId, user_id: user.id, content: contentToSave, role, personality })
      .select()
      .single();
    
    if (role === 'user' && messages.length <= 1) {
      const title = generateSmartTitle(content);
      let titleToSave = title;
      const encryptedTitle = await e2ee.encryptData(title);
      if (encryptedTitle) {
        titleToSave = e2ee.wrapEncrypted(encryptedTitle.data, encryptedTitle.iv);
      }
      await supabase.from('conversations').update({ title: titleToSave, updated_at: new Date().toISOString() }).eq('id', currentConversationId);
      setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, title } : c));
    }
    
    return data;
  };

  const handleSendMessage = async (customMessage?: string, customAttachment?: typeof selectedFile) => {
    const messageToSend = customMessage || message;
    const attachmentToSend = customAttachment || selectedFile;
    if ((!messageToSend.trim() && !attachmentToSend) || isLoading || !currentConversationId) return;
    
    const toolDetection = toolOrchestrator.detectTool(messageToSend);
    if (toolDetection.tool && toolDetection.confidence >= 70) {
      return;
    }

    const userMessage: Message = { 
      id: crypto.randomUUID(), 
      type: "user", 
      content: messageToSend, 
      timestamp: new Date(),
      attachment: attachmentToSend || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setSelectedFile(null);
    setDailyChats(prev => prev + 1);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    await saveMessage(messageToSend, 'user');

    let assistantContent = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const chatMessages = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.type === "user" ? "user" : "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: messageToSend });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: chatMessages, personality, mode: chatMode }),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) throw new Error("Failed to get response");
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : [...prev, { id: aiMessageId, type: 'ai', content: assistantContent, timestamp: new Date() }][prev.length]));
              }
            } catch {}
          }
        }
      }
      if (assistantContent) await saveMessage(assistantContent, 'assistant');
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: "Encryption secure, but server connection failed.", timestamp: new Date() }]);
    } finally { setIsLoading(false); }
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

  const toggleVoiceInput = () => {}; 
  const handleTextToSpeech = () => {}; 
  const stopGeneration = () => abortControllerRef.current?.abort();
  const handleEditMessage = () => {};
  const handleRegenerate = () => {};
  const handleExportChat = () => {};
  const handleManageSubscription = () => {};

  if (!isGuest && !e2ee.isUnlocked) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#1e1f20]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-2xl text-center">
          <div className="mx-auto w-24 h-24 mb-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-[32px] flex items-center justify-center shadow-xl">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Neural Vault Locked</h1>
          <p className="text-muted-foreground/60 mb-10 leading-relaxed">ShadowTalk is the world's most secure chatbot. Enter your Master Passphrase to decrypt your workspace.</p>
          <div className="space-y-4">
            <input type="password" value={e2eePassphrase} onChange={(e) => setE2EEPassphrase(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlockE2EE()} placeholder="Security Passphrase" className="w-full h-16 bg-white/5 border border-white/10 rounded-[20px] px-6 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono tracking-widest" />
            <Button onClick={handleUnlockE2EE} disabled={isUnlocking || !e2eePassphrase} className="w-full h-16 rounded-[20px] bg-white text-black hover:bg-white/90 text-lg font-bold">
              {isUnlocking ? <Loader2 className="h-6 w-6 animate-spin" /> : "Unlock Workspace"}
            </Button>
            <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] pt-6 flex items-center justify-center gap-2"><Shield className="h-3 w-3" /> E2EE - ZERO KNOWLEDGE ARCHITECTURE</p>
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
        <ChatIconRail userInitials={userInitials} onNewChat={createNewConversation} onOpenHistory={() => setShowSidebar(true)} onOpenTools={() => setToolsMenuOpen(true)} onOpenSettings={() => navigate("/profile")} />
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 z-50 md:left-[72px]">
              <ConversationSidebar conversations={conversations} currentConversationId={currentConversationId} onCreateNew={() => { createNewConversation(); setShowSidebar(false); }} onSelect={(id) => { loadConversation(id); setShowSidebar(false); }} onDelete={deleteConversation} onClearAll={clearAllConversations} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader userPlan={userPlan} personality={personality} onPersonalityChange={setPersonality} onToggleSidebar={() => setShowSidebar(!showSidebar)} onExport={handleExportChat} onManageSubscription={handleManageSubscription} onSignOut={signOut} onOpenAnalytics={() => setShowAnalytics(true)} onOpenDeepResearch={() => setShowDeepResearch(true)} onOpenImageGenerator={() => setShowImageGenerator(true)} onOpenShadowTalkLive={() => setShowShadowTalkLive(true)} onOpenBrowser={() => setShowShadowBrowser(true)} aiProvider={aiProvider} onProviderChange={setAiProvider} maxChats="∞" dailyChats={dailyChats} />
          <div className={`flex-1 overflow-hidden relative flex flex-col ${isEmptyChat ? "justify-center" : ""}`}>
            <AnimatePresence mode="wait">
              {isEmptyChat ? (
                <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="home-centered-content">
                  <h1 className="text-4xl md:text-[3.5rem] font-bold text-foreground tracking-tight mb-8">Hello, {userDisplayName}.</h1>
                  <div className="w-full max-w-2xl px-4"><ChatInput message={message} onMessageChange={setMessage} onSend={handleSendMessage} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} isLoading={isLoading} isListening={isListening} onToggleVoice={toggleVoiceInput} onOpenImageGenerator={() => setShowImageGenerator(true)} onStopGeneration={stopGeneration} selectedFile={selectedFile} onFileSelect={setSelectedFile} chatMode={chatMode} onModeChange={setChatMode} personality={personality} /></div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col overflow-hidden"><ChatMessages messages={messages} isLoading={isLoading} showSuggestions={false} personality={personality} userPlan={userPlan} speakingMessageId={speakingMessageId} isSpeaking={isSpeaking} onSelectPrompt={setMessage} onEdit={handleEditMessage} onRegenerate={handleRegenerate} onTextToSpeech={handleTextToSpeech} onOpenCodeCanvas={setCodeCanvas} onOpenIDE={setCodeWorkspace} onOpenInBrowser={(url) => { setBrowserInitialUrl(url); setShowShadowBrowser(true); }} messagesEndRef={messagesEndRef} /></div>
              )}
            </AnimatePresence>
          </div>
          {!isEmptyChat && <div className="p-4"><ChatInput message={message} onMessageChange={setMessage} onSend={handleSendMessage} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} isLoading={isLoading} isListening={isListening} onToggleVoice={toggleVoiceInput} onOpenImageGenerator={() => setShowImageGenerator(true)} onStopGeneration={stopGeneration} selectedFile={selectedFile} onFileSelect={setSelectedFile} chatMode={chatMode} onModeChange={setChatMode} personality={personality} /></div>}
        </div>
      </div>
      {showImageGenerator && <ImageGenerator onClose={() => setShowImageGenerator(false)} onImageGenerated={(url) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: '🎨 Generated image', timestamp: new Date(), imageUrl: url }])} />}
      {showDeepResearch && <DeepResearchPanel isOpen={showDeepResearch} onClose={() => setShowDeepResearch(false)} onInsertToChat={(c) => setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: c, timestamp: new Date() }])} />}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onAction={() => {}} />
    </motion.div>
  );
};
export default ChatbotPage;
