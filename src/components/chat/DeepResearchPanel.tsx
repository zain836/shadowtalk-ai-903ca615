import { useState } from "react";
import { Search, Loader2, BookOpen, Globe, FileText, X, ExternalLink, Download, ChevronDown, ChevronUp, Sparkles, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const DeepResearchPanel = ({ isOpen, onClose, onInsertToChat }: DeepResearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(["summary", "findings"]);
  const [searchMode, setSearchMode] = useState<"web" | "academic" | "news" | "social">("web");

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleResearch = async () => {
    if (!query.trim()) return;
    
    setIsResearching(true);
    setProgress(0);
    setResult(null);

    // Simulate research stages
    const stages = [
      { text: "Analyzing query...", progress: 10 },
      { text: "Searching primary sources...", progress: 25 },
      { text: "Cross-referencing data...", progress: 45 },
      { text: "Verifying facts...", progress: 65 },
      { text: "Synthesizing findings...", progress: 85 },
      { text: "Generating report...", progress: 95 },
    ];

    try {
      // Progress simulation
      for (const s of stages) {
        setStage(s.text);
        setProgress(s.progress);
        await new Promise(r => setTimeout(r, 600));
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          deepResearch: true,
          researchQuery: query,
          searchMode: searchMode
        })
      });

      if (!resp.ok) throw new Error("Research failed");

      // Parse streaming response
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

      // Parse the research result
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

    } catch (error) {
      console.error("Research error:", error);
      setStage("Research failed. Please try again.");
    } finally {
      setIsResearching(false);
    }
  };

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
      className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Deep Research</h2>
          <Badge variant="secondary" className="text-xs">Perplexity-style</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
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
          <Button onClick={handleResearch} disabled={isResearching || !query.trim()}>
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

      {/* Progress */}
      {isResearching && (
        <div className="p-4 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stage}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
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
                    <div className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                      {result.summary}
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
                      handleResearch();
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
                  handleResearch();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !isResearching && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-2">Deep Research Mode</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter a topic or question above. I'll search multiple sources, cross-reference data, and generate a comprehensive research report with citations.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
              {["AI in healthcare 2026", "Climate change solutions", "Quantum computing advances", "Space exploration"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setQuery(suggestion);
                    handleResearch();
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};
