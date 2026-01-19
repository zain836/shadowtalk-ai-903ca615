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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed z-50 bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col ${
        isFullscreen
          ? "inset-0 rounded-none"
          : "right-4 top-4 bottom-4 w-[85vw] max-w-6xl"
      }`}
    >
      {/* Browser Header */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/30">
        {/* Tab Bar */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[120px] max-w-[200px] transition-colors ${
                  tab.id === activeTabId
                    ? "bg-background border-t border-x border-border"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {tab.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                ) : (
                  <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="text-xs truncate flex-1">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={addNewTab}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </ScrollArea>
        
        {/* Window controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
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
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                onClick={() => navigateTo(DEFAULT_HOME)}
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
        </div>
        
        {/* URL Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter URL..."
              className="pl-9 pr-20 h-9"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={toggleBookmark}
                  >
                    {isBookmarked ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isBookmarked ? "Remove bookmark" : "Bookmark"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2"
                onClick={getPageContext}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs hidden sm:inline">AI Analyze</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Get AI summary of this page</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
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
        {/* AI Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border flex flex-col bg-muted/20 overflow-hidden"
            >
              {/* Browse Together Header */}
              <div className="p-2 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Browse Together</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={browseTogetherEnabled}
                      onCheckedChange={setBrowseTogetherEnabled}
                      className="scale-75"
                    />
                  </div>
                </div>
                {browseTogetherEnabled && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>AI is watching and helping</span>
                    <label className="flex items-center gap-1 ml-auto cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAnalyze}
                        onChange={(e) => setAutoAnalyze(e.target.checked)}
                        className="h-3 w-3 rounded"
                      />
                      Auto-analyze
                    </label>
                  </div>
                )}
              </div>
              
              {/* Sidebar Tabs */}
              <Tabs value={sidebarMode} onValueChange={(v) => setSidebarMode(v as typeof sidebarMode)}>
                <TabsList className="w-full grid grid-cols-4 m-2 mr-2">
                  <TabsTrigger value="together" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="bookmarks" className="text-xs gap-1">
                    <Bookmark className="h-3 w-3" />
                    Saved
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <ScrollArea className="flex-1">
                {/* Browse Together Mode */}
                {sidebarMode === "together" && browseTogetherEnabled && (
                  <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 p-3 space-y-3 min-h-0 overflow-y-auto">
                      {browseTogetherMessages.length === 0 && (
                        <div className="text-center py-8 space-y-3">
                          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
                          <div>
                            <p className="text-sm font-medium">Browse Together Mode</p>
                            <p className="text-xs text-muted-foreground">
                              AI will analyze pages and answer your questions
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => analyzePageForBrowseTogether()}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Analyze Page
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => browseTogetherQuickAction("What is this page about?")}
                            >
                              <HelpCircle className="h-3 w-3 mr-1" />
                              What's this?
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {browseTogetherMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : msg.role === "system"
                                ? "bg-muted text-muted-foreground italic w-full text-center"
                                : "bg-muted"
                            }`}
                          >
                            {msg.type === "suggestion" && (
                              <div className="flex items-center gap-1 mb-1 text-primary">
                                <Lightbulb className="h-3 w-3" />
                                <span className="text-[10px] font-medium">Suggestion</span>
                              </div>
                            )}
                            {msg.type === "summary" && (
                              <div className="flex items-center gap-1 mb-1 text-primary">
                                <FileText className="h-3 w-3" />
                                <span className="text-[10px] font-medium">Summary</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.role === "ai" && msg.content && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[10px] px-1 mt-1 -ml-1"
                                onClick={() => sendToChat(msg.content)}
                              >
                                <MessageSquare className="h-2.5 w-2.5 mr-1" />
                                Send to main chat
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isAIThinking && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          AI is thinking...
                        </div>
                      )}
                    </div>
                    
                    {/* Page Insights */}
                    {pageInsights.length > 0 && (
                      <div className="p-3 border-t border-border space-y-2">
                        <h4 className="text-xs font-medium flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-yellow-500" />
                          Key Insights
                        </h4>
                        <div className="space-y-1">
                          {pageInsights.slice(0, 3).map((insight, i) => (
                            <div key={i} className="text-[10px] text-muted-foreground flex gap-1">
                              <span className="text-primary">•</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Related Content */}
                    {relatedContent.length > 0 && (
                      <div className="p-3 border-t border-border space-y-2">
                        <h4 className="text-xs font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {relatedContent.slice(0, 4).map((content, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => navigateTo(content.url)}
                            >
                              <Link2 className="h-2.5 w-2.5 mr-1" />
                              {content.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="p-3 border-t border-border">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => browseTogetherQuickAction("Summarize this page in bullet points")}
                        >
                          Summarize
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => browseTogetherQuickAction("What are the key takeaways from this page?")}
                        >
                          Key Points
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => browseTogetherQuickAction("Find similar websites or content")}
                        >
                          Find Similar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={clearBrowseTogetherChat}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      
                      {/* Input */}
                      <div className="flex gap-2">
                        <Textarea
                          value={browseTogetherInput}
                          onChange={(e) => setBrowseTogetherInput(e.target.value)}
                          placeholder="Ask about this page..."
                          className="min-h-[60px] text-xs resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              askBrowseTogetherQuestion();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-auto"
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
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-sm font-medium mb-2">Browse Together is Off</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Enable it to get AI assistance while browsing
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBrowseTogetherEnabled(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Enable Browse Together
                    </Button>
                  </div>
                )}
                
                {/* AI Search Mode */}
                {sidebarMode === "ai" && (
                  <div className="space-y-4 p-3">
                    {/* AI Search */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        AI Web Search
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ask anything..."
                          className="h-8 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && performAISearch()}
                        />
                        <Button
                          size="sm"
                          className="h-8"
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
                    
                    {/* AI Summary */}
                    {aiSummary && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          AI Summary
                        </h3>
                        <div className="p-3 bg-background rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-[20]">
                            {aiSummary}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => sendToChat(aiSummary)}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Send to Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Quick Links</h3>
                        <div className="space-y-2">
                          {searchResults.map((result, i) => (
                            <button
                              key={i}
                              onClick={() => navigateTo(result.url)}
                              className="w-full text-left p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            >
                              <div className="text-xs font-medium truncate">
                                {result.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {result.url}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex-col gap-1"
                          onClick={() => {
                            setSearchQuery("Latest news today");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-[10px]">News</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex-col gap-1"
                          onClick={() => {
                            setSearchQuery("Weather forecast");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-[10px]">Weather</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex-col gap-1"
                          onClick={() => {
                            setSearchQuery("Trending topics");
                            setTimeout(performAISearch, 100);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="text-[10px]">Trending</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex-col gap-1"
                          onClick={getPageContext}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span className="text-[10px]">Analyze</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bookmarks Mode */}
                {sidebarMode === "bookmarks" && (
                  <div className="space-y-2">
                    {bookmarks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No bookmarks yet. Star pages to save them!
                      </p>
                    ) : (
                      bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                        >
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <button
                            onClick={() => navigateTo(bookmark.url)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="text-sm truncate">{bookmark.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {bookmark.url}
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id))
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* History Mode */}
                {sidebarMode === "history" && (
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No browsing history yet.
                      </p>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setHistory([])}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear History
                        </Button>
                        {history.slice(0, 50).map((item, i) => (
                          <button
                            key={i}
                            onClick={() => navigateTo(item.url)}
                            className="w-full text-left p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="text-sm truncate">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {item.url}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Browser Content */}
        <div className="flex-1 bg-white relative">
          {activeTab.isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
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
          
          {/* Fallback message for blocked iframes */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-center pointer-events-auto">
              <p className="text-xs text-muted-foreground">
                Some websites block embedding. 
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs ml-1"
                  onClick={() => window.open(activeTab.url, "_blank")}
                >
                  Open in new tab <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShadowBrowser;
