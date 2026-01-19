import { useState, useRef, useCallback, useEffect } from "react";
import {
  Globe,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Maximize2,
  Minimize2,
  Star,
  StarOff,
  ExternalLink,
  Sparkles,
  BookOpen,
  FileText,
  Loader2,
  Home,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Bookmark,
  Clock,
  ChevronDown,
  Users,
  Lightbulb,
  Send,
  Zap,
  Eye,
  Link2,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  aiContext?: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: Date;
}

interface HistoryItem {
  url: string;
  title: string;
  visitedAt: Date;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

interface BrowseTogetherMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  type?: "suggestion" | "summary" | "question" | "answer" | "insight";
}

interface RelatedContent {
  title: string;
  url: string;
  relevance: string;
}

interface ShadowBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (content: string) => void;
  initialUrl?: string;
}

const DEFAULT_HOME = "https://www.google.com";
const PROXY_DOMAINS = ["google.com", "youtube.com", "github.com", "wikipedia.org"];

export const ShadowBrowser = ({
  isOpen,
  onClose,
  onInsertToChat,
  initialUrl,
}: ShadowBrowserProps) => {
  const { toast } = useToast();
  
  // Core state
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: crypto.randomUUID(),
      url: initialUrl || DEFAULT_HOME,
      title: "New Tab",
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [urlInput, setUrlInput] = useState(initialUrl || DEFAULT_HOME);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarMode, setSidebarMode] = useState<"ai" | "bookmarks" | "history" | "together">("together");
  
  // AI Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  
  // Browse Together state
  const [browseTogetherEnabled, setBrowseTogetherEnabled] = useState(true);
  const [browseTogetherMessages, setBrowseTogetherMessages] = useState<BrowseTogetherMessage[]>([]);
  const [browseTogetherInput, setBrowseTogetherInput] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);
  const [pageInsights, setPageInsights] = useState<string[]>([]);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const lastAnalyzedUrl = useRef<string>("");
  
  // Bookmarks & History
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem("shadow-browser-bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("shadow-browser-history");
    return saved ? JSON.parse(saved) : [];
  });
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Get active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  
  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem("shadow-browser-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);
  
  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("shadow-browser-history", JSON.stringify(history.slice(0, 100)));
  }, [history]);
  
  // Update URL input when active tab changes
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);
  
  // Format URL for navigation
  const formatUrl = (input: string): string => {
    let url = input.trim();
    
    // Check if it's a search query
    if (!url.includes(".") || url.includes(" ")) {
      return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }
    
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    return url;
  };
  
  // Navigate to URL
  const navigateTo = useCallback((url: string) => {
    const formattedUrl = formatUrl(url);
    
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, url: formattedUrl, isLoading: true, title: "Loading..." }
          : tab
      )
    );
    setUrlInput(formattedUrl);
    
    // Add to history
    setHistory((prev) => [
      { url: formattedUrl, title: formattedUrl, visitedAt: new Date() },
      ...prev.filter((h) => h.url !== formattedUrl),
    ]);
  }, [activeTabId]);
  
  // Handle URL submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };
  
  // Tab management
  const addNewTab = () => {
    const newTab: BrowserTab = {
      id: crypto.randomUUID(),
      url: DEFAULT_HOME,
      title: "New Tab",
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput(DEFAULT_HOME);
  };
  
  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      // Don't close the last tab, just reset it
      setTabs([
        {
          id: crypto.randomUUID(),
          url: DEFAULT_HOME,
          title: "New Tab",
          isLoading: true,
          canGoBack: false,
          canGoForward: false,
        },
      ]);
      setActiveTabId(tabs[0].id);
      return;
    }
    
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    
    // If closing active tab, switch to adjacent tab
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  };
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, isLoading: false }
          : tab
      )
    );
    
    // Try to get page title (may fail due to CORS)
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument?.title) {
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId
              ? { ...tab, title: iframe.contentDocument?.title || tab.url }
              : tab
          )
        );
      }
    } catch (e) {
      // CORS restriction - use URL as title
      const domain = new URL(activeTab.url).hostname;
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, title: domain }
            : tab
        )
      );
    }
  };
  
  // Bookmark management
  const isBookmarked = bookmarks.some((b) => b.url === activeTab?.url);
  
  const toggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
      toast({ title: "Bookmark removed" });
    } else {
      setBookmarks((prev) => [
        {
          id: crypto.randomUUID(),
          url: activeTab.url,
          title: activeTab.title,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      toast({ title: "Bookmark added" });
    }
  };
  
  // AI-powered web search
  const performAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setAiSummary("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call chat function with web search mode
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: searchQuery }],
            personality: "professional",
            webSearch: true,
            searchQuery: searchQuery,
          }),
        }
      );
      
      if (!response.ok) throw new Error("Search failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setAiSummary(fullContent);
              }
            } catch {}
          }
        }
      }
      
      // Extract URLs from the response for quick navigation
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const urls = fullContent.match(urlRegex) || [];
      const results: SearchResult[] = urls.slice(0, 5).map((url) => {
        let domain = "";
        try {
          domain = new URL(url).hostname;
        } catch {
          domain = url.slice(0, 30);
        }
        return {
          title: domain,
          url: url.replace(/[.,;:!?)]+$/, ""),
          snippet: "Found in AI response",
          domain,
        };
      });
      
      setSearchResults(results);
      
    } catch (error) {
      console.error("AI search error:", error);
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Get AI context for current page
  const getPageContext = async () => {
    toast({
      title: "Analyzing page...",
      description: "AI is reading this webpage.",
    });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Summarize this webpage: ${activeTab.url}. Provide key points and main content.`,
              },
            ],
            personality: "professional",
          }),
        }
      );
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let context = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) context += content;
            } catch {}
          }
        }
      }
      
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, aiContext: context } : tab
        )
      );
      
      setAiSummary(context);
      setSidebarMode("ai");
      
      toast({ title: "Page analyzed", description: "AI summary ready!" });
      
    } catch (error) {
      console.error("Page context error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze this page.",
        variant: "destructive",
      });
    }
  };
  
  // Browse Together: Auto-analyze page when URL changes
  useEffect(() => {
    if (browseTogetherEnabled && autoAnalyze && activeTab?.url && activeTab.url !== lastAnalyzedUrl.current) {
      const timer = setTimeout(() => {
        if (activeTab.url !== DEFAULT_HOME && !activeTab.url.includes("google.com/search")) {
          analyzePageForBrowseTogether();
          lastAnalyzedUrl.current = activeTab.url;
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTab?.url, browseTogetherEnabled, autoAnalyze]);
  
  // Browse Together: Analyze current page
  const analyzePageForBrowseTogether = async () => {
    if (!activeTab?.url || activeTab.url === DEFAULT_HOME) return;
    
    setIsAIThinking(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const systemMessage: BrowseTogetherMessage = {
        id: crypto.randomUUID(),
        role: "system",
        content: `📍 Now viewing: ${activeTab.title || new URL(activeTab.url).hostname}`,
        timestamp: new Date(),
      };
      setBrowseTogetherMessages(prev => [...prev, systemMessage]);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `You are a helpful AI browsing assistant in "Browse Together" mode. The user is viewing: ${activeTab.url}

Provide a helpful response in this exact JSON format:
{
  "summary": "A brief 2-3 sentence summary of what this page is about",
  "insights": ["3-4 key insights or interesting facts about this page/topic"],
  "relatedTopics": [{"title": "Related Topic 1", "searchQuery": "search query for it"}, {"title": "Related Topic 2", "searchQuery": "search query"}],
  "suggestedQuestions": ["What would you like to know about X?", "Should I explain Y?", "Want me to find more about Z?"]
}

Be concise and helpful.`,
              },
            ],
            personality: "professional",
          }),
        }
      );
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
      }
      
      // Parse the AI response
      try {
        // Extract JSON from the response
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Add summary message
          if (parsed.summary) {
            const summaryMessage: BrowseTogetherMessage = {
              id: crypto.randomUUID(),
              role: "ai",
              content: parsed.summary,
              timestamp: new Date(),
              type: "summary",
            };
            setBrowseTogetherMessages(prev => [...prev, summaryMessage]);
          }
          
          // Set insights
          if (parsed.insights) {
            setPageInsights(parsed.insights);
          }
          
          // Set related content
          if (parsed.relatedTopics) {
            setRelatedContent(parsed.relatedTopics.map((t: any) => ({
              title: t.title,
              url: `https://www.google.com/search?q=${encodeURIComponent(t.searchQuery)}`,
              relevance: "Related topic",
            })));
          }
          
          // Add suggested question
          if (parsed.suggestedQuestions?.[0]) {
            const suggestionMessage: BrowseTogetherMessage = {
              id: crypto.randomUUID(),
              role: "ai",
              content: parsed.suggestedQuestions[0],
              timestamp: new Date(),
              type: "suggestion",
            };
            setBrowseTogetherMessages(prev => [...prev, suggestionMessage]);
          }
        }
      } catch {
        // If parsing fails, just add the raw summary
        const aiMessage: BrowseTogetherMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: fullContent.slice(0, 500),
          timestamp: new Date(),
          type: "summary",
        };
        setBrowseTogetherMessages(prev => [...prev, aiMessage]);
      }
      
    } catch (error) {
      console.error("Browse Together analysis error:", error);
    } finally {
      setIsAIThinking(false);
    }
  };
  
  // Browse Together: Ask question about current page
  const askBrowseTogetherQuestion = async () => {
    if (!browseTogetherInput.trim()) return;
    
    const userMessage: BrowseTogetherMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: browseTogetherInput,
      timestamp: new Date(),
      type: "question",
    };
    setBrowseTogetherMessages(prev => [...prev, userMessage]);
    setBrowseTogetherInput("");
    setIsAIThinking(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are a helpful AI browsing assistant. The user is currently viewing: ${activeTab?.url}. Answer their question about this page or help them browse. Be concise and helpful.`,
              },
              {
                role: "user",
                content: browseTogetherInput,
              },
            ],
            personality: "professional",
          }),
        }
      );
      
      if (!response.ok) throw new Error("Question failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      const aiMessage: BrowseTogetherMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "",
        timestamp: new Date(),
        type: "answer",
      };
      setBrowseTogetherMessages(prev => [...prev, aiMessage]);
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setBrowseTogetherMessages(prev => 
                  prev.map(m => m.id === aiMessage.id ? { ...m, content: fullContent } : m)
                );
              }
            } catch {}
          }
        }
      }
      
    } catch (error) {
      console.error("Browse Together question error:", error);
      toast({
        title: "Couldn't get an answer",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAIThinking(false);
    }
  };
  
  // Browse Together: Quick actions
  const browseTogetherQuickAction = async (action: string) => {
    setBrowseTogetherInput(action);
    setTimeout(() => {
      askBrowseTogetherQuestion();
    }, 100);
  };
  
  // Send to chat
  const sendToChat = (content: string) => {
    if (onInsertToChat) {
      onInsertToChat(content);
      toast({ title: "Sent to chat" });
    }
  };
  
  // Clear Browse Together conversation
  const clearBrowseTogetherChat = () => {
    setBrowseTogetherMessages([]);
    setPageInsights([]);
    setRelatedContent([]);
    lastAnalyzedUrl.current = "";
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed z-50 bg-gradient-to-br from-background via-background to-primary/5 border border-border/50 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col ${
        isFullscreen
          ? "inset-0"
          : "right-4 top-4 bottom-4 w-[85vw] max-w-6xl rounded-2xl"
      }`}
    >
      {/* Browser Header - Glassmorphism Tab Bar */}
      <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 backdrop-blur-xl">
        {/* Tab Bar */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer min-w-[140px] max-w-[220px] transition-all duration-200 ${
                  tab.id === activeTabId
                    ? "bg-background shadow-lg shadow-primary/10 border border-border/50"
                    : "bg-muted/40 hover:bg-muted/70 border border-transparent"
                }`}
              >
                {tab.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                    <Globe className="h-2.5 w-2.5 text-primary" />
                  </div>
                )}
                <span className="text-xs font-medium truncate flex-1">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-full p-1 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={addNewTab}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Tab</TooltipContent>
            </Tooltip>
          </div>
        </ScrollArea>
        
        {/* Window controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close Browser</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Navigation Bar - Premium Design */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 bg-gradient-to-r from-background via-muted/20 to-background">
        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg disabled:opacity-30"
                disabled={!activeTab.canGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg disabled:opacity-30"
                disabled={!activeTab.canGoForward}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => navigateTo(activeTab.url)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => navigateTo(DEFAULT_HOME)}
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
        </div>
        
        {/* URL Bar - Premium Style */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="relative flex-1 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <Globe className="h-3 w-3 text-primary" />
            </div>
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter URL..."
              className="pl-11 pr-24 h-10 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm font-medium"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg hover:bg-yellow-500/10"
                    onClick={toggleBookmark}
                  >
                    {isBookmarked ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isBookmarked ? "Remove bookmark" : "Bookmark"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>
        
        {/* Action buttons - Premium */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-3 rounded-lg hover:bg-primary/10 group"
                onClick={getPageContext}
              >
                <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
                <span className="text-xs font-medium hidden sm:inline">AI Analyze</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Get AI summary of this page</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-5 bg-border/50" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showSidebar ? "Hide sidebar" : "Show sidebar"}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => window.open(activeTab.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new window</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Sidebar - Premium Glassmorphism */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border/50 flex flex-col bg-gradient-to-b from-muted/30 via-background to-muted/20 overflow-hidden"
            >
              {/* Browse Together Header - Premium */}
              <div className="p-3 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Browse Together</span>
                      {browseTogetherEnabled && (
                        <div className="flex items-center gap-1 text-[10px] text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={browseTogetherEnabled}
                    onCheckedChange={setBrowseTogetherEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                {browseTogetherEnabled && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2 p-2 rounded-lg bg-muted/50">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>AI is watching and helping</span>
                    <label className="flex items-center gap-1.5 ml-auto cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={autoAnalyze}
                        onChange={(e) => setAutoAnalyze(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-primary/50 text-primary focus:ring-primary/50"
                      />
                      Auto-analyze
                    </label>
                  </div>
                )}
              </div>
              
              {/* Sidebar Tabs - Premium */}
              <Tabs value={sidebarMode} onValueChange={(v) => setSidebarMode(v as typeof sidebarMode)}>
                <TabsList className="w-full grid grid-cols-4 mx-3 mt-3 mb-2 bg-muted/50 p-1 rounded-xl" style={{ width: 'calc(100% - 24px)' }}>
                  <TabsTrigger value="together" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="h-3.5 w-3.5" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="bookmarks" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Bookmark className="h-3.5 w-3.5" />
                    Saved
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                    History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <ScrollArea className="flex-1">
                {/* Browse Together Mode - Premium */}
                {sidebarMode === "together" && browseTogetherEnabled && (
                  <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-3 min-h-0 overflow-y-auto">
                      {browseTogetherMessages.length === 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-8 space-y-4"
                        >
                          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                            <Users className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Browse Together Mode</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              AI will analyze pages and answer your questions
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 text-xs rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                              onClick={() => analyzePageForBrowseTogether()}
                            >
                              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
                              Analyze Page
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 text-xs rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                              onClick={() => browseTogetherQuickAction("What is this page about?")}
                            >
                              <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                              What's this?
                            </Button>
                          </div>
                        </motion.div>
                      )}
                      
                      {browseTogetherMessages.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                                : msg.role === "system"
                                ? "bg-muted/50 text-muted-foreground italic w-full text-center rounded-xl py-2"
                                : "bg-muted/70 border border-border/50 shadow-sm"
                            }`}
                          >
                            {msg.type === "suggestion" && (
                              <div className="flex items-center gap-1.5 mb-1.5 text-yellow-500">
                                <Lightbulb className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold">Suggestion</span>
                              </div>
                            )}
                            {msg.type === "summary" && (
                              <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold">Summary</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            {msg.role === "ai" && msg.content && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2 mt-2 -ml-1 hover:bg-background/50 rounded-lg"
                                onClick={() => sendToChat(msg.content)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Send to main chat
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      {isAIThinking && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          AI is thinking...
                        </div>
                      )}
                    </div>
                    
                    {/* Page Insights - Premium */}
                    {pageInsights.length > 0 && (
                      <div className="p-4 border-t border-border/50 space-y-3 bg-gradient-to-b from-transparent to-yellow-500/5">
                        <h4 className="text-xs font-semibold flex items-center gap-2">
                          <div className="h-5 w-5 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Lightbulb className="h-3 w-3 text-yellow-500" />
                          </div>
                          Key Insights
                        </h4>
                        <div className="space-y-2">
                          {pageInsights.slice(0, 3).map((insight, i) => (
                            <div key={i} className="text-[11px] text-muted-foreground flex gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <span className="text-yellow-500 font-bold">•</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Related Content - Premium */}
                    {relatedContent.length > 0 && (
                      <div className="p-4 border-t border-border/50 space-y-3">
                        <h4 className="text-xs font-semibold flex items-center gap-2">
                          <div className="h-5 w-5 rounded-lg bg-primary/20 flex items-center justify-center">
                            <TrendingUp className="h-3 w-3 text-primary" />
                          </div>
                          Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {relatedContent.slice(0, 4).map((content, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] px-3 rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                              onClick={() => navigateTo(content.url)}
                            >
                              <Link2 className="h-3 w-3 mr-1 text-primary" />
                              {content.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Actions & Input - Premium */}
                    <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => browseTogetherQuickAction("Summarize this page in bullet points")}
                        >
                          Summarize
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => browseTogetherQuickAction("What are the key takeaways from this page?")}
                        >
                          Key Points
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => browseTogetherQuickAction("Find similar websites or content")}
                        >
                          Find Similar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all ml-auto"
                          onClick={clearBrowseTogetherChat}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Input - Premium */}
                      <div className="flex gap-2">
                        <Textarea
                          value={browseTogetherInput}
                          onChange={(e) => setBrowseTogetherInput(e.target.value)}
                          placeholder="Ask about this page..."
                          className="min-h-[50px] text-xs resize-none rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              askBrowseTogetherQuestion();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-auto px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all"
                          onClick={askBrowseTogetherQuestion}
                          disabled={isAIThinking || !browseTogetherInput.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {sidebarMode === "together" && !browseTogetherEnabled && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-6">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Browse Together is Off</h3>
                    <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">
                      Enable it to get AI assistance while browsing
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                      onClick={() => setBrowseTogetherEnabled(true)}
                    >
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      Enable Browse Together
                    </Button>
                  </motion.div>
                )}
                
                {/* AI Search Mode - Premium */}
                {sidebarMode === "ai" && (
                  <div className="space-y-5 p-4">
                    {/* AI Search - Premium */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Search className="h-3.5 w-3.5 text-primary" />
                        </div>
                        AI Web Search
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ask anything..."
                          className="h-10 text-sm rounded-xl bg-muted/50 border-border/50 focus:border-primary/50"
                          onKeyDown={(e) => e.key === "Enter" && performAISearch()}
                        />
                        <Button
                          size="sm"
                          className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                          onClick={performAISearch}
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* AI Summary - Premium */}
                    {aiSummary && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </div>
                          AI Summary
                        </h3>
                        <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-border/50">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-[20] leading-relaxed">
                            {aiSummary}
                          </p>
                          <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs rounded-lg border-primary/20 hover:bg-primary/10"
                              onClick={() => sendToChat(aiSummary)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              Send to Chat
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Search Results - Premium */}
                    {searchResults.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Quick Links</h3>
                        <div className="space-y-2">
                          {searchResults.map((result, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => navigateTo(result.url)}
                              className="w-full text-left p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                            >
                              <div className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {result.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {result.url}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Actions - Premium */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-3 flex-col gap-1.5 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={() => {
                            setSearchQuery("Latest news today");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-[10px]">News</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-3 flex-col gap-1.5 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={() => {
                            setSearchQuery("Weather forecast");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-[10px]">Weather</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-3 flex-col gap-1.5 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={() => {
                            setSearchQuery("Trending topics");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-[10px]">Trending</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-3 flex-col gap-1.5 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={getPageContext}
                        >
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-[10px]">Analyze</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bookmarks Mode - Premium */}
                {sidebarMode === "bookmarks" && (
                  <div className="p-4 space-y-2">
                    {bookmarks.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/30 flex items-center justify-center mb-4">
                          <Star className="h-8 w-8 text-yellow-500/50" />
                        </div>
                        <p className="text-sm font-medium mb-1">No bookmarks yet</p>
                        <p className="text-xs text-muted-foreground">
                          Star pages to save them here
                        </p>
                      </motion.div>
                    ) : (
                      bookmarks.map((bookmark, i) => (
                        <motion.div
                          key={bookmark.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 group border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/40 flex items-center justify-center shrink-0">
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                          <button
                            onClick={() => navigateTo(bookmark.url)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="text-sm font-medium truncate">{bookmark.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {bookmark.url}
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={() =>
                              setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
                
                {/* History Mode - Premium */}
                {sidebarMode === "history" && (
                  <div className="p-4 space-y-3">
                    {history.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-4">
                          <Clock className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium mb-1">No history yet</p>
                        <p className="text-xs text-muted-foreground">
                          Your browsing history will appear here
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs rounded-xl border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-all"
                          onClick={() => setHistory([])}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Clear History
                        </Button>
                        <div className="space-y-1">
                          {history.slice(0, 50).map((item, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              onClick={() => navigateTo(item.url)}
                              className="w-full text-left p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                            >
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {item.url}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Browser Content - Premium */}
        <div className="flex-1 bg-white dark:bg-zinc-900 relative">
          {activeTab.isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Loading page...</span>
              </div>
            </motion.div>
          )}
          
          {/* Iframe for browsing */}
          <iframe
            ref={iframeRef}
            src={activeTab.url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Browser"
          />
          
          {/* Fallback message for blocked iframes - Premium */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none max-w-md w-full px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-background/95 backdrop-blur-lg border border-border/50 rounded-2xl px-4 py-3 text-center pointer-events-auto shadow-xl"
            >
              <p className="text-xs text-muted-foreground">
                Some websites block embedding. 
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs ml-1 text-primary hover:text-primary/80"
                  onClick={() => window.open(activeTab.url, "_blank")}
                >
                  Open in new tab <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShadowBrowser;
