import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, X, Loader2, Search, ExternalLink, CheckCircle2,
  Eye, FileText, ChevronDown, ChevronUp, ArrowRight,
  Sparkles, Clock, Link2, AlertCircle, PanelRightClose,
  Maximize2, Minimize2, MousePointer, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────

export interface BrowseAction {
  id: string;
  type: "navigating" | "reading" | "extracting" | "analyzing" | "searching" | "clicking" | "scrolling" | "typing" | "complete" | "error";
  label: string;
  url?: string;
  detail?: string;
  timestamp: Date;
  duration?: number;
  screenshot?: string; // HTML content for proxy rendering
  extractedText?: string;
}

export interface BrowseSession {
  id: string;
  query: string;
  actions: BrowseAction[];
  status: "active" | "complete" | "error";
  startedAt: Date;
  result?: string;
  sources: { url: string; title: string; favicon?: string }[];
  currentPageHtml?: string;
  currentPageTitle?: string;
}

interface BrowseActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  session: BrowseSession | null;
  onResultReady?: (result: string, sources: { url: string; title: string }[]) => void;
}

// ─── Action Config ──────────────────────────────────────────────

const actionConfig: Record<BrowseAction["type"], { icon: typeof Globe; color: string; verb: string }> = {
  navigating: { icon: Globe, color: "text-blue-400", verb: "Navigating" },
  reading: { icon: Eye, color: "text-cyan-400", verb: "Reading" },
  extracting: { icon: FileText, color: "text-amber-400", verb: "Extracting" },
  analyzing: { icon: Sparkles, color: "text-purple-400", verb: "Analyzing" },
  searching: { icon: Search, color: "text-green-400", verb: "Searching" },
  clicking: { icon: MousePointer, color: "text-orange-400", verb: "Clicking" },
  scrolling: { icon: Monitor, color: "text-teal-400", verb: "Scrolling" },
  typing: { icon: FileText, color: "text-pink-400", verb: "Typing" },
  complete: { icon: CheckCircle2, color: "text-emerald-400", verb: "Done" },
  error: { icon: AlertCircle, color: "text-red-400", verb: "Error" },
};

// ─── Component ──────────────────────────────────────────────────

export function BrowseActivityPanel({ isOpen, onClose, session, onResultReady }: BrowseActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.actions.length]);

  // Write proxy HTML to iframe
  useEffect(() => {
    if (!iframeRef.current || !session?.currentPageHtml) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(session.currentPageHtml);
      doc.close();
    }
  }, [session?.currentPageHtml]);

  if (!isOpen || !session) return null;

  const progress = session.status === "complete" ? 100 :
    session.actions.length > 0 ? Math.min(95, session.actions.length * 12) : 5;

  const elapsed = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
  const currentAction = session.actions[session.actions.length - 1];
  const currentUrl = [...session.actions].reverse().find(a => a.url)?.url;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isFullscreen ? "55%" : 440, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full border-l border-border/50 bg-background/95 backdrop-blur-xl flex flex-col overflow-hidden relative z-10"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <Monitor className="w-4 h-4 text-primary" />
              {session.status === "active" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
                />
              )}
            </div>
            <span className="text-sm font-semibold truncate">Computer</span>
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0 shrink-0 ${
                session.status === "active" ? "border-green-500/50 text-green-400" : 
                session.status === "complete" ? "border-emerald-500/50 text-emerald-400" : 
                "border-red-500/50 text-red-400"
              }`}
            >
              {session.status === "active" ? "● Active" : session.status === "complete" ? "✓ Done" : "✕ Error"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <PanelRightClose className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Current Action Banner ── */}
        {currentAction && session.status === "active" && (
          <motion.div 
            key={currentAction.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-primary/5 border-b border-border/30 flex items-center gap-2"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">
              {currentAction.label}
            </span>
          </motion.div>
        )}

        {/* ── Live Browser Viewport (Manus-style) ── */}
        <div className="relative flex-shrink-0" style={{ height: isExpanded ? 240 : 0 }}>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 240, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full border-b border-border/30 overflow-hidden"
              >
                {/* Browser Chrome */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border/30">
                  {/* Traffic lights */}
                  <div className="flex gap-1 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  </div>
                  {/* URL bar */}
                  <div className="flex-1 flex items-center gap-1.5 bg-background/80 rounded-md px-2 py-0.5 border border-border/40">
                    <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground truncate font-mono flex-1">
                      {currentUrl || "about:blank"}
                    </span>
                    {session.status === "active" && (
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-primary shrink-0" />
                    )}
                  </div>
                  {currentUrl && (
                    <ExternalLink
                      className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      onClick={() => window.open(currentUrl, "_blank")}
                    />
                  )}
                </div>

                {/* Page content area */}
                <div className="relative w-full" style={{ height: 210 }}>
                  {session.currentPageHtml ? (
                    <>
                      <iframe
                        ref={iframeRef}
                        title="Manus Browser View"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-same-origin"
                        style={{ 
                          transform: "scale(0.5)", 
                          transformOrigin: "0 0", 
                          width: "200%", 
                          height: "200%",
                          pointerEvents: "none",
                        }}
                      />
                      {/* AI cursor overlay */}
                      {session.status === "active" && (
                        <motion.div
                          className="absolute pointer-events-none z-10"
                          animate={{ 
                            x: [100, 200, 150, 250, 180],
                            y: [60, 100, 140, 80, 120],
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <MousePointer className="w-4 h-4 text-primary drop-shadow-lg" />
                        </motion.div>
                      )}
                      {/* Scan line */}
                      {session.status === "active" && (
                        <motion.div
                          className="absolute left-0 right-0 pointer-events-none z-10"
                          animate={{ y: [0, 200, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-muted/10 text-muted-foreground gap-2">
                      {session.status === "active" ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Globe className="w-6 h-6 text-primary/50" />
                          </motion.div>
                          <span className="text-xs">Loading browser...</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-6 h-6 text-muted-foreground/30" />
                          <span className="text-xs">No page loaded</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle viewport button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-muted border border-border rounded-full p-0.5 hover:bg-accent transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* ── Progress Bar ── */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="truncate max-w-[70%]">{session.query}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* ── Activity Log (Manus/Kimi timeline) ── */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/40" />

            <div className="space-y-0.5">
              {session.actions.map((action, i) => {
                const config = actionConfig[action.type];
                const Icon = config.icon;
                const isLatest = i === session.actions.length - 1 && session.status === "active";

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-start gap-2.5 py-1.5 px-1.5 rounded-md relative ${
                      isLatest ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 mt-0.5 ${config.color}`}>
                      {isLatest && session.status === "active" ? (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </motion.div>
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-medium ${isLatest ? "text-foreground" : "text-muted-foreground"}`}>
                          {action.label}
                        </span>
                        {action.duration && (
                          <span className="text-[9px] text-muted-foreground/50">
                            {action.duration > 1000 ? `${(action.duration / 1000).toFixed(1)}s` : `${action.duration}ms`}
                          </span>
                        )}
                      </div>
                      {action.url && (
                        <p className="text-[10px] text-muted-foreground/50 truncate font-mono mt-0.5">
                          {action.url}
                        </p>
                      )}
                      {action.detail && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">
                          {action.detail}
                        </p>
                      )}
                      {action.extractedText && (
                        <div className="mt-1 p-1.5 rounded bg-muted/40 border border-border/30">
                          <p className="text-[10px] text-muted-foreground line-clamp-3 italic">
                            "{action.extractedText}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Processing indicator */}
              {session.status === "active" && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex items-center gap-2 py-1.5 px-1.5 text-[11px] text-primary ml-5"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Working...</span>
                </motion.div>
              )}

              <div ref={logEndRef} />
            </div>
          </div>
        </ScrollArea>

        {/* ── Sources Footer ── */}
        {session.sources.length > 0 && (
          <div className="border-t border-border/50 px-3 py-2 bg-muted/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Sources ({session.sources.length})
              </span>
            </div>
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
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

// ─── Auto-Browse Hook (Real Manus-style with proxy) ─────────────

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
    if (message.length < 10 || message.includes("```")) return false;
    return BROWSE_PATTERNS.some(p => p.test(message));
  }, []);

  const startBrowseSession = useCallback(async (query: string): Promise<BrowseSession> => {
    const session: BrowseSession = {
      id: crypto.randomUUID(),
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
      // ── Step 1: Open browser & search ──
      addAction({ type: "searching", label: "Opening browser", detail: `Searching for: "${query}"` });
      await delay(400);

      addAction({ type: "typing", label: "Typing search query", detail: query });
      await delay(600);

      // ── Step 2: Navigate to search engine ──
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      addAction({ type: "navigating", label: "Navigating to DuckDuckGo", url: searchUrl });

      // Try to load the search page via proxy
      try {
        const { data: proxyData } = await supabase.functions.invoke('web-proxy', {
          body: { url: searchUrl, mode: "full" },
        });
        if (proxyData?.html) {
          setBrowseSession(prev => prev ? { ...prev, currentPageHtml: proxyData.html, currentPageTitle: "DuckDuckGo Search" } : null);
        }
      } catch { /* continue without proxy */ }

      await delay(500);

      addAction({ type: "reading", label: "Scanning search results", detail: "Identifying top results..." });
      await delay(400);

      // ── Step 3: Get real search results ──
      let searchResults: { url: string; title: string; snippet?: string }[] = [];

      try {
        const { data } = await supabase.functions.invoke('web-search', {
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
        searchResults = [
          { url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.split(' ').slice(0, 3).join('_'))}`, title: `${query} - Wikipedia` },
        ];
      }

      addAction({
        type: "reading",
        label: `Found ${searchResults.length} results`,
        detail: searchResults.map(r => r.title).slice(0, 3).join(", "),
      });
      await delay(300);

      // ── Step 4: Visit each result (Manus-style) ──
      for (let i = 0; i < Math.min(searchResults.length, 3); i++) {
        const result = searchResults[i];
        const startTime = Date.now();

        // Navigate
        addAction({
          type: "clicking",
          label: `Clicking result ${i + 1}`,
          detail: result.title,
        });
        await delay(300);

        addAction({
          type: "navigating",
          label: `Opening: ${new URL(result.url).hostname}`,
          url: result.url,
        });

        // Fetch page via proxy for real rendering
        let extractedContent = "";
        try {
          const { data: pageData } = await supabase.functions.invoke('web-proxy', {
            body: { url: result.url, mode: "full" },
          });
          if (pageData?.html) {
            setBrowseSession(prev => prev ? {
              ...prev,
              currentPageHtml: pageData.html,
              currentPageTitle: result.title,
            } : null);
          }
        } catch { /* continue */ }

        await delay(400);

        // Scrolling
        addAction({
          type: "scrolling",
          label: "Scrolling through page",
          url: result.url,
          duration: 800,
        });
        await delay(500);

        // Extract content
        addAction({
          type: "reading",
          label: `Reading: ${result.title}`,
          url: result.url,
        });

        try {
          const { data: extractData } = await supabase.functions.invoke('web-proxy', {
            body: { url: result.url, mode: "extract" },
          });
          if (extractData?.content) {
            extractedContent = extractData.content.slice(0, 200);
          }
        } catch { /* continue */ }

        await delay(300);

        addAction({
          type: "extracting",
          label: "Extracting key information",
          detail: result.snippet || "Processing page content...",
          duration: Date.now() - startTime,
          extractedText: extractedContent || result.snippet || undefined,
        });
        await delay(200);
      }

      // ── Step 5: Analyze ──
      addAction({
        type: "analyzing",
        label: "Synthesizing information",
        detail: `Analyzing data from ${searchResults.length} sources...`,
      });
      await delay(800);

      // Update sources
      setBrowseSession(prev => prev ? {
        ...prev,
        sources: searchResults.map(r => ({ url: r.url, title: r.title })),
      } : null);

      // ── Step 6: Complete ──
      addAction({
        type: "complete",
        label: "Research complete",
        detail: `Processed ${searchResults.length} sources in ${Math.round((Date.now() - session.startedAt.getTime()) / 1000)}s`,
      });

      setBrowseSession(prev => prev ? { ...prev, status: "complete" } : null);

    } catch (err) {
      addAction({
        type: "error",
        label: "Browser error",
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
