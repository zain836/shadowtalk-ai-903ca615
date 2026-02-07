import { useState } from "react";
import { Brain, Bot, Loader2, Users, CheckCircle2, AlertCircle, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { useCognitiveLoop, CognitiveResult, AgentResponse } from "@/hooks/useCognitiveLoop";

interface CognitiveLoopPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: string) => void;
  initialQuery?: string;
}

const PHASE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  idle: { label: 'Ready', icon: <Brain className="h-4 w-4" />, color: 'text-muted-foreground' },
  perceiving: { label: 'Analyzing Query', icon: <Zap className="h-4 w-4 animate-pulse" />, color: 'text-yellow-500' },
  planning: { label: 'Selecting Agents', icon: <Users className="h-4 w-4" />, color: 'text-blue-500' },
  debating: { label: 'Agents Debating', icon: <Bot className="h-4 w-4 animate-bounce" />, color: 'text-purple-500' },
  synthesizing: { label: 'Synthesizing', icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-green-500' },
  learning: { label: 'Updating Memory', icon: <Brain className="h-4 w-4" />, color: 'text-cyan-500' },
};

export const CognitiveLoopPanel = ({ isOpen, onClose, onResult, initialQuery }: CognitiveLoopPanelProps) => {
  const { 
    isThinking, 
    currentPhase, 
    activeAgents, 
    progress, 
    debateRound,
    runCognitiveLoop, 
    cancel,
    availableAgents 
  } = useCognitiveLoop();

  const [result, setResult] = useState<CognitiveResult | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [query, setQuery] = useState(initialQuery || '');

  const handleRun = async () => {
    if (!query.trim()) return;
    
    setResult(null);
    const cogResult = await runCognitiveLoop(query);
    
    if (cogResult) {
      setResult(cogResult);
      onResult(cogResult.finalAnswer);
    }
  };

  const toggleAgent = (agentId: string) => {
    setExpandedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const phaseInfo = PHASE_LABELS[currentPhase] || PHASE_LABELS.idle;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Cognitive Loop
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                Multi-Agent Debate
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {availableAgents.length} specialist agents • Perceive → Plan → Debate → Synthesize
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6 gap-6">
          {/* Query Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Query for Multi-Agent Analysis</label>
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Should we expand to the EU market? What are the legal, financial, and technical considerations?"
                className="flex-1 min-h-[80px] p-3 rounded-lg border border-border bg-background resize-none"
                disabled={isThinking}
              />
            </div>
            <div className="flex gap-2">
              {!isThinking ? (
                <Button onClick={handleRun} disabled={!query.trim()} className="gap-2">
                  <Brain className="h-4 w-4" />
                  Run Cognitive Loop
                </Button>
              ) : (
                <Button onClick={cancel} variant="destructive" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 rounded-lg border border-border bg-muted/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={phaseInfo.color}>{phaseInfo.icon}</span>
                  <span className="font-medium">{phaseInfo.label}</span>
                  {debateRound > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Round {debateRound}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {activeAgents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeAgents.map((agent, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="animate-pulse"
                    >
                      {agent}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 space-y-4 overflow-hidden"
            >
              {/* Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium">Cognitive Loop Complete</p>
                  <p className="text-sm text-muted-foreground">{result.debateSummary}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-500">{result.consensusLevel}%</div>
                  <div className="text-xs text-muted-foreground">Consensus</div>
                </div>
              </div>

              {/* Agent Responses */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Agent Perspectives ({result.agentResponses.length})
                </h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {result.agentResponses.map((resp) => (
                      <Collapsible
                        key={resp.agentId}
                        open={expandedAgents.includes(resp.agentId)}
                        onOpenChange={() => toggleAgent(resp.agentId)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-primary" />
                              <span className="font-medium">{resp.agentName}</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(resp.confidence * 100)}% confident
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{resp.latencyMs}ms</span>
                              {expandedAgents.includes(resp.agentId) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 mt-1 rounded-lg bg-muted/20 text-sm">
                            {resp.response.slice(0, 500)}...
                            {resp.disagreements && resp.disagreements.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <span className="text-xs text-orange-500 font-medium">Disagreements:</span>
                                <ul className="text-xs text-muted-foreground mt-1">
                                  {resp.disagreements.map((d, i) => (
                                    <li key={i}>• {d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Final Answer */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Synthesized Answer
                  <Badge variant="secondary" className="text-xs">
                    Dominant: {result.dominantAgent}
                  </Badge>
                </h3>
                <ScrollArea className="h-[150px] p-4 rounded-lg border border-border bg-muted/10">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {result.finalAnswer}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Available Agents */}
        <div className="w-80 border-l border-border p-4 hidden lg:block">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Specialist Agents
          </h3>
          <div className="space-y-3">
            {availableAgents.map((agent) => (
              <div
                key={agent.id}
                className={`p-3 rounded-lg border transition-all ${
                  activeAgents.includes(agent.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="font-medium text-sm">{agent.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{agent.domain}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
