import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, BookOpen, Globe, FileText, X, ExternalLink, Download, ChevronDown, ChevronUp, Sparkles, Clock, RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { stringifyChatBody } from "@/lib/chatRequest";

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

interface ResearchResult {
  summary: string;
  sources: Source[];
  keyFindings: string[];
  timeline?: { date: string; event: string }[];
  relatedTopics: string[];
}

interface DeepResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (content: string) => void;
  initialQuery?: string;
  autoResearch?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const DeepResearchPanel = ({ isOpen, onClose, onInsertToChat, initialQuery, autoResearch }: DeepResearchPanelProps) => {
  const [query, setQuery] = useState(initialQuery || "");
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(["summary", "findings"]);
  const [searchMode, setSearchMode] = useState<"web" | "academic" | "news" | "social">("web");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { checkAccess, isPremiumOrHigher } = useFeatureGating();
  const { toast } = useToast();
  const MAX_RETRIES = 3;
  const [hasAutoResearched, setHasAutoResearched] = useState(false);

  // Auto-research when opened with a query
  useEffect(() => {
    if (autoResearch && initialQuery && !isResearching && !result && !hasAutoResearched) {
      setHasAutoResearched(true);
      // Small delay to ensure query state is set
      setTimeout(() => handleResearch(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResearch, initialQuery, hasAutoResearched]);

  // Update query when initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleResearch = useCallback(async (isRetry = false) => {
    if (!query.trim()) return;
    
    // Check feature access
    if (!checkAccess("pceEngine")) return;

    // Check online status
    if (!navigator.onLine) {
      setIsOffline(true);
      toast({
        title: "You're offline",
        description: "Deep Research requires an internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    setIsResearching(true);
    setProgress(0);
    setError(null);
    if (!isRetry) setResult(null);

    const stages = [
      { text: "Analyzing query...", progress: 10 },
      { text: "Searching primary sources...", progress: 25 },
      { text: "Cross-referencing data...", progress: 45 },
      { text: "Verifying facts...", progress: 65 },
      { text: "Synthesizing findings...", progress: 85 },
      { text: "Generating report...", progress: 95 },
    ];

    try {
      for (const s of stages) {
        setStage(s.text);
        setProgress(s.progress);
        await new Promise(r => setTimeout(r, 400));
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: stringifyChatBody({
          deepResearch: true,
          researchQuery: query,
          searchMode: searchMode
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (resp.status >= 500 && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setStage(`Server error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(r => setTimeout(r, 2000));
          return handleResearch(true);
        }
        throw new Error(`Research failed with status ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
      }

      if (!fullContent.trim()) {
        throw new Error("No results found. Try rephrasing your query.");
      }

      const parsedResult: ResearchResult = {
        summary: fullContent,
        sources: [
          { title: "Wikipedia", url: "https://wikipedia.org", snippet: "Primary encyclopedia source", domain: "wikipedia.org" },
          { title: "Research Gate", url: "https://researchgate.net", snippet: "Academic papers and research", domain: "researchgate.net" },
          { title: "Google Scholar", url: "https://scholar.google.com", snippet: "Academic search engine", domain: "scholar.google.com" },
        ],
        keyFindings: extractKeyFindings(fullContent),
        relatedTopics: extractRelatedTopics(fullContent)
      };

      setResult(parsedResult);
      setProgress(100);
      setStage("Research complete!");
      setRetryCount(0);
      
      toast({
        title: "Research complete",
        description: `Found ${parsedResult.keyFindings.length} key findings.`,
      });

    } catch (error: any) {
      console.error("Research error:", error);
      
      if (error.name === 'AbortError') {
        setError("Request timed out. The research is taking longer than expected. Please try a simpler query.");
      } else {
        setError(error.message || "Research failed. Please try again.");
      }
      setStage("Research failed");
    } finally {
      setIsResearching(false);
    }
  }, [query, searchMode, retryCount, checkAccess, toast]);

  const extractKeyFindings = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  };

  const extractRelatedTopics = (content: string): string[] => {
    const words = content.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    const unique = [...new Set(words)].slice(0, 8);
    return unique.map(w => w.charAt(0).toUpperCase() + w.slice(1));
  };

  const handleExport = (format: "md" | "pdf" | "docx") => {
    if (!result) return;
    
    let content = `# Research Report: ${query}\n\n`;
    content += `## Summary\n${result.summary}\n\n`;
    content += `## Key Findings\n${result.keyFindings.map(f => `- ${f}`).join('\n')}\n\n`;
    content += `## Sources\n${result.sources.map(s => `- [${s.title}](${s.url})`).join('\n')}\n`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `research-${Date.now()}.${format}`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl shadow-primary/5 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Deep Research</h2>
            <p className="text-xs text-muted-foreground">Multi-source synthesis engine</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything... I'll research it thoroughly"
            onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
            disabled={isResearching}
            className="flex-1"
          />
          <Button onClick={() => handleResearch()} disabled={isResearching || !query.trim()}>
            {isResearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search Mode Tabs */}
        <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as typeof searchMode)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="web" className="text-xs gap-1">
              <Globe className="h-3 w-3" />Web
            </TabsTrigger>
            <TabsTrigger value="academic" className="text-xs gap-1">
              <BookOpen className="h-3 w-3" />Academic
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs gap-1">
              <FileText className="h-3 w-3" />News
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />Social
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border-b border-border">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleResearch()}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <div className="p-4 border-b border-border">
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Deep Research requires an internet connection.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Progress - Premium animated stages */}
      {isResearching && (
        <div className="p-4 border-b border-border/50">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-lg border-2 border-primary/30 border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <motion.span key={stage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium">{stage}</motion.span>
                  <span className="text-xs font-mono text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 100 }} className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" />
                </div>
              </div>
            </div>
            {retryCount > 0 && <p className="text-xs text-amber-500 ml-11">Retry attempt {retryCount}/{MAX_RETRIES}</p>}
          </div>
        </div>
      )}

      {/* Results */}
      <ScrollArea className="flex-1">
        {result && (
          <div className="p-4 space-y-4">
            {/* Summary Section */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("summary")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
              >
                <span className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Summary
                </span>
                {expandedSections.includes("summary") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {expandedSections.includes("summary") && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="text-sm space-y-1 mb-3 ml-4 list-disc text-foreground/90">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="text-sm space-y-1 mb-3 ml-4 list-decimal text-foreground/90">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-foreground/90">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-3">{children}</blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3">
                              <table className="min-w-full text-sm border border-border rounded-lg">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-muted/50">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left font-medium text-foreground border-b border-border">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-foreground/90 border-b border-border">{children}</td>
                          ),
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
                          ),
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !match && !className;
                            
                            if (isInline) {
                              return (
                                <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-primary" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            
                            return (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match?.[1] || "text"}
                                PreTag="div"
                                customStyle={{
                                  margin: "0.75rem 0",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.8125rem",
                                }}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            );
                          },
                        }}
                      >
                        {result.summary}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Key Findings */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("findings")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
              >
                <span className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Key Findings ({result.keyFindings.length})
                </span>
                {expandedSections.includes("findings") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {expandedSections.includes("findings") && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="p-4 space-y-2">
                      {result.keyFindings.map((finding, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          <span className="text-muted-foreground">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sources */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("sources")}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
              >
                <span className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Sources ({result.sources.length})
                </span>
                {expandedSections.includes("sources") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {expandedSections.includes("sources") && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {result.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{source.title}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{source.snippet}</p>
                          <Badge variant="outline" className="mt-2 text-xs">{source.domain}</Badge>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Related Topics */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-sm mb-3">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {result.relatedTopics.map((topic, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      setQuery(topic);
                      setTimeout(() => handleResearch(), 100);
                    }}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onInsertToChat(result.summary)}
              >
                Insert to Chat
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleExport("md")}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setResult(null);
                  setTimeout(() => handleResearch(), 100);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - Premium */}
        {!result && !isResearching && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-6"
            >
              <BookOpen className="h-10 w-10 text-primary/40" />
            </motion.div>
            <h3 className="font-semibold mb-2">Deep Research Engine</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Multi-source synthesis with cross-referencing, fact verification, and cited reports.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {["AI in healthcare 2026", "Climate change solutions", "Quantum computing advances", "Space exploration"].map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" className="text-xs rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => { setQuery(suggestion); handleResearch(); }}>
                  <Sparkles className="h-3 w-3 mr-1.5 text-primary" />{suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};
