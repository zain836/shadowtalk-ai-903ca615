import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Lightbulb,
  FileText,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Quote,
  Zap,
  MessageCircleQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOfflineResearch } from '@/hooks/useOfflineResearch';

const OfflineResearchPanel = () => {
  const [query, setQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState(false);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');

  const {
    isResearching,
    progress,
    stage,
    results,
    error,
    conductResearch,
    quickAnswer,
    clearResults,
    hasKnowledgeBase,
    documentCount,
  } = useOfflineResearch();

  const handleResearch = async () => {
    if (!query.trim()) return;
    await conductResearch(query.trim(), { depth });
  };

  const handleFollowUp = (q: string) => {
    setQuery(q);
    clearResults();
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Deep Research</h3>
            <p className="text-xs text-muted-foreground">
              {documentCount > 0
                ? `${documentCount} documents indexed • Multi-step analysis`
                : 'Knowledge base ready • Conversation memory enabled'}
            </p>
          </div>
          {results && (
            <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={clearResults}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to research?"
            className="bg-background/60 border-border/40"
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            disabled={isResearching}
          />
          <Select value={depth} onValueChange={(v) => setDepth(v as any)} disabled={isResearching}>
            <SelectTrigger className="w-[110px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="deep">Deep</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleResearch} disabled={isResearching || !query.trim()} className="shrink-0">
            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {isResearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-border/20"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{stage}</span>
              <span className="text-xs font-mono text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <ScrollArea className="flex-1">
        {results ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
            {/* Query Decomposition */}
            {results.queryDecomposition && results.queryDecomposition.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {results.queryDecomposition.map((q, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {i === 0 ? '🎯' : '📎'} {q}
                  </Badge>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Research Summary</h4>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/20">
                {results.summary}
              </div>
            </div>

            {/* Insights */}
            {results.insights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-foreground">Key Insights</h4>
                </div>
                <ul className="space-y-1.5">
                  {results.insights.map((insight, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      {insight}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-Up Questions */}
            {results.followUpQuestions && results.followUpQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-foreground">Explore Further</h4>
                </div>
                <div className="space-y-1.5">
                  {results.followUpQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleFollowUp(q)}
                      className="w-full text-left text-xs p-2 rounded-md bg-primary/5 hover:bg-primary/10 border border-primary/10 text-muted-foreground transition-colors"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {results.sources.length > 0 && (
              <div className="space-y-2">
                <button onClick={() => setExpandedSources(!expandedSources)} className="flex items-center gap-2 w-full text-left">
                  <Quote className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Sources ({results.sources.length})</h4>
                  {expandedSources ? (
                    <ChevronUp className="w-3 h-3 ml-auto text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSources && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {results.sources.map((source) => (
                        <div key={source.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/20 border border-border/10">
                          <Badge variant="outline" className="text-[10px] shrink-0">{source.type}</Badge>
                          <span className="text-muted-foreground truncate">{source.title}</span>
                          <span className="ml-auto text-primary/60 font-mono shrink-0">{Math.round(source.relevance * 100)}%</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Citations */}
            {results.citations.length > 0 && (
              <div className="text-[10px] text-muted-foreground/60 space-y-0.5 pt-2 border-t border-border/10">
                {results.citations.map((cite, i) => (
                  <p key={i}>{cite}</p>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          !isResearching && (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Enter a topic to begin deep research</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Multi-step analysis • Conversation memory • Query decomposition
              </p>
            </div>
          )
        )}

        {error && (
          <div className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OfflineResearchPanel;
