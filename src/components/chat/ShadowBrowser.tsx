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
  const [sidebarMode, setSidebarMode] = useState<"ai" | "bookmarks" | "history">("ai");
  
  // AI Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  
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
  
  // Send to chat
  const sendToChat = (content: string) => {
    if (onInsertToChat) {
      onInsertToChat(content);
      toast({ title: "Sent to chat" });
    }
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
              {/* Sidebar Tabs */}
              <Tabs value={sidebarMode} onValueChange={(v) => setSidebarMode(v as typeof sidebarMode)}>
                <TabsList className="w-full grid grid-cols-3 m-2 mr-2">
                  <TabsTrigger value="ai" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI
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
              
              <ScrollArea className="flex-1 p-3">
                {/* AI Search Mode */}
                {sidebarMode === "ai" && (
                  <div className="space-y-4">
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
