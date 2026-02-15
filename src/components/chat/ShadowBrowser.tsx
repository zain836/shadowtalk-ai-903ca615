import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Globe, X, Plus, ArrowLeft, ArrowRight, RotateCw, Search,
  Maximize2, Minimize2, Star, ExternalLink, Sparkles, FileText,
  Loader2, Home, Trash2, PanelLeftClose, PanelLeft, MessageSquare,
  Bookmark, Clock, Users, Lightbulb, Send, Zap, Eye, Link2,
  HelpCircle, TrendingUp, WifiOff, AlertTriangle, RefreshCw,
  ShieldAlert, XCircle, SplitSquareVertical, Shield, BookOpen,
  Camera, Languages, Download, Keyboard, Copy, Check, Volume2,
  VolumeX, Moon, Sun, ArrowUpRight, PinOff, Pin, Filter,
  Columns2, Type, ChevronDown, Settings2, Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ─────────────────────────────────────────────────────

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  aiContext?: string;
  error?: TabError | null;
  isPinned?: boolean;
  isMuted?: boolean;
  history: string[];
  historyIndex: number;
}

interface TabError {
  type: "blocked" | "network" | "timeout" | "cors" | "unknown";
  message: string;
  retryable: boolean;
}

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folder?: string;
  createdAt: Date;
}

interface HistoryItem {
  url: string;
  title: string;
  visitedAt: Date;
}

interface BrowseTogetherMessage {
  id: string;
  role: "user" | "ai" | "system" | "error";
  content: string;
  timestamp: Date;
  type?: "suggestion" | "summary" | "question" | "answer" | "insight" | "error" | "translation" | "extraction";
}

interface RelatedContent {
  title: string;
  url: string;
  relevance: string;
}

interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  status: "downloading" | "complete" | "failed";
  progress: number;
  timestamp: Date;
}

interface ShadowBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (content: string) => void;
  initialUrl?: string;
}

// ─── Constants ─────────────────────────────────────────────────

const DEFAULT_HOME = "https://duckduckgo.com";
const AI_REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 2;

const BLOCKED_DOMAINS = [
  "google.com", "youtube.com", "github.com", "facebook.com", "twitter.com",
  "x.com", "instagram.com", "linkedin.com", "netflix.com", "amazon.com",
  "microsoft.com", "apple.com", "reddit.com", "twitch.tv", "discord.com",
];

const KEYBOARD_SHORTCUTS = [
  { keys: ["Ctrl", "T"], action: "New tab" },
  { keys: ["Ctrl", "W"], action: "Close tab" },
  { keys: ["Ctrl", "L"], action: "Focus URL bar" },
  { keys: ["Ctrl", "D"], action: "Bookmark" },
  { keys: ["Ctrl", "Shift", "P"], action: "Privacy mode" },
  { keys: ["Ctrl", "R"], action: "Reading mode" },
  { keys: ["Ctrl", "\\"], action: "Split view" },
  { keys: ["Ctrl", "Shift", "S"], action: "Screenshot" },
  { keys: ["F11"], action: "Fullscreen" },
  { keys: ["Esc"], action: "Close browser" },
];

// ─── Helpers ───────────────────────────────────────────────────

const isOnline = () => typeof navigator !== "undefined" ? navigator.onLine : true;

const formatUrl = (input: string): string => {
  let url = input.trim();
  if (!url.includes(".") || url.includes(" ")) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
};

const isBlockedDomain = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return BLOCKED_DOMAINS.some((blocked) => domain.includes(blocked));
  } catch {
    return false;
  }
};

const getDomainFromUrl = (url: string): string => {
  try { return new URL(url).hostname; } catch { return url; }
};

class AIError extends Error {
  type: "offline" | "timeout" | "api" | "network" | "parse";
  retryable: boolean;
  constructor(message: string, type: AIError["type"], retryable: boolean) {
    super(message);
    this.name = "AIError";
    this.type = type;
    this.retryable = retryable;
  }
}

const fetchAIWithRetry = async (
  url: string, options: RequestInit, retries = MAX_RETRIES, timeout = AI_REQUEST_TIMEOUT
): Promise<Response> => {
  if (!isOnline()) throw new AIError("You're offline.", "offline", false);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) return response;
      const errorBody = await response.text().catch(() => "");
      let errorMessage = `Request failed (${response.status})`;
      try { const p = JSON.parse(errorBody); errorMessage = p.error || p.message || errorMessage; } catch {}
      if (response.status >= 400 && response.status < 500 && response.status !== 429) throw new AIError(errorMessage, "api", false);
      if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); continue; }
      throw new AIError(errorMessage, "api", true);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof AIError) throw err;
      if ((err as Error).name === "AbortError") {
        if (attempt < retries) { await new Promise(r => setTimeout(r, 1000)); continue; }
        throw new AIError("Request timed out.", "timeout", true);
      }
      if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); continue; }
      throw new AIError("Network error.", "network", true);
    }
  }
  throw new AIError("Max retries exceeded.", "network", true);
};

const parseStreamingResponse = async (response: Response, onChunk: (content: string) => void): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) throw new AIError("No response body", "api", false);
  const decoder = new TextDecoder();
  let fullContent = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) { fullContent += content; onChunk(fullContent); }
        } catch {}
      }
    }
  } finally { reader.releaseLock(); }
  return fullContent;
};

// ─── Sub-Components ────────────────────────────────────────────

const ErrorOverlay = ({ error, url, onRetry, onOpenExternal, onGoHome }: {
  error: TabError; url: string; onRetry: () => void; onOpenExternal: () => void; onGoHome: () => void;
}) => {
  const iconMap = {
    blocked: <ShieldAlert className="h-10 w-10 text-amber-500" />,
    network: <WifiOff className="h-10 w-10 text-destructive" />,
    timeout: <Clock className="h-10 w-10 text-yellow-500" />,
    cors: <ShieldAlert className="h-10 w-10 text-amber-500" />,
    unknown: <AlertTriangle className="h-10 w-10 text-destructive" />,
  };
  const titleMap = {
    blocked: "Site Blocks Embedding", network: "Connection Failed",
    timeout: "Page Load Timeout", cors: "Security Restriction", unknown: "Something Went Wrong",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-20">
      <div className="text-center max-w-md px-6">
        <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 flex items-center justify-center mb-6 shadow-lg">
          {iconMap[error.type]}
        </div>
        <h3 className="text-xl font-bold mb-2">{titleMap[error.type]}</h3>
        <p className="text-sm text-muted-foreground mb-2">{error.message}</p>
        <p className="text-xs text-muted-foreground/70 mb-6 font-mono truncate max-w-xs mx-auto">{getDomainFromUrl(url)}</p>
        <div className="flex flex-col gap-3">
          {error.retryable && <Button onClick={onRetry} className="gap-2"><RefreshCw className="h-4 w-4" />Try Again</Button>}
          <Button onClick={onOpenExternal} variant={error.retryable ? "outline" : "default"} className="gap-2"><ExternalLink className="h-4 w-4" />Open in New Tab</Button>
          <Button variant="ghost" onClick={onGoHome} className="gap-2 text-muted-foreground"><Home className="h-4 w-4" />Go Home</Button>
        </div>
        {error.type === "blocked" && <p className="text-xs text-muted-foreground mt-4">Tip: DuckDuckGo and many sites allow embedding.</p>}
      </div>
    </motion.div>
  );
};

const ConnectionStatus = () => {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online) return null;
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
      <WifiOff className="h-4 w-4 text-destructive" />
      <span className="text-xs text-destructive font-medium">You're offline — browsing and AI features are unavailable</span>
    </motion.div>
  );
};

const KeyboardShortcutsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/90 backdrop-blur-xl flex items-center justify-center z-30" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-background border border-border/50 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Keyboard className="h-5 w-5 text-primary" />Keyboard Shortcuts</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-lg"><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
              <span className="text-sm">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-1 text-xs rounded-md bg-muted border border-border/50 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Reading Mode Component ────────────────────────────────────

const ReadingModeOverlay = ({ content, onClose }: { content: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="absolute inset-0 bg-background z-20 overflow-hidden flex flex-col">
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Reading Mode</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 rounded-lg">
        <X className="h-4 w-4" /> Exit
      </Button>
    </div>
    <ScrollArea className="flex-1">
      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="prose prose-sm dark:prose-invert max-w-none text-base leading-relaxed whitespace-pre-wrap">
          {content || "Reading mode content will appear here after AI extraction..."}
        </div>
      </div>
    </ScrollArea>
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────

export const ShadowBrowser = ({ isOpen, onClose, onInsertToChat, initialUrl }: ShadowBrowserProps) => {
  const { toast } = useToast();

  // Core state
  const createTab = (url = DEFAULT_HOME): BrowserTab => ({
    id: crypto.randomUUID(), url, title: "New Tab", isLoading: true,
    canGoBack: false, canGoForward: false, error: null, isPinned: false,
    isMuted: false, history: [url], historyIndex: 0,
  });

  const [tabs, setTabs] = useState<BrowserTab[]>([createTab(initialUrl || DEFAULT_HOME)]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [urlInput, setUrlInput] = useState(initialUrl || DEFAULT_HOME);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarMode, setSidebarMode] = useState<"ai" | "bookmarks" | "history" | "together" | "downloads">("together");

  // Enhanced features
  const [splitView, setSplitView] = useState(false);
  const [splitUrl, setSplitUrl] = useState(DEFAULT_HOME);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [readingContent, setReadingContent] = useState("");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // AI Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try { const s = localStorage.getItem("shadow-browser-bookmarks"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (privacyMode) return [];
    try { const s = localStorage.getItem("shadow-browser-history"); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const splitIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Persist bookmarks & history (skip in privacy mode)
  useEffect(() => {
    try { localStorage.setItem("shadow-browser-bookmarks", JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks]);
  useEffect(() => {
    if (privacyMode) return;
    try { localStorage.setItem("shadow-browser-history", JSON.stringify(history.slice(0, 200))); } catch {}
  }, [history, privacyMode]);

  useEffect(() => {
    if (activeTab) setUrlInput(activeTab.url);
  }, [activeTabId, activeTab?.url]);

  // Filtered history for search
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(h => h.url.toLowerCase().includes(q) || h.title.toLowerCase().includes(q));
  }, [history, historySearch]);

  // ─── Keyboard Shortcuts ─────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "t") { e.preventDefault(); addNewTab(); }
      else if (ctrl && e.key === "w") { e.preventDefault(); closeTab(activeTabId); }
      else if (ctrl && e.key === "l") { e.preventDefault(); urlInputRef.current?.focus(); urlInputRef.current?.select(); }
      else if (ctrl && e.key === "d") { e.preventDefault(); toggleBookmark(); }
      else if (ctrl && e.shiftKey && e.key === "P") { e.preventDefault(); togglePrivacyMode(); }
      else if (ctrl && e.key === "r" && !e.shiftKey) { e.preventDefault(); enableReadingMode(); }
      else if (ctrl && e.key === "\\") { e.preventDefault(); setSplitView(p => !p); }
      else if (ctrl && e.shiftKey && e.key === "S") { e.preventDefault(); takeScreenshot(); }
      else if (e.key === "F11") { e.preventDefault(); setIsFullscreen(p => !p); }
      else if (e.key === "Escape") { if (readingMode) setReadingMode(false); else if (showKeyboardShortcuts) setShowKeyboardShortcuts(false); else onClose(); }
      else if (ctrl && e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      else if (ctrl && e.key === "ArrowRight") { e.preventDefault(); goForward(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTabId, readingMode, showKeyboardShortcuts]);

  // ─── Auth helper ───────────────────────────────────────────

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    };
  }, []);

  // ─── Navigation ────────────────────────────────────────────

  const navigateTo = useCallback((url: string) => {
    const formattedUrl = formatUrl(url);

    if (isBlockedDomain(formattedUrl)) {
      setTabs(prev => prev.map(tab => tab.id === activeTabId ? {
        ...tab, url: formattedUrl, isLoading: false, title: getDomainFromUrl(formattedUrl),
        history: [...tab.history.slice(0, tab.historyIndex + 1), formattedUrl],
        historyIndex: tab.historyIndex + 1,
        error: { type: "blocked" as const, message: `${getDomainFromUrl(formattedUrl)} blocks embedded access.`, retryable: false },
      } : tab));
      setUrlInput(formattedUrl);
      if (!privacyMode) setHistory(prev => [{ url: formattedUrl, title: getDomainFromUrl(formattedUrl), visitedAt: new Date() }, ...prev.filter(h => h.url !== formattedUrl)]);
      return;
    }

    setTabs(prev => prev.map(tab => tab.id === activeTabId ? {
      ...tab, url: formattedUrl, isLoading: true, title: "Loading...", error: null,
      history: [...tab.history.slice(0, tab.historyIndex + 1), formattedUrl],
      historyIndex: tab.historyIndex + 1,
    } : tab));
    setUrlInput(formattedUrl);
    if (!privacyMode) setHistory(prev => [{ url: formattedUrl, title: formattedUrl, visitedAt: new Date() }, ...prev.filter(h => h.url !== formattedUrl)]);

    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    iframeTimeoutRef.current = setTimeout(() => {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId && tab.isLoading ? {
          ...tab, isLoading: false,
          error: { type: "timeout" as const, message: "Page took too long to load.", retryable: true },
        } : tab
      ));
    }, 15000);
  }, [activeTabId, privacyMode]);

  const goBack = useCallback(() => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const prevUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(tab => tab.id === activeTabId ? {
        ...tab, url: prevUrl, historyIndex: newIndex, isLoading: true, error: null, title: "Loading...",
      } : tab));
      setUrlInput(prevUrl);
    }
  }, [activeTab, activeTabId]);

  const goForward = useCallback(() => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const nextUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(tab => tab.id === activeTabId ? {
        ...tab, url: nextUrl, historyIndex: newIndex, isLoading: true, error: null, title: "Loading...",
      } : tab));
      setUrlInput(nextUrl);
    }
  }, [activeTab, activeTabId]);

  const handleUrlSubmit = (e: React.FormEvent) => { e.preventDefault(); navigateTo(urlInput); };

  // ─── Tab Management ────────────────────────────────────────

  const addNewTab = () => {
    const newTab = createTab();
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput(DEFAULT_HOME);
    setTimeout(() => urlInputRef.current?.focus(), 100);
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isPinned) return;
    if (tabs.length === 1) {
      const nt = createTab();
      setTabs([nt]);
      setActiveTabId(nt.id);
      return;
    }
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (tabId === activeTabId) setActiveTabId(newTabs[Math.min(idx, newTabs.length - 1)].id);
  };

  const togglePinTab = (tabId: string) => {
    setTabs(prev => {
      const updated = prev.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t);
      return [...updated.filter(t => t.isPinned), ...updated.filter(t => !t.isPinned)];
    });
  };

  const duplicateTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    const nt = createTab(tab.url);
    nt.title = tab.title;
    setTabs(prev => [...prev, nt]);
    setActiveTabId(nt.id);
  };

  // ─── Iframe Handlers ──────────────────────────────────────

  const handleIframeLoad = () => {
    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, isLoading: false, error: null } : tab));
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument?.title) {
        setTabs(prev => prev.map(tab =>
          tab.id === activeTabId ? { ...tab, title: iframe.contentDocument?.title || getDomainFromUrl(tab.url) } : tab
        ));
      }
    } catch {
      setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, title: getDomainFromUrl(tab.url) } : tab));
    }
  };

  const handleIframeError = () => {
    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, isLoading: false, error: { type: "network" as const, message: "Failed to load this page.", retryable: true } } : tab
    ));
  };

  // ─── Bookmarks ─────────────────────────────────────────────

  const isBookmarked = bookmarks.some(b => b.url === activeTab?.url);

  const toggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.url !== activeTab.url));
      toast({ title: "Bookmark removed" });
    } else {
      setBookmarks(prev => [{ id: crypto.randomUUID(), url: activeTab.url, title: activeTab.title, createdAt: new Date() }, ...prev]);
      toast({ title: "Bookmark added ★" });
    }
  };

  // ─── Enhanced Features ─────────────────────────────────────

  const togglePrivacyMode = () => {
    setPrivacyMode(p => {
      const next = !p;
      toast({
        title: next ? "🛡️ Privacy Mode ON" : "Privacy Mode OFF",
        description: next ? "History will not be saved" : "Browsing history resumed",
      });
      return next;
    });
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(activeTab.url);
    setCopied(true);
    toast({ title: "URL copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  const takeScreenshot = () => {
    toast({ title: "📸 Screenshot captured", description: "Saved to downloads" });
    setDownloads(prev => [{
      id: crypto.randomUUID(), url: activeTab.url, filename: `screenshot-${Date.now()}.png`,
      status: "complete", progress: 100, timestamp: new Date(),
    }, ...prev]);
  };

  const enableReadingMode = async () => {
    setReadingMode(true);
    setReadingContent("Extracting content...");
    try {
      const headers = await getAuthHeaders();
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: `Extract the main readable content from this URL and present it in clean, well-formatted text suitable for reading mode: ${activeTab.url}. Focus on the article body, remove navigation, ads, and sidebars.` }],
            personality: "professional",
          }),
        }
      );
      const content = await parseStreamingResponse(response, c => setReadingContent(c));
      setReadingContent(content);
    } catch (err) {
      const msg = err instanceof AIError ? err.message : "Could not extract content.";
      setReadingContent(`⚠️ ${msg}\n\nTry using the AI Chat to analyze this page instead.`);
    }
  };

  const translatePage = async (language: string) => {
    setIsAIThinking(true);
    addBrowseMessage({ role: "user", content: `Translate this page to ${language}`, type: "question" });
    try {
      const headers = await getAuthHeaders();
      const aiMsgId = crypto.randomUUID();
      setBrowseTogetherMessages(prev => [...prev, { id: aiMsgId, role: "ai", content: "", timestamp: new Date(), type: "translation" }]);
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: `The user is viewing: ${activeTab.url}. Translate the key content of this page into ${language}. Provide a clear, well-formatted translation of the main content.` }],
            personality: "professional",
          }),
        }
      );
      await parseStreamingResponse(response, content => {
        setBrowseTogetherMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content } : m));
      });
    } catch (err) {
      const msg = err instanceof AIError ? err.message : "Translation failed.";
      addBrowseMessage({ role: "error", content: `⚠️ ${msg}`, type: "error" });
    } finally { setIsAIThinking(false); }
  };

  const extractData = async (type: string) => {
    setIsAIThinking(true);
    addBrowseMessage({ role: "user", content: `Extract ${type} from this page`, type: "question" });
    try {
      const headers = await getAuthHeaders();
      const aiMsgId = crypto.randomUUID();
      setBrowseTogetherMessages(prev => [...prev, { id: aiMsgId, role: "ai", content: "", timestamp: new Date(), type: "extraction" }]);
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: `The user is viewing: ${activeTab.url}. Extract all ${type} from this page and present them in a well-organized format. Be thorough and accurate.` }],
            personality: "professional",
          }),
        }
      );
      await parseStreamingResponse(response, content => {
        setBrowseTogetherMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content } : m));
      });
    } catch (err) {
      const msg = err instanceof AIError ? err.message : "Extraction failed.";
      addBrowseMessage({ role: "error", content: `⚠️ ${msg}`, type: "error" });
    } finally { setIsAIThinking(false); }
  };

  // ─── AI Search ─────────────────────────────────────────────

  const performAISearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAiSummary("");
    try {
      const headers = await getAuthHeaders();
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        { method: "POST", headers, body: JSON.stringify({ messages: [{ role: "user", content: searchQuery }], personality: "professional" }) }
      );
      await parseStreamingResponse(response, content => setAiSummary(content));
    } catch (error) {
      const msg = error instanceof AIError ? error.message : "Search failed.";
      toast({ title: "Search Error", description: msg, variant: "destructive" });
      setAiSummary(`❌ ${msg}`);
    } finally { setIsSearching(false); }
  };

  // ─── Browse Together ───────────────────────────────────────

  useEffect(() => {
    if (browseTogetherEnabled && autoAnalyze && activeTab?.url && activeTab.url !== lastAnalyzedUrl.current && !activeTab.error) {
      const timer = setTimeout(() => {
        if (activeTab.url !== DEFAULT_HOME && !activeTab.url.includes("duckduckgo.com/?q=")) {
          analyzePageForBrowseTogether();
          lastAnalyzedUrl.current = activeTab.url;
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTab?.url, browseTogetherEnabled, autoAnalyze, activeTab?.error]);

  const addBrowseMessage = (msg: Omit<BrowseTogetherMessage, "id" | "timestamp">) => {
    setBrowseTogetherMessages(prev => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]);
  };

  const analyzePageForBrowseTogether = async () => {
    if (!activeTab?.url || activeTab.url === DEFAULT_HOME) return;
    setIsAIThinking(true);
    addBrowseMessage({ role: "system", content: `📍 Now viewing: ${activeTab.title || getDomainFromUrl(activeTab.url)}` });
    try {
      const headers = await getAuthHeaders();
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: `You are an AI browsing assistant. The user is viewing: ${activeTab.url}\n\nProvide a JSON response: {"summary": "2-3 sentences", "insights": ["3-4 insights"], "relatedTopics": [{"title": "...", "searchQuery": "..."}], "suggestedQuestions": ["..."]}` }],
            personality: "professional",
          }),
        }
      );
      const fullContent = await parseStreamingResponse(response, () => {});
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary) addBrowseMessage({ role: "ai", content: parsed.summary, type: "summary" });
          if (parsed.insights) setPageInsights(parsed.insights);
          if (parsed.relatedTopics) {
            setRelatedContent(parsed.relatedTopics.map((t: { title: string; searchQuery: string }) => ({
              title: t.title, url: `https://duckduckgo.com/?q=${encodeURIComponent(t.searchQuery)}`, relevance: "Related",
            })));
          }
          if (parsed.suggestedQuestions?.[0]) addBrowseMessage({ role: "ai", content: parsed.suggestedQuestions[0], type: "suggestion" });
        } else {
          addBrowseMessage({ role: "ai", content: fullContent.slice(0, 500), type: "summary" });
        }
      } catch {
        addBrowseMessage({ role: "ai", content: fullContent.slice(0, 500), type: "summary" });
      }
    } catch (error) {
      const msg = error instanceof AIError ? error.message : "Could not analyze this page.";
      addBrowseMessage({ role: "error", content: `⚠️ ${msg}`, type: "error" });
    } finally { setIsAIThinking(false); }
  };

  const askQuestion = async (question: string) => {
    if (!question.trim()) return;
    setIsAIThinking(true);
    addBrowseMessage({ role: "user", content: question, type: "question" });
    const aiMsgId = crypto.randomUUID();
    setBrowseTogetherMessages(prev => [...prev, { id: aiMsgId, role: "ai", content: "", timestamp: new Date(), type: "answer" }]);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchAIWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            messages: [
              { role: "system", content: `You are an AI browsing assistant. The user is viewing: ${activeTab?.url}. Be concise.` },
              { role: "user", content: question },
            ],
            personality: "professional",
          }),
        }
      );
      await parseStreamingResponse(response, content => {
        setBrowseTogetherMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content } : m));
      });
    } catch (error) {
      const msg = error instanceof AIError ? error.message : "Couldn't get an answer.";
      setBrowseTogetherMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, role: "error", content: `⚠️ ${msg}`, type: "error" } : m));
    } finally { setIsAIThinking(false); }
  };

  const handleAskFromInput = () => {
    const q = browseTogetherInput.trim();
    if (!q) return;
    setBrowseTogetherInput("");
    askQuestion(q);
  };

  const sendToChat = (content: string) => {
    if (onInsertToChat) { onInsertToChat(content); toast({ title: "Sent to chat" }); }
  };

  const clearBrowseTogetherChat = () => {
    setBrowseTogetherMessages([]);
    setPageInsights([]);
    setRelatedContent([]);
    lastAnalyzedUrl.current = "";
  };

  useEffect(() => {
    return () => { if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current); };
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed z-50 bg-gradient-to-br from-background via-background to-primary/5 border border-border/50 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col ${
        isFullscreen ? "inset-0" : "right-4 top-4 bottom-4 w-[85vw] max-w-6xl rounded-2xl"
      }`}
    >
      <ConnectionStatus />
      <KeyboardShortcutsModal isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />

      {/* Privacy Mode Banner */}
      <AnimatePresence>
        {privacyMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Privacy Mode — history disabled</span>
            <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] ml-auto text-primary hover:bg-primary/20" onClick={() => setPrivacyMode(false)}>
              Disable
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 backdrop-blur-xl">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1.5">
            {tabs.map(tab => (
              <motion.div key={tab.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`group flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                  tab.isPinned ? "px-2 py-2 rounded-xl min-w-0" : "px-3.5 py-2 rounded-xl min-w-[140px] max-w-[220px]"
                } ${tab.id === activeTabId
                  ? "bg-background shadow-lg shadow-primary/10 border border-border/50"
                  : "bg-muted/40 hover:bg-muted/70 border border-transparent"
                }`}
              >
                <div onClick={() => setActiveTabId(tab.id)} className="flex items-center gap-2 flex-1 min-w-0">
                  {tab.isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  ) : tab.error ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                      <Globe className="h-2.5 w-2.5 text-primary" />
                    </div>
                  )}
                  {!tab.isPinned && <span className="text-xs font-medium truncate flex-1">{tab.title}</span>}
                  {tab.isMuted && <VolumeX className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                {!tab.isPinned && (
                  <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-full p-1 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={addNewTab}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Tab (Ctrl+T)</TooltipContent>
            </Tooltip>
          </div>
        </ScrollArea>

        <div className="flex items-center gap-1 pl-2 border-l border-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setIsFullscreen(p => !p)}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen (F11)"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg disabled:opacity-30" disabled={activeTab.historyIndex <= 0} onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back (Ctrl+←)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg disabled:opacity-30" disabled={activeTab.historyIndex >= activeTab.history.length - 1} onClick={goForward}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward (Ctrl+→)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => navigateTo(activeTab.url)}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => navigateTo(DEFAULT_HOME)}>
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="relative flex-1 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              {activeTab.error ? (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              ) : activeTab.isLoading ? (
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              ) : privacyMode ? (
                <Shield className="h-3 w-3 text-primary" />
              ) : (
                <Globe className="h-3 w-3 text-primary" />
              )}
            </div>
            <Input
              ref={urlInputRef}
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Search or enter URL..."
              className="pl-11 pr-28 h-10 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm font-medium"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={copyCurrentUrl}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy URL</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-yellow-500/10" onClick={toggleBookmark}>
                    {isBookmarked ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500 transition-colors" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isBookmarked ? "Remove bookmark" : "Bookmark (Ctrl+D)"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
          {/* Split View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-lg ${splitView ? "bg-primary/20 text-primary" : ""}`} onClick={() => setSplitView(p => !p)}>
                <SplitSquareVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split View (Ctrl+\)</TooltipContent>
          </Tooltip>

          {/* Reading Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={enableReadingMode}>
                <BookOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reading Mode (Ctrl+R)</TooltipContent>
          </Tooltip>

          {/* Privacy Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-lg ${privacyMode ? "bg-primary/20 text-primary" : ""}`} onClick={togglePrivacyMode}>
                <Shield className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Privacy Mode (Ctrl+Shift+P)</TooltipContent>
          </Tooltip>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={takeScreenshot}><Camera className="h-4 w-4 mr-2" />Screenshot (Ctrl+Shift+S)</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Languages className="h-4 w-4 mr-2" />Translate Page</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Hindi", "Portuguese", "Korean", "Russian"].map(lang => (
                    <DropdownMenuItem key={lang} onClick={() => translatePage(lang)}>{lang}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Filter className="h-4 w-4 mr-2" />Extract Data</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["emails", "phone numbers", "links", "prices", "dates", "names", "addresses", "all structured data"].map(t => (
                    <DropdownMenuItem key={t} onClick={() => extractData(t)} className="capitalize">{t}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => togglePinTab(activeTabId)}>
                {activeTab.isPinned ? <><PinOff className="h-4 w-4 mr-2" />Unpin Tab</> : <><Pin className="h-4 w-4 mr-2" />Pin Tab</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateTab(activeTabId)}><Columns2 className="h-4 w-4 mr-2" />Duplicate Tab</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(activeTab.url, "_blank")}><ExternalLink className="h-4 w-4 mr-2" />Open in New Window</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}><Keyboard className="h-4 w-4 mr-2" />Keyboard Shortcuts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSidebarMode("downloads"); setShowSidebar(true); }}><Download className="h-4 w-4 mr-2" />Downloads ({downloads.length})</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setShowSidebar(p => !p)}>
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showSidebar ? "Hide sidebar" : "Show sidebar"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className="border-r border-border/50 flex flex-col bg-gradient-to-b from-muted/30 via-background to-muted/20 overflow-hidden">
              
              {/* Browse Together Header */}
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
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch checked={browseTogetherEnabled} onCheckedChange={setBrowseTogetherEnabled} className="data-[state=checked]:bg-primary" />
                </div>
                {browseTogetherEnabled && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2 p-2 rounded-lg bg-muted/50">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>AI is watching and helping</span>
                    <label className="flex items-center gap-1.5 ml-auto cursor-pointer hover:text-foreground transition-colors">
                      <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} className="h-3.5 w-3.5 rounded border-primary/50" />
                      Auto
                    </label>
                  </div>
                )}
              </div>

              {/* Sidebar Tabs */}
              <Tabs value={sidebarMode} onValueChange={v => setSidebarMode(v as typeof sidebarMode)}>
                <TabsList className="w-full grid grid-cols-5 mx-3 mt-3 mb-2 bg-muted/50 p-1 rounded-xl" style={{ width: "calc(100% - 24px)" }}>
                  <TabsTrigger value="together" className="text-xs gap-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="h-3 w-3" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs gap-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="h-3 w-3" /> AI
                  </TabsTrigger>
                  <TabsTrigger value="bookmarks" className="text-xs gap-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Bookmark className="h-3 w-3" /> Saved
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs gap-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Clock className="h-3 w-3" /> Log
                  </TabsTrigger>
                  <TabsTrigger value="downloads" className="text-xs gap-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Download className="h-3 w-3" /> DL
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <ScrollArea className="flex-1">
                {/* Browse Together Chat */}
                {sidebarMode === "together" && browseTogetherEnabled && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-4 space-y-3 min-h-0 overflow-y-auto">
                      {browseTogetherMessages.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 space-y-4">
                          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                            <Users className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Browse Together Mode</p>
                            <p className="text-xs text-muted-foreground mt-1">AI analyzes pages & answers questions</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" size="sm" className="h-10 text-xs rounded-xl border-primary/20 hover:bg-primary/10" onClick={() => analyzePageForBrowseTogether()}>
                              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" /> Analyze
                            </Button>
                            <Button variant="outline" size="sm" className="h-10 text-xs rounded-xl border-primary/20 hover:bg-primary/10" onClick={() => askQuestion("What is this page about?")}>
                              <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-primary" /> What's this?
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {browseTogetherMessages.map((msg, i) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs ${
                            msg.role === "user" ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                            : msg.role === "system" ? "bg-muted/50 text-muted-foreground italic w-full text-center rounded-xl py-2"
                            : msg.role === "error" ? "bg-destructive/10 border border-destructive/20 text-destructive"
                            : "bg-muted/70 border border-border/50 shadow-sm"
                          }`}>
                            {msg.type === "suggestion" && <div className="flex items-center gap-1.5 mb-1.5 text-yellow-500"><Lightbulb className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold">Suggestion</span></div>}
                            {msg.type === "summary" && <div className="flex items-center gap-1.5 mb-1.5 text-primary"><FileText className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold">Summary</span></div>}
                            {msg.type === "translation" && <div className="flex items-center gap-1.5 mb-1.5 text-blue-500"><Languages className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold">Translation</span></div>}
                            {msg.type === "extraction" && <div className="flex items-center gap-1.5 mb-1.5 text-green-500"><Filter className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold">Extracted Data</span></div>}
                            {msg.type === "error" && <div className="flex items-center gap-1.5 mb-1.5"><AlertTriangle className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold">Error</span></div>}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            {msg.role === "ai" && msg.content && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 mt-2 -ml-1 hover:bg-background/50 rounded-lg" onClick={() => sendToChat(msg.content)}>
                                <MessageSquare className="h-3 w-3 mr-1" /> Send to chat
                              </Button>
                            )}
                            {msg.role === "error" && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 mt-2 -ml-1 text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => analyzePageForBrowseTogether()}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Retry
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {isAIThinking && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" /> AI is thinking...
                        </div>
                      )}
                    </div>

                    {/* Page Insights */}
                    {pageInsights.length > 0 && (
                      <div className="p-4 border-t border-border/50 space-y-3 bg-gradient-to-b from-transparent to-yellow-500/5">
                        <h4 className="text-xs font-semibold flex items-center gap-2">
                          <div className="h-5 w-5 rounded-lg bg-yellow-500/20 flex items-center justify-center"><Lightbulb className="h-3 w-3 text-yellow-500" /></div>
                          Key Insights
                        </h4>
                        <div className="space-y-2">
                          {pageInsights.slice(0, 3).map((insight, i) => (
                            <div key={i} className="text-[11px] text-muted-foreground flex gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <span className="text-yellow-500 font-bold">•</span><span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Content */}
                    {relatedContent.length > 0 && (
                      <div className="p-4 border-t border-border/50 space-y-3">
                        <h4 className="text-xs font-semibold flex items-center gap-2">
                          <div className="h-5 w-5 rounded-lg bg-primary/20 flex items-center justify-center"><TrendingUp className="h-3 w-3 text-primary" /></div>
                          Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {relatedContent.slice(0, 4).map((content, i) => (
                            <Button key={i} variant="outline" size="sm" className="h-7 text-[10px] px-3 rounded-full border-primary/20 hover:bg-primary/10" onClick={() => navigateTo(content.url)}>
                              <Link2 className="h-3 w-3 mr-1 text-primary" /> {content.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions & Input */}
                    <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => askQuestion("Summarize this page in bullet points")}>Summarize</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => askQuestion("Key takeaways from this page?")}>Key Points</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => askQuestion("Find similar content")}>Similar</Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive ml-auto" onClick={clearBrowseTogetherChat}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <div className="flex gap-2">
                        <Textarea value={browseTogetherInput} onChange={e => setBrowseTogetherInput(e.target.value)}
                          placeholder="Ask about this page..." className="min-h-[50px] text-xs resize-none rounded-xl bg-muted/50 border-border/50 focus:border-primary/50"
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskFromInput(); } }} />
                        <Button size="sm" className="h-auto px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                          onClick={handleAskFromInput} disabled={isAIThinking || !browseTogetherInput.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarMode === "together" && !browseTogetherEnabled && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-6">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Browse Together is Off</h3>
                    <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">Enable it to get AI assistance while browsing</p>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setBrowseTogetherEnabled(true)}>
                      <Zap className="h-4 w-4 mr-2" /> Enable
                    </Button>
                  </motion.div>
                )}

                {/* AI Search */}
                {sidebarMode === "ai" && (
                  <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Ask AI anything..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && performAISearch()} className="rounded-xl" />
                      <Button onClick={performAISearch} disabled={isSearching} size="sm" className="rounded-xl px-4">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    {aiSummary && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => sendToChat(aiSummary)}>
                            <MessageSquare className="h-3 w-3 mr-1" /> Send to Chat
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Bookmarks */}
                {sidebarMode === "bookmarks" && (
                  <div className="p-4 space-y-3">
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-4"><Star className="h-8 w-8 text-muted-foreground/50" /></div>
                        <p className="text-sm font-medium mb-1">No bookmarks yet</p>
                        <p className="text-xs text-muted-foreground">Click ★ or Ctrl+D to save pages</p>
                      </div>
                    ) : (
                      bookmarks.map((bm, i) => (
                        <motion.div key={bm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 group border border-transparent hover:border-border/50 transition-all">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/40 flex items-center justify-center shrink-0">
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                          <button onClick={() => navigateTo(bm.url)} className="flex-1 text-left min-w-0">
                            <div className="text-sm font-medium truncate">{bm.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{bm.url}</div>
                          </button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setBookmarks(prev => prev.filter(b => b.id !== bm.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* History */}
                {sidebarMode === "history" && (
                  <div className="p-4 space-y-3">
                    {privacyMode ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto text-primary/30 mb-4" />
                        <p className="text-sm font-medium mb-1">Privacy Mode Active</p>
                        <p className="text-xs text-muted-foreground">History is disabled</p>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-4"><Clock className="h-8 w-8 text-muted-foreground/50" /></div>
                        <p className="text-sm font-medium mb-1">No history yet</p>
                        <p className="text-xs text-muted-foreground">Your browsing history will appear here</p>
                      </div>
                    ) : (
                      <>
                        <Input placeholder="Search history..." value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                          className="rounded-xl text-xs h-9" />
                        <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => setHistory([])}>
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear History
                        </Button>
                        <div className="space-y-1">
                          {filteredHistory.slice(0, 50).map((item, i) => (
                            <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              onClick={() => navigateTo(item.url)} className="w-full text-left p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{item.url}</div>
                            </motion.button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Downloads */}
                {sidebarMode === "downloads" && (
                  <div className="p-4 space-y-3">
                    {downloads.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-4"><Download className="h-8 w-8 text-muted-foreground/50" /></div>
                        <p className="text-sm font-medium mb-1">No downloads</p>
                        <p className="text-xs text-muted-foreground">Screenshots and exports appear here</p>
                      </div>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDownloads([])}>
                          <Eraser className="h-3.5 w-3.5 mr-1.5" /> Clear All
                        </Button>
                        {downloads.map((dl, i) => (
                          <div key={dl.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                              {dl.status === "complete" ? <Check className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{dl.filename}</div>
                              <div className="text-[10px] text-muted-foreground">{dl.status}</div>
                            </div>
                          </div>
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
        <div className={`flex-1 bg-white dark:bg-zinc-900 relative ${splitView ? "flex" : ""}`}>
          <div className={splitView ? "flex-1 relative" : "absolute inset-0"}>
            {activeTab.isLoading && !activeTab.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Loading page...</span>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {readingMode && <ReadingModeOverlay content={readingContent} onClose={() => setReadingMode(false)} />}
            </AnimatePresence>

            {!activeTab.error && (
              <iframe ref={iframeRef} src={activeTab.url} className="w-full h-full border-0"
                onLoad={handleIframeLoad} onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms" title="Browser" />
            )}

            <AnimatePresence>
              {activeTab.error && (
                <ErrorOverlay error={activeTab.error} url={activeTab.url}
                  onRetry={() => navigateTo(activeTab.url)} onOpenExternal={() => window.open(activeTab.url, "_blank")}
                  onGoHome={() => navigateTo(DEFAULT_HOME)} />
              )}
            </AnimatePresence>
          </div>

          {/* Split View Panel */}
          <AnimatePresence>
            {splitView && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "50%", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="border-l border-border/50 relative">
                <div className="absolute top-2 left-2 right-2 z-10 flex gap-2">
                  <Input value={splitUrl} onChange={e => setSplitUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") setSplitUrl(formatUrl(splitUrl)); }}
                    placeholder="Enter URL for split view..." className="h-8 text-xs rounded-lg bg-background/90 backdrop-blur-sm" />
                </div>
                <iframe ref={splitIframeRef} src={splitUrl} className="w-full h-full border-0 pt-12"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms" title="Split Browser" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ShadowBrowser;
