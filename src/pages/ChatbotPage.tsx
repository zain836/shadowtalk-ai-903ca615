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
import CognitiveLoadPanel from "@/components/chat/CognitiveLoadPanel";
import PlanetaryActionPanel from "@/components/chat/PlanetaryActionPanel";
import SecurityAuditPanel from "@/components/chat/SecurityAuditPanel";
import { OfflineAIIndicator } from "@/components/chat/OfflineAIIndicator";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineAI } from "@/hooks/useOfflineAI";

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
type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive";

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
  const [editingMessage, setEditingMessage] = useState<{ index: number; content: string } | null>(null);
  
  // Special mode state
  const [isAnalyzingTask, setIsAnalyzingTask] = useState(false);
  const [isLoadingEcoActions, setIsLoadingEcoActions] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  
  // Hooks
  const { canAccess, checkAccess, getDailyMessageLimit, isProOrHigher, isElite } = useFeatureGating();
  const { isOffline, isOfflineModeAvailable, getOfflineResponse } = useOfflineMode();
  const { requestPermission } = usePushNotifications();
  const { trackChatMessage, trackImageGeneration, trackVoiceInput, trackTextToSpeech, trackCodeExecution, trackFileUpload, trackModeSwitch, trackConversationCreated } = useUsageTracking();
  const { getOfflineSession } = useOfflineAuth();
  const offlineAI = useOfflineAI();
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    // Check for offline session first
    const offlineSession = getOfflineSession();
    
    if (!user && !offlineSession) {
      navigate('/auth');
    } else if (user || offlineSession) {
      if (!isOffline) {
        loadConversations();
        checkSubscription();
      }
      // Request push notification permission for Elite users
      if (isElite && !isOffline) requestPermission();
    }
  }, [user, navigate, isElite, isOffline, getOfflineSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      if (data.length > 0 && !currentConversationId) {
        loadConversation(data[0].id);
      } else if (data.length === 0) {
        createNewConversation();
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
      const loadedMessages: Message[] = data.map(m => ({
        id: m.id,
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content,
        timestamp: new Date(m.created_at)
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
      friendly: "👋 Hi there! I'm ShadowTalk AI, your intelligent assistant. How can I help you today?",
      sarcastic: "Oh great, another conversation. Just kidding! 😏 What can I do for you?",
      professional: "Welcome. I'm here to assist you with any questions or tasks. How may I help?",
      creative: "✨ Hello, creative soul! Ready to explore ideas together? What's on your mind?",
      meticulous: "Welcome. I'll ensure every detail is covered. What would you like me to analyze thoroughly?",
      curious: "Hello! I'm excited to learn about your challenge. What shall we explore together?",
      diplomatic: "Good to see you. I'm here to help navigate any situation with care. How may I assist?",
      witty: "Ah, a new conversation! The plot thickens. What intellectual adventure awaits us today?",
      pragmatic: "Let's get down to business. What's the most practical problem I can help you solve today?",
      inquisitive: "Welcome! To serve you best, I'll need to understand your needs precisely. What can I help with?"
    };
    return messages[personality];
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

  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!user || !currentConversationId) return null;
    
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: currentConversationId, user_id: user.id, content, role, personality })
      .select()
      .single();
    
    if (role === 'user' && messages.length <= 1) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
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
    
    const limit = getDailyMessageLimit();
    if (limit !== Infinity && dailyChats >= limit) {
      toast({ title: "Daily Limit Reached", description: `Upgrade to Pro for unlimited messages!`, variant: "destructive" });
      return;
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

    // Offline mode - use local AI if available
    if (isOffline) {
      if (offlineAI.isModelLoaded || offlineAI.isSupported) {
        try {
          // Initialize model if needed
          if (!offlineAI.isModelLoaded) {
            const loaded = await offlineAI.initializeModel();
            if (!loaded) {
              // Fall back to basic offline responses
              const offlineResponse = getOfflineResponse(messageToSend);
              setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: offlineResponse, timestamp: new Date() }]);
              setIsLoading(false);
              return;
            }
          }
          
          // Use local AI for response
          const aiMessageId = crypto.randomUUID();
          setMessages(prev => [...prev, { id: aiMessageId, type: "ai", content: "", timestamp: new Date() }]);
          
          const offlineMessages = messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.type === 'user' ? 'user' as const : 'assistant' as const, content: m.content }));
          offlineMessages.push({ role: 'user' as const, content: messageToSend });
          
          await offlineAI.generateResponse(offlineMessages, (chunk) => {
            setMessages(prev => prev.map(m => 
              m.id === aiMessageId ? { ...m, content: m.content + chunk } : m
            ));
          });
          
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Offline AI error:', e);
          // Fall back to basic responses
          const offlineResponse = getOfflineResponse(messageToSend);
          setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: offlineResponse, timestamp: new Date() }]);
          setIsLoading(false);
          return;
        }
      } else if (isOfflineModeAvailable) {
        const offlineResponse = getOfflineResponse(messageToSend);
        setMessages(prev => [...prev, { id: crypto.randomUUID(), type: "ai", content: offlineResponse, timestamp: new Date() }]);
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
        if (isResearchMode) {
          requestBody = { deepResearch: true, researchQuery: messageToSend };
        } else {
          requestBody = { messages: chatMessages, personality, mode: chatMode, modePrompt: getModePrompt(chatMode) };
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

        if (!resp.ok) throw new Error((await resp.json()).error || "Failed to get response");

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
    </div>
  );
};

export default ChatbotPage;
