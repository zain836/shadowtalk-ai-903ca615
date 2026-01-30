import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { saveSearchToHistory } from "@/components/chat/SearchHistory";
import { useToast } from "@/hooks/use-toast";
import { ChatMode, getModePrompt } from "@/components/chat/ModeSelector";
import { AIProvider } from "@/components/chat/ProviderSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { CodeCanvas } from "@/components/chat/CodeCanvas";
import { CodeWorkspace } from "@/components/chat/CodeWorkspace";
import { Canvas } from "@/components/chat/Canvas";
import { ImageGenerator } from "@/components/chat/ImageGenerator";

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
import { PerplexityPages } from "@/components/chat/PerplexityPages";
import { ShadowCowork } from "@/components/chat/ShadowCowork";
import { ShadowTalkLive } from "@/components/chat/ShadowTalkLive";
import CognitiveLoadPanel from "@/components/chat/CognitiveLoadPanel";
import PlanetaryActionPanel from "@/components/chat/PlanetaryActionPanel";
import SecurityAuditPanel from "@/components/chat/SecurityAuditPanel";
import { OfflineAIIndicator } from "@/components/chat/OfflineAIIndicator";
import { OfflineToolsPanel } from "@/components/chat/OfflineToolsPanel";
import { ShadowBrowser } from "@/components/chat/ShadowBrowser";
import { WelcomeDialog } from "@/components/chat/WelcomeDialog";
import { MultiModelOrchestrator } from "@/components/chat/MultiModelOrchestrator";
import { APIMarketplace } from "@/components/chat/APIMarketplace";
import { SignInPrompt } from "@/components/chat/SignInPrompt";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineAI } from "@/hooks/useOfflineAI";
import { useOfflineChatHistory } from "@/hooks/useOfflineChatHistory";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useBusinessMemory } from "@/hooks/useBusinessMemory";
import { useGuestUsage, GUEST_LIMITS } from "@/hooks/useGuestUsage";

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
};
type Conversation = { id: string; title: string; created_at: string };
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const GEMINI_LB_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-load-balancer`;

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, userPlan, signOut, checkSubscription } = useAuth();
  const { toast } = useToast();
  
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
  const [showSidebar, setShowSidebar] = useState(true);
  
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
  const [showPerplexityPages, setShowPerplexityPages] = useState(false);
  const [showShadowCowork, setShowShadowCowork] = useState(false);
  const [showShadowTalkLive, setShowShadowTalkLive] = useState(false);
  const [showOfflineTools, setShowOfflineTools] = useState(false);
  const [showShadowBrowser, setShowShadowBrowser] = useState(false);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | undefined>(undefined);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showMultiModel, setShowMultiModel] = useState(false);
  const [showAPIMarketplace, setShowAPIMarketplace] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInPromptReason, setSignInPromptReason] = useState<'chats' | 'images' | 'deepResearch' | 'general'>('general');
  
  // Check if welcome dialog should be shown (after boot screen)
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('shadowtalk_welcome_seen');
    if (!hasSeenWelcome) {
      // Small delay to ensure boot screen has finished
      const timer = setTimeout(() => {
        setShowWelcomeDialog(true);
        sessionStorage.setItem('shadowtalk_welcome_seen', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Special mode state
  const [isAnalyzingTask, setIsAnalyzingTask] = useState(false);
  const [isLoadingEcoActions, setIsLoadingEcoActions] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  
  // Hooks
  const { canAccess, checkAccess, getDailyMessageLimit, isProOrHigher, isElite } = useFeatureGating();
  const { isOffline, isOfflineModeAvailable, getOfflineResponse, cacheConversation, getCachedConversation, cachedConversations } = useOfflineMode();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackImageGeneration, trackVoiceInput, trackTextToSpeech, trackCodeExecution, trackFileUpload, trackModeSwitch, trackConversationCreated } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const offlineAI = useOfflineAI();
  const offlineChatHistory = useOfflineChatHistory();
  const { getMemoryContext, getActiveMemories } = useBusinessMemory();
  const guestUsage = useGuestUsage(); // Guest usage tracking
  
  // Determine if user is a guest (not logged in)
  const isGuest = !user;
  
  // Track user geolocation for analytics
  useGeoLocation();
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-initialize offline AI when going offline
  useEffect(() => {
    if (isOffline && !offlineAI.isModelLoaded && !offlineAI.isLoading) {
      console.log('[ChatbotPage] Auto-initializing offline AI...');
      offlineAI.initializeModel();
    }
  }, [isOffline, offlineAI.isModelLoaded, offlineAI.isLoading]);

  // Load cached conversations from IndexedDB when offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!isOffline || !offlineChatHistory.isReady) return;
      
      console.log('[ChatbotPage] Loading cached conversations from IndexedDB for offline mode');
      
      try {
        const cachedConvs = await offlineChatHistory.getCachedConversations();
        
        if (cachedConvs.length > 0) {
          // Set conversations list
          setConversations(cachedConvs.map(c => ({
            id: c.id,
            title: c.title,
            created_at: c.created_at
          })));
          
          // Load the most recent conversation's messages
          const mostRecent = cachedConvs[0];
          const cachedMessages = await offlineChatHistory.getCachedMessages(mostRecent.id);
          
          if (cachedMessages.length > 0) {
            const loadedMessages: Message[] = cachedMessages.map(m => ({
              id: m.id,
              type: m.type,
              content: m.content,
              timestamp: m.timestamp
            }));
            setMessages(loadedMessages);
            setCurrentConversationId(mostRecent.id);
            console.log('[ChatbotPage] Loaded', loadedMessages.length, 'cached messages');
          } else {
            // No messages, show welcome
            setCurrentConversationId(mostRecent.id);
            setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
          }
        } else {
          // No cached conversations, create a local one
          const newConvId = crypto.randomUUID();
          const newConv = {
            id: newConvId,
            title: 'Offline Conversation',
            created_at: new Date().toISOString()
          };
          await offlineChatHistory.cacheConversation(newConv);
          setConversations([newConv]);
          setCurrentConversationId(newConvId);
          setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
        }
      } catch (e) {
        console.error('[ChatbotPage] Failed to load offline data:', e);
        // Fallback: just show welcome message
        setMessages([{ id: 'welcome', type: 'ai', content: getWelcomeMessage(), timestamp: new Date() }]);
      }
    };
    
    loadOfflineData();
  }, [isOffline, offlineChatHistory.isReady]);

  // Initialize - ALLOW GUESTS with limited usage!
  useEffect(() => {
    // Check for offline session first
    const offlineSession = getOfflineSession();
    
    // CHANGED: Don't redirect guests - let them use limited features
    if (user || offlineSession) {
      if (!isOffline) {
        loadConversations();
        checkSubscription();
      }
      // Request push notification permission for Elite users
      if (isElite && !isOffline) requestPermission();
    } else {
      // Guest mode - create a local conversation for them
      const guestConvId = 'guest-' + Date.now();
      setCurrentConversationId(guestConvId);
      setMessages([{ 
        id: 'welcome', 
        type: 'ai', 
        content: `👋 Welcome to ShadowTalk AI! You have **${GUEST_LIMITS.chats} free chats** and **${GUEST_LIMITS.images} free image generations** without signing in.\n\nSign up for FREE to get:\n• 50 messages per day\n• 4 images per day (more than ChatGPT!)\n• 5 deep research queries (more than ChatGPT!)\n• Save your conversation history\n\nHow can I help you today?`, 
        timestamp: new Date() 
      }]);
      setConversations([{ id: guestConvId, title: 'Guest Conversation', created_at: new Date().toISOString() }]);
    }
  }, [user, isElite, isOffline, getOfflineSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcuts for AI tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Ctrl+Shift (or Cmd+Shift on Mac)
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      
      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'r': // Deep Research
          e.preventDefault();
          setShowDeepResearch(true);
          break;
        case 'a': // Agentic Task Runner
          e.preventDefault();
          setShowAgenticRunner(true);
          break;
        case 'v': // Visual Reasoning
          e.preventDefault();
          setShowVisualReasoning(true);
          break;
        case 'c': // Creative Synthesis
          e.preventDefault();
          setShowCreativeSynthesis(true);
          break;
        case 'd': // New Document Canvas
          e.preventDefault();
          setCanvasState({ content: "", type: "document", language: "javascript" });
          break;
        case 'k': // New Code Canvas
          e.preventDefault();
          setCanvasState({ content: "", type: "code", language: "javascript" });
          break;
        case 'w': // Shadow Cowork
          e.preventDefault();
          setShowShadowCowork(true);
          break;
        case 'l': // ShadowTalk Live
          e.preventDefault();
          setShowShadowTalkLive(true);
          break;
        case 'o': // Offline Tools
          e.preventDefault();
          setShowOfflineTools(true);
          break;
        case 'b': // Browser
          e.preventDefault();
          setShowShadowBrowser(true);
          break;
        case 'm': // Multi-Model Orchestrator
          e.preventDefault();
          setShowMultiModel(true);
          break;
        case 'p': // API Marketplace
          e.preventDefault();
          setShowAPIMarketplace(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Conversation Management
  const loadConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (data && !error) {
      setConversations(data);
      
      // Cache conversations to IndexedDB for offline access
      if (offlineChatHistory.isReady) {
        const toCache = data.map(c => ({
          id: c.id,
          title: c.title || 'Untitled',
          created_at: c.created_at,
          updated_at: c.updated_at
        }));
        offlineChatHistory.bulkCacheConversations(toCache);
      }
      
      if (data.length > 0 && !currentConversationId) {
        loadConversation(data[0].id);
      } else if (data.length === 0) {
        createNewConversation();
      }
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    
    // If offline, load from IndexedDB
    if (isOffline && offlineChatHistory.isReady) {
      const cachedMessages = await offlineChatHistory.getCachedMessages(conversationId);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages.map(m => ({
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp
        })));
        return;
      }
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data && !error) {
      const loadedMessages: Message[] = data.map(m => ({
        id: m.id,
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content,
        timestamp: new Date(m.created_at)
      }));
      
      // Cache messages to IndexedDB for offline access
      if (offlineChatHistory.isReady && loadedMessages.length > 0) {
        const toCache = loadedMessages.map(m => ({
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp
        }));
        offlineChatHistory.bulkCacheMessages(conversationId, toCache);
      }
      
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
      friendly: "👋 Hi there! I'm ShadowTalk AI, your intelligent assistant. How can I help you today?",
      sarcastic: "Oh great, another conversation. Just kidding! 😏 What can I do for you?",
      professional: "Welcome. I'm here to assist you with any questions or tasks. How may I help?",
      creative: "✨ Hello, creative soul! Ready to explore ideas together? What's on your mind?",
      meticulous: "Welcome. I'll ensure every detail is covered. What would you like me to analyze thoroughly?",
      curious: "Hello! I'm excited to learn about your challenge. What shall we explore together?",
      diplomatic: "Good to see you. I'm here to help navigate any situation with care. How may I assist?",
      witty: "Ah, a new conversation! The plot thickens. What intellectual adventure awaits us today?",
      pragmatic: "Let's get down to business. What's the most practical problem I can help you solve today?",
      inquisitive: "Welcome! To serve you best, I'll need to understand your needs precisely. What can I help with?",
      spicy: "🌶️ Well, well, well... Look who decided to chat with the spiciest AI around! Let's skip the boring pleasantries—hit me with your hottest takes, wildest questions, or controversial opinions. I'm here for the unfiltered truth. What's on your mind? 🔥"
    };
    return messages[personality];
  };

  // Generate smart, short conversation title from message content
  const generateSmartTitle = (content: string): string => {
    const text = content.trim();
    
    // Common action words to identify intent
    const actionPatterns: [RegExp, string][] = [
      [/^(help|assist|can you|could you|please|i need)/i, ''],
      [/\b(create|make|build|generate|write)\s+(?:a\s+|an\s+)?(\w+)/i, 'Create $2'],
      [/\b(explain|what is|what are|what's|define)\s+(.{1,20})/i, 'About $2'],
      [/\b(fix|debug|solve|resolve)\s+(.{1,20})/i, 'Fix $2'],
      [/\b(summarize|summary of)\s+(.{1,20})/i, 'Summary: $2'],
      [/\b(translate)\s+(.{1,20})/i, 'Translate $2'],
      [/\b(code|script|program|function)\s+(?:for\s+)?(.{1,15})/i, 'Code: $2'],
      [/\b(analyze|analysis)\s+(.{1,20})/i, 'Analysis: $2'],
      [/\b(compare|vs|versus)\s+(.{1,20})/i, 'Compare $2'],
      [/\b(list|show|give me)\s+(.{1,20})/i, '$2'],
      [/\b(how to|how do|how can)\s+(.{1,20})/i, 'How to $2'],
      [/\b(why|reason)\s+(.{1,20})/i, 'Why $2'],
    ];
    
    // Try pattern matching first
    for (const [pattern, template] of actionPatterns) {
      const match = text.match(pattern);
      if (match && template) {
        let title = template.replace('$2', match[2] || '').trim();
        // Capitalize first letter and clean up
        title = title.charAt(0).toUpperCase() + title.slice(1);
        if (title.length > 25) title = title.slice(0, 22) + '...';
        return title;
      }
    }
    
    // Extract key words (nouns, topics) from the message
    const stopWords = new Set(['i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'please', 'help', 'want', 'need', 'like', 'know', 'think', 'make', 'get', 'go', 'see', 'come', 'take', 'use', 'find', 'give', 'tell', 'try', 'ask', 'work', 'seem', 'feel', 'let', 'put', 'keep', 'begin', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'you', 'your']);
    
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
    
    if (words.length === 0) {
      // Fallback: use first few words
      const firstWords = text.split(/\s+/).slice(0, 3).join(' ');
      return firstWords.length > 25 ? firstWords.slice(0, 22) + '...' : firstWords;
    }
    
    // Take first 2-3 meaningful words
    const keyWords = words.slice(0, 3);
    let title = keyWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    if (title.length > 25) title = title.slice(0, 22) + '...';
    return title;
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
      trackConversationCreated();
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
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
      // Delete all conversations for this user
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Clear local state
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
      
      // Create a fresh conversation
      await createNewConversation();
      
      toast({ 
        title: "All chats cleared", 
        description: `Deleted ${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}.` 
      });
    } catch (error) {
      console.error("Failed to clear conversations:", error);
      toast({ 
        title: "Error", 
        description: "Failed to clear conversations. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!user || !currentConversationId) return null;
    
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: currentConversationId, user_id: user.id, content, role, personality })
      .select()
      .single();
    
    // Auto-generate smart title on first user message
    if (role === 'user' && messages.length <= 1) {
      const title = generateSmartTitle(content);
      await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', currentConversationId);
      setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, title } : c));
    }
    
    return data;
  };

  // Message Handling
  const handleSendMessage = async (customMessage?: string, customAttachment?: typeof selectedFile) => {
    const messageToSend = customMessage || message;
    const attachmentToSend = customAttachment || selectedFile;
    
    if ((!messageToSend.trim() && !attachmentToSend) || isLoading || !currentConversationId) return;
    
    // GUEST USAGE CHECK - prompt sign in if limit reached
    if (isGuest) {
      if (!guestUsage.canPerform('chats')) {
        setSignInPromptReason('chats');
        setShowSignInPrompt(true);
        return;
      }
      // Track guest usage
      guestUsage.trackGuestAction('chats');
    } else {
      // Logged-in user - check daily limits
      const limit = getDailyMessageLimit();
      if (limit !== Infinity && dailyChats >= limit) {
        toast({ 
          title: "Daily Limit Reached", 
          description: "Upgrade for unlimited messages!",
          variant: "destructive",
          action: <a href="/founder-access" className="underline font-semibold">Upgrade Now</a>
        });
        return;
      }
    }
    
    if (messageToSend.trim().toLowerCase().startsWith('/imagine ')) {
      if (!checkAccess('imageGeneration')) return;
      setShowImageGenerator(true);
      setMessage(messageToSend.replace(/^\/imagine\s+/i, ''));
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

    // Track the chat message
    trackChatMessage(
      chatMode as 'general' | 'code' | 'translate' | 'summarize' | 'debug' | 'brainstorm' | 'image' | 'explain' | 'creative' | 'music',
      personality,
      messageToSend.length,
      !!attachmentToSend,
      attachmentToSend?.mimeType
    );

    abortControllerRef.current = new AbortController();
    await saveMessage(messageToSend, 'user');

    // Offline mode - use local AI
    if (isOffline) {
      console.log('[ChatbotPage] Offline mode detected, using local AI');
      
      try {
        // Create AI message placeholder for streaming
        const aiMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: aiMessageId, type: "ai", content: "", timestamp: new Date() }]);
        
        // Build message history for AI
        const offlineMessages = messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.type === 'user' ? 'user' as const : 'assistant' as const, content: m.content }));
        offlineMessages.push({ role: 'user' as const, content: messageToSend });
        
        // Generate response with streaming
        const fullResponse = await offlineAI.generateResponse(offlineMessages, (chunk) => {
          setMessages(prev => prev.map(m => 
            m.id === aiMessageId ? { ...m, content: m.content + chunk } : m
          ));
        });
        
        // Cache the messages to IndexedDB
        if (offlineChatHistory.isReady && currentConversationId) {
          await offlineChatHistory.cacheMessage(currentConversationId, userMessage);
          await offlineChatHistory.cacheMessage(currentConversationId, {
            id: aiMessageId,
            type: 'ai',
            content: fullResponse,
            timestamp: new Date()
          });
        }
        
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('[ChatbotPage] Offline AI error:', e);
        // Even on error, provide a fallback response
        const fallbackResponse = "I'm having trouble processing that request offline. Please try a simpler question or connect to the internet for full functionality.";
        setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: fallbackResponse, timestamp: new Date() }]);
        setIsLoading(false);
        return;
      }
    }

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const buildMessageContent = (msg: Message): MessageContent => {
        if (msg.attachment?.type === 'image') {
          return [{ type: "text", text: msg.content || "What's in this image?" }, { type: "image_url", image_url: { url: msg.attachment.data } }];
        }
        return msg.content;
      };

      const chatMessages = messages.filter(m => m.id !== 'welcome').map(m => ({ 
        role: m.type === "user" ? "user" : "assistant", 
        content: buildMessageContent(m)
      }));
      chatMessages.push({ role: "user", content: buildMessageContent(userMessage) });

      // Check if this is a research request
      const isResearchMode = chatMode === 'research';
      
      // Use Gemini Load Balancer if selected
      if (aiProvider === 'gemini' && !isResearchMode) {
        const geminiResp = await fetch(GEMINI_LB_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentConversationId,
            message: messageToSend,
            userId: user?.id
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!geminiResp.ok) {
          const errorData = await geminiResp.json();
          throw new Error(errorData.error || "Failed to get response from Gemini");
        }

        const geminiData = await geminiResp.json();
        assistantContent = geminiData.text || "";
        
        if (assistantContent) {
          setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: assistantContent, timestamp: new Date() }]);
          await saveMessage(assistantContent, 'assistant');
        }
      } else {
        // Use Lovable AI (default)
        let requestBody;
        const businessMemoryContext = getMemoryContext();
        if (isResearchMode) {
          requestBody = { deepResearch: true, researchQuery: messageToSend, businessMemory: businessMemoryContext || undefined };
        } else {
          requestBody = { messages: chatMessages, personality, mode: chatMode, modePrompt: getModePrompt(chatMode), businessMemory: businessMemoryContext || undefined };
        }

        // Save search to history if in research mode
        if (isResearchMode && user) {
          saveSearchToHistory(user.id, messageToSend);
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          if (resp.status === 402) {
            // AI credits exhausted - show upgrade prompt
            const upgradeMessage = `## ⚡ AI Credits Exhausted

Your AI credits have been used up for now. Don't worry - they refresh regularly!

**Options to continue chatting:**
- 🔄 Wait for credits to refresh
- ⬆️ **[Upgrade to Pro](/pricing)** for unlimited messages
- 🔌 Switch to **Gemini provider** (use your own API keys)

*Pro users get unlimited AI messages, priority support, and advanced features!*`;
            setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: upgradeMessage, timestamp: new Date() }]);
            setIsLoading(false);
            return;
          }
          throw new Error(errorData.error || "Failed to get response");
        }

        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        const aiMessageId = crypto.randomUUID();

        const upsertAssistant = (nextChunk: string) => {
          assistantContent += nextChunk;
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === aiMessageId);
            if (idx !== -1) return prev.map((m, i) => i === idx ? { ...m, content: assistantContent } : m);
            return [...prev, { id: aiMessageId, type: "ai", content: assistantContent, timestamp: new Date() }];
          });
        };

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
              if (content) upsertAssistant(content);
            } catch { textBuffer = line + "\n" + textBuffer; break; }
          }
        }

        if (assistantContent) await saveMessage(assistantContent, 'assistant');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Chat error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to get AI response", variant: "destructive" });
      setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Voice Functions
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice input is not supported in your browser.", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); toast({ title: "Listening...", description: "Speak now." }); trackVoiceInput(); };
    recognition.onresult = (event: SpeechRecognitionEvent) => setMessage(Array.from(event.results).map(r => r[0].transcript).join(''));
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => { setIsListening(false); if (event.error !== 'aborted') toast({ title: "Voice error", description: event.error, variant: "destructive" }); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleTextToSpeech = (text: string, messageId: string) => {
    if (!checkAccess('textToSpeech')) return;
    if (!('speechSynthesis' in window)) { toast({ title: "Not supported", variant: "destructive" }); return; }
    if (speakingMessageId === messageId && isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); setSpeakingMessageId(null); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, '').replace(/\n+/g, ' '));
    utterance.onstart = () => { setIsSpeaking(true); setSpeakingMessageId(messageId); trackTextToSpeech(); };
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMessageId(null); };
    window.speechSynthesis.speak(utterance);
  };

  // Other handlers
  const stopGeneration = () => { abortControllerRef.current?.abort(); abortControllerRef.current = null; setIsLoading(false); toast({ title: "Generation stopped" }); };
  const handleEditMessage = (index: number, newContent: string) => { if (isLoading) return; setMessages(messages.slice(0, index)); setEditingMessage(null); handleSendMessage(newContent, messages[index].attachment); };
  const handleRegenerate = (index: number) => { if (isLoading) return; const userMsg = messages[index - 1]; if (userMsg?.type === 'user') { setMessages(messages.slice(0, index)); handleSendMessage(userMsg.content, userMsg.attachment); } };
  const handleExportChat = () => { if (!checkAccess('chatExport')) return; const content = messages.filter(m => m.id !== 'welcome').map(m => `[${m.type.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n'); const blob = new Blob([content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `chat-${new Date().toISOString().split('T')[0]}.md`; a.click(); toast({ title: "Chat exported" }); };
  const handleManageSubscription = async () => { try { const { data: { session } } = await supabase.auth.getSession(); const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`, { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ returnUrl: window.location.href }) }); const { url } = await resp.json(); window.location.href = url; } catch { toast({ title: "Error", description: "Failed to open portal", variant: "destructive" }); } };
  
  // Special mode handlers
  const handleAnalyzeTask = async (task: string) => { setIsAnalyzingTask(true); try { const { data: { session } } = await supabase.auth.getSession(); const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ analyzeTask: task }) }); return await resp.json(); } finally { setIsAnalyzingTask(false); } };
  const handleGetEcoActions = async (location: string) => { setIsLoadingEcoActions(true); try { const { data: { session } } = await supabase.auth.getSession(); const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ getEcoActions: true, location }) }); return await resp.json(); } finally { setIsLoadingEcoActions(false); } };
  const handleSecurityAudit = async (code: string) => { setIsAnalyzingSecurity(true); try { const { data: { session } } = await supabase.auth.getSession(); const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ securityAudit: code }) }); return await resp.json(); } finally { setIsAnalyzingSecurity(false); } };

  const maxChats = isProOrHigher ? "∞" : "50";
  const showSuggestions = messages.length <= 1;
  const isSpecialMode = ['cpf', 'ppag', 'hsca'].includes(chatMode);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        {showSidebar && (
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onCreateNew={createNewConversation}
            onSelect={loadConversation}
            onDelete={deleteConversation}
            onClearAll={clearAllConversations}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-background to-muted/10">
          <AdBanner />
          
          <ChatHeader
            userPlan={userPlan}
            personality={personality}
            onPersonalityChange={setPersonality}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onExport={handleExportChat}
            onManageSubscription={handleManageSubscription}
            onSignOut={signOut}
            onOpenAnalytics={() => checkAccess('analyticsDashboard') && setShowAnalytics(true)}
            onOpenScriptAutomation={() => checkAccess('scriptAutomation') && setShowScriptAutomation(true)}
            onOpenStealthVault={() => checkAccess('stealthMode') && setShowStealthVault(true)}
            onOpenAgentWorkflows={() => checkAccess('aiAgents') && setShowAgentWorkflows(true)}
            onOpenModelFineTuning={() => checkAccess('modelFineTuning') && setShowModelFineTuning(true)}
            onOpenWhiteLabelBranding={() => checkAccess('whiteLabelBranding') && setShowWhiteLabelBranding(true)}
            onOpenGeminiAnalytics={() => setShowGeminiAnalytics(true)}
            onOpenCanvas={(type) => setCanvasState({ content: "", type, language: "javascript" })}
            onOpenDeepResearch={() => setShowDeepResearch(true)}
            onOpenAgenticRunner={() => setShowAgenticRunner(true)}
            onOpenVisualReasoning={() => setShowVisualReasoning(true)}
            onOpenCreativeSynthesis={() => setShowCreativeSynthesis(true)}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onOpenPerplexityPages={() => setShowPerplexityPages(true)}
            onOpenShadowCowork={() => setShowShadowCowork(true)}
            onOpenShadowTalkLive={() => setShowShadowTalkLive(true)}
            onOpenOfflineTools={() => setShowOfflineTools(true)}
            onOpenBrowser={() => setShowShadowBrowser(true)}
            aiProvider={aiProvider}
            onProviderChange={setAiProvider}
            maxChats={maxChats}
            dailyChats={dailyChats}
          />

          {/* Offline AI Indicator */}
          <div className="px-4 py-2 border-b border-border/50">
            <OfflineAIIndicator
              isOffline={isOffline}
              isModelLoaded={offlineAI.isModelLoaded}
              isLoading={offlineAI.isLoading}
              loadProgress={offlineAI.loadProgress}
              loadStage={offlineAI.loadStage}
              isSupported={offlineAI.isSupported}
              error={offlineAI.error}
              onLoadModel={offlineAI.initializeModel}
            />
          </div>

          {/* Special Mode Panels */}
          {chatMode === 'cpf' && <CognitiveLoadPanel onAnalyzeTask={handleAnalyzeTask} isAnalyzing={isAnalyzingTask} />}
          {chatMode === 'ppag' && <PlanetaryActionPanel onGetActions={handleGetEcoActions} isLoading={isLoadingEcoActions} />}
          {chatMode === 'hsca' && <SecurityAuditPanel onAnalyze={handleSecurityAudit} isAnalyzing={isAnalyzingSecurity} />}

          {/* Messages */}
          {!isSpecialMode && (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              showSuggestions={showSuggestions}
              personality={personality}
              userPlan={userPlan}
              speakingMessageId={speakingMessageId}
              isSpeaking={isSpeaking}
              onSelectPrompt={setMessage}
              onEdit={(index, content) => setEditingMessage({ index, content })}
              onRegenerate={handleRegenerate}
              onTextToSpeech={handleTextToSpeech}
              onOpenCodeCanvas={(code, lang) => setCodeWorkspace({ code, language: lang })}
              onOpenInBrowser={(url) => {
                setBrowserInitialUrl(url);
                setShowShadowBrowser(true);
              }}
              messagesEndRef={messagesEndRef}
            />
          )}

          <ChatInput
            message={message}
            onMessageChange={setMessage}
            onSend={() => handleSendMessage()}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            isLoading={isLoading}
            isListening={isListening}
            onToggleVoice={toggleVoiceInput}
            onOpenImageGenerator={() => setShowImageGenerator(true)}
            onStopGeneration={stopGeneration}
            selectedFile={selectedFile}
            onFileSelect={(file) => { setSelectedFile(file); if (file) trackFileUpload(file.mimeType); }}
            chatMode={chatMode}
            onModeChange={(mode) => { setChatMode(mode); trackModeSwitch(mode); }}
            personality={personality}
          />
        </div>
      </div>

      {/* Modals */}
      {showImageGenerator && (
        <ImageGenerator
          onClose={() => setShowImageGenerator(false)}
          onImageGenerated={(imageUrl, prompt) => {
            setShowImageGenerator(false);
            trackImageGeneration(prompt);
            setMessages(prev => [...prev, 
              { id: crypto.randomUUID(), type: 'user', content: `/imagine ${prompt}`, timestamp: new Date() },
              { 
                id: crypto.randomUUID(), 
                type: 'ai', 
                content: `🎨 **Image Generated**\n\nPrompt: "${prompt}"`, 
                timestamp: new Date(),
                imageUrl: imageUrl
              }
            ]);
          }}
        />
      )}

      {codeCanvas && <CodeCanvas code={codeCanvas.code} language={codeCanvas.language} onClose={() => { trackCodeExecution(codeCanvas.language); setCodeCanvas(null); }} />}
      {codeWorkspace && <CodeWorkspace initialCode={codeWorkspace.code} language={codeWorkspace.language} onClose={() => { trackCodeExecution(codeWorkspace.language); setCodeWorkspace(null); }} />}
      {editingMessage && <EditMessageDialog message={editingMessage.content} onSave={(c) => handleEditMessage(editingMessage.index, c)} onCancel={() => setEditingMessage(null)} />}
      {showAnalytics && <AnalyticsDashboard onClose={() => setShowAnalytics(false)} messageCount={messages.length} conversationCount={conversations.length} />}
      {showScriptAutomation && <ScriptAutomation onClose={() => setShowScriptAutomation(false)} onRunScript={(p) => { setShowScriptAutomation(false); handleSendMessage(p); }} />}
      {showStealthVault && <StealthVault isOpen={showStealthVault} onClose={() => setShowStealthVault(false)} />}
      {showAgentWorkflows && <AIAgentWorkflows isOpen={showAgentWorkflows} onClose={() => setShowAgentWorkflows(false)} onResult={(r) => { setShowAgentWorkflows(false); setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: r, timestamp: new Date() }]); }} />}
      {showModelFineTuning && <ModelFineTuning onClose={() => setShowModelFineTuning(false)} />}
      {showWhiteLabelBranding && <WhiteLabelBranding onClose={() => setShowWhiteLabelBranding(false)} />}
      {showGeminiAnalytics && <GeminiKeyAnalytics onClose={() => setShowGeminiAnalytics(false)} />}

      {/* Advanced AI Panels */}
      {showDeepResearch && (
        <DeepResearchPanel
          isOpen={showDeepResearch}
          onClose={() => setShowDeepResearch(false)}
          onInsertToChat={(content) => {
            setShowDeepResearch(false);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content, timestamp: new Date() }]);
          }}
        />
      )}
      {showAgenticRunner && (
        <AgenticTaskRunner
          isOpen={showAgenticRunner}
          onClose={() => setShowAgenticRunner(false)}
          onTaskComplete={(result) => {
            setShowAgenticRunner(false);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content: result, timestamp: new Date() }]);
          }}
        />
      )}
      {showVisualReasoning && (
        <VisualReasoning
          isOpen={showVisualReasoning}
          onClose={() => setShowVisualReasoning(false)}
          onInsertToChat={(content) => {
            setShowVisualReasoning(false);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content, timestamp: new Date() }]);
          }}
        />
      )}
      {showCreativeSynthesis && (
        <CreativeSynthesis
          isOpen={showCreativeSynthesis}
          onClose={() => setShowCreativeSynthesis(false)}
          onInsertToChat={(content) => {
            setShowCreativeSynthesis(false);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'ai', content, timestamp: new Date() }]);
          }}
        />
      )}
      
      {/* Perplexity Pages */}
      {showPerplexityPages && (
        <PerplexityPages
          isOpen={showPerplexityPages}
          onClose={() => setShowPerplexityPages(false)}
          messages={messages}
          conversationTitle={conversations.find(c => c.id === currentConversationId)?.title}
        />
      )}
      
      {/* Shadow Cowork Mode */}
      {showShadowCowork && (
        <ShadowCowork
          isOpen={showShadowCowork}
          onClose={() => setShowShadowCowork(false)}
          onInsertToChat={(content) => {
            setMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              type: 'ai', 
              content, 
              timestamp: new Date() 
            }]);
          }}
        />
      )}
      
      {/* ShadowTalk Live Mode */}
      {showShadowTalkLive && (
        <ShadowTalkLive
          isOpen={showShadowTalkLive}
          onClose={() => setShowShadowTalkLive(false)}
          onInsertToChat={(content) => {
            setMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              type: 'ai', 
              content, 
              timestamp: new Date() 
            }]);
          }}
        />
      )}
      
      {/* Canvas - ChatGPT-like document/code editor */}
      <Canvas
        isOpen={!!canvasState}
        onClose={() => setCanvasState(null)}
        initialContent={canvasState?.content || ""}
        initialType={canvasState?.type || "document"}
        initialLanguage={canvasState?.language || "javascript"}
        onSave={(content, type) => {
          // Save canvas content as a message in the chat
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'user',
            content: type === 'code' 
              ? `\`\`\`${canvasState?.language || 'javascript'}\n${content}\n\`\`\``
              : content,
            timestamp: new Date()
          }]);
          setCanvasState(null);
        }}
        onAIAssist={async (prompt, content) => {
          // Use the chat API to get AI assistance
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const resp = await fetch(CHAT_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
              },
              body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                personality: "professional",
                mode: "code"
              })
            });
            
            if (!resp.ok) throw new Error("Failed to get AI response");
            
            const reader = resp.body?.getReader();
            const decoder = new TextDecoder();
            let result = "";
            
            while (reader) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              
              // Parse SSE data
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) result += content;
                  } catch {}
                }
              }
            }
            
            return result || content;
          } catch (error) {
            console.error('Canvas AI assist error:', error);
            throw error;
          }
        }}
      />

      {/* Offline Tools Panel */}
      <OfflineToolsPanel
        isOpen={showOfflineTools}
        onClose={() => setShowOfflineTools(false)}
        onInsertToChat={(text) => {
          setMessage(prev => prev + text);
          setShowOfflineTools(false);
        }}
      />

      {/* ShadowBrowser - Integrated AI-Powered Browser */}
      <ShadowBrowser
        isOpen={showShadowBrowser}
        onClose={() => {
          setShowShadowBrowser(false);
          setBrowserInitialUrl(undefined);
        }}
        initialUrl={browserInitialUrl}
        onInsertToChat={(content) => {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'user',
            content,
            timestamp: new Date()
          }]);
        }}
      />

      {/* Welcome Dialog - Shown once per session after boot screen */}
      <WelcomeDialog 
        open={showWelcomeDialog} 
        onOpenChange={setShowWelcomeDialog} 
      />

      {/* Multi-Model Orchestrator - Enterprise AI */}
      <MultiModelOrchestrator
        isOpen={showMultiModel}
        onClose={() => setShowMultiModel(false)}
        onResult={(result) => {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'ai',
            content: result,
            timestamp: new Date()
          }]);
        }}
        initialPrompt={message}
      />

      {/* API Marketplace - Developer Portal */}
      <APIMarketplace
        isOpen={showAPIMarketplace}
        onClose={() => setShowAPIMarketplace(false)}
      />

      {/* Sign In Prompt - For guests who hit usage limits */}
      <SignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        reason={signInPromptReason}
        usedCount={guestUsage.usage[signInPromptReason === 'general' ? 'chats' : signInPromptReason]}
        limitCount={GUEST_LIMITS[signInPromptReason === 'general' ? 'chats' : signInPromptReason]}
      />
    </div>
  );
};

export default ChatbotPage;
