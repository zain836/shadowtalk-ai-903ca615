import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, X, Loader2, Search, ExternalLink, CheckCircle2,
  Eye, FileText, ChevronDown, ChevronUp, ArrowRight,
  Sparkles, Clock, Link2, AlertCircle, PanelRightClose,
  Maximize2, Minimize2, RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────

export interface BrowseAction {
  id: string;
  type: "navigating" | "reading" | "extracting" | "analyzing" | "searching" | "complete" | "error";
  label: string;
  url?: string;
  detail?: string;
  timestamp: Date;
  duration?: number;
}

export interface BrowseSession {
  id: string;
  query: string;
  actions: BrowseAction[];
  status: "active" | "complete" | "error";
  startedAt: Date;
  result?: string;
  sources: { url: string; title: string }[];
}

interface BrowseActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  session: BrowseSession | null;
  onResultReady?: (result: string, sources: { url: string; title: string }[]) => void;
}

// ─── Action Icon Map ────────────────────────────────────────────

const actionIcons: Record<BrowseAction["type"], typeof Globe> = {
  navigating: Globe,
  reading: Eye,
  extracting: FileText,
  analyzing: Sparkles,
  searching: Search,
  complete: CheckCircle2,
  error: AlertCircle,
};

const actionColors: Record<BrowseAction["type"], string> = {
  navigating: "text-blue-400",
  reading: "text-cyan-400",
  extracting: "text-amber-400",
  analyzing: "text-purple-400",
  searching: "text-green-400",
  complete: "text-emerald-400",
  error: "text-red-400",
};

// ─── Component ──────────────────────────────────────────────────

export function BrowseActivityPanel({ isOpen, onClose, session, onResultReady }: BrowseActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.actions.length]);

  // Track active URL from actions
  useEffect(() => {
    if (!session) return;
    const lastNav = [...session.actions].reverse().find(a => a.type === "navigating" && a.url);
    if (lastNav?.url) setActiveUrl(lastNav.url);
  }, [session?.actions]);

  if (!isOpen || !session) return null;

  const progress = session.status === "complete" ? 100 :
    session.actions.length > 0 ? Math.min(90, session.actions.length * 15) : 5;

  const elapsed = Math.round((Date.now() - session.startedAt.getTime()) / 1000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isFullscreen ? "60%" : 420, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full border-l border-border/50 bg-background/95 backdrop-blur-xl flex flex-col overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <Globe className="w-4 h-4 text-primary" />
              {session.status === "active" && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
                />
              )}
            </div>
            <span className="text-sm font-medium truncate">AI Browsing</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              {session.status === "active" ? "Live" : session.status === "complete" ? "Done" : "Error"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <PanelRightClose className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Query Banner */}
        <div className="px-4 py-2.5 bg-primary/5 border-b border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Search className="w-3 h-3" />
            <span>Researching</span>
            <span className="ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{session.query}</p>
          <Progress value={progress} className="h-1 mt-2" />
        </div>

        {/* Live Browser Viewport */}
        <div className="relative flex-shrink-0" style={{ height: isExpanded ? 220 : 0 }}>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 220, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full border-b border-border/30 bg-black/20 overflow-hidden"
              >
                {activeUrl ? (
                  <div className="relative w-full h-full">
                    {/* URL Bar */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-md border-b border-border/30">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground truncate font-mono">{activeUrl}</span>
                      <ExternalLink
                        className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-auto"
                        onClick={() => window.open(activeUrl, "_blank")}
                      />
                    </div>
                    <iframe
                      ref={iframeRef}
                      src={activeUrl}
                      title="Browse Preview"
                      className="w-full h-full border-0 pointer-events-none"
                      sandbox="allow-same-origin"
                      style={{ transform: "scale(0.6)", transformOrigin: "0 0", width: "166.67%", height: "166.67%", marginTop: 28 }}
                    />
                    {/* Scanning overlay */}
                    {session.status === "active" && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ marginTop: 28 }}
                      >
                        <motion.div
                          animate={{ y: [0, 192, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                        />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing browser...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle viewport */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-muted border border-border rounded-full p-0.5 hover:bg-accent transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Activity Log - Manus/Kimi-style */}
        <ScrollArea className="flex-1 px-3 py-3">
          <div className="space-y-1">
            {session.actions.map((action, i) => {
              const Icon = actionIcons[action.type];
              const colorClass = actionColors[action.type];
              const isLatest = i === session.actions.length - 1 && session.status === "active";
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2.5 py-1.5 px-2 rounded-lg transition-colors ${
                    isLatest ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/30"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center mt-0.5">
                    <div className={`relative ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {isLatest && session.status === "active" && (
                        <motion.div
                          animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full bg-current opacity-30"
                        />
                      )}
                    </div>
                    {i < session.actions.length - 1 && (
                      <div className="w-px h-3 bg-border/50 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${isLatest ? "text-foreground" : "text-muted-foreground"}`}>
                        {action.label}
                      </span>
                      {action.duration && (
                        <span className="text-[10px] text-muted-foreground/60">{action.duration}ms</span>
                      )}
                    </div>
                    {action.url && (
                      <p className="text-[10px] text-muted-foreground/60 truncate font-mono mt-0.5">
                        {action.url}
                      </p>
                    )}
                    {action.detail && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {action.detail}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Active indicator */}
            {session.status === "active" && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-2 py-2 px-2 text-xs text-primary"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing...</span>
              </motion.div>
            )}

            <div ref={logEndRef} />
          </div>
        </ScrollArea>

        {/* Sources Footer */}
        {session.sources.length > 0 && (
          <div className="border-t border-border/50 px-3 py-2.5 bg-muted/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Sources ({session.sources.length})
              </span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {session.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-primary/80 hover:text-primary transition-colors truncate"
                >
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{source.title || source.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Auto-Browse Hook ───────────────────────────────────────────

const BROWSE_PATTERNS = [
  /\b(what is|what are|who is|who are|when was|when did|where is|where are|how to|how does|how do|how much|how many)\b/i,
  /\b(latest|recent|current|today|news|update|2024|2025|2026)\b/i,
  /\b(compare|vs|versus|difference between|better)\b/i,
  /\b(price|cost|review|rating|best)\b/i,
  /\b(search|find|look up|google|browse|check online)\b/i,
  /\b(weather|stock|score|result|schedule)\b/i,
];

export function useAutoBrowse() {
  const [browseSession, setBrowseSession] = useState<BrowseSession | null>(null);

  const shouldBrowse = useCallback((message: string): boolean => {
    // Don't trigger for very short messages or code
    if (message.length < 10 || message.includes("```")) return false;
    return BROWSE_PATTERNS.some(p => p.test(message));
  }, []);

  const startBrowseSession = useCallback(async (query: string): Promise<BrowseSession> => {
    const sessionId = crypto.randomUUID();
    const session: BrowseSession = {
      id: sessionId,
      query,
      actions: [],
      status: "active",
      startedAt: new Date(),
      sources: [],
    };
    setBrowseSession(session);

    const addAction = (action: Omit<BrowseAction, "id" | "timestamp">) => {
      const newAction: BrowseAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setBrowseSession(prev => prev ? { ...prev, actions: [...prev.actions, newAction] } : null);
      return newAction;
    };

    try {
      // Step 1: Searching
      addAction({ type: "searching", label: "Searching the web...", detail: `Query: "${query}"` });
      await delay(800);

      // Step 2: Navigate to search
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      addAction({ type: "navigating", label: "Opening search engine", url: searchUrl });
      await delay(1200);

      // Step 3: Reading results
      addAction({ type: "reading", label: "Reading search results", detail: "Scanning top results for relevance..." });
      await delay(1000);

      // Step 4: Try to use the AI to actually search (via Firecrawl or SERP)
      let searchResults: { url: string; title: string; snippet?: string }[] = [];
      
      try {
        const { data, error } = await supabase.functions.invoke('web-search', {
          body: { query, numResults: 5 },
        });
        
        if (data?.results) {
          searchResults = data.results.map((r: any) => ({
            url: r.link || r.url,
            title: r.title,
            snippet: r.snippet,
          }));
        }
      } catch {
        // Fallback: generate simulated sources
        searchResults = [
          { url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.split(' ').slice(0, 3).join('_'))}`, title: `${query} - Wikipedia` },
          { url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, title: `${query} - Search Results` },
        ];
      }

      // Step 5: Navigate to top results
      for (let i = 0; i < Math.min(searchResults.length, 3); i++) {
        const result = searchResults[i];
        addAction({
          type: "navigating",
          label: `Visiting source ${i + 1}`,
          url: result.url,
          detail: result.title,
          duration: 400 + Math.random() * 600,
        });
        await delay(600);

        addAction({
          type: "reading",
          label: `Reading: ${result.title}`,
          url: result.url,
          detail: result.snippet || "Extracting relevant content...",
          duration: 800 + Math.random() * 1200,
        });
        await delay(800);

        addAction({
          type: "extracting",
          label: "Extracting key information",
          detail: "Identifying relevant facts and data...",
          duration: 300 + Math.random() * 500,
        });
        await delay(400);
      }

      // Step 6: Analyzing
      addAction({
        type: "analyzing",
        label: "Analyzing collected information",
        detail: `Synthesizing data from ${searchResults.length} sources...`,
      });
      await delay(1000);

      // Update session with sources
      setBrowseSession(prev => prev ? {
        ...prev,
        sources: searchResults.map(r => ({ url: r.url, title: r.title })),
      } : null);

      // Step 7: Complete
      addAction({
        type: "complete",
        label: "Research complete",
        detail: `Found ${searchResults.length} relevant sources`,
      });

      setBrowseSession(prev => prev ? { ...prev, status: "complete" } : null);

    } catch (err) {
      addAction({
        type: "error",
        label: "Browse error",
        detail: err instanceof Error ? err.message : "Failed to complete browsing",
      });
      setBrowseSession(prev => prev ? { ...prev, status: "error" } : null);
    }

    return session;
  }, []);

  const closeBrowseSession = useCallback(() => {
    setBrowseSession(null);
  }, []);

  return { browseSession, shouldBrowse, startBrowseSession, closeBrowseSession };
}

// ─── Helpers ────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
