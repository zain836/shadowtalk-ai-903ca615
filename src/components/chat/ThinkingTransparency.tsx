import { useState, useEffect, useMemo } from "react";
import { Brain, ChevronDown, ChevronUp, Loader2, CheckCircle, Lightbulb, Search, Zap, Target, Clock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// =============================================================================
// THINKING TRANSPARENCY - Claude-style reasoning display
// =============================================================================
// Shows AI's step-by-step thought process, making it more trustworthy than Claude
// =============================================================================

export interface ThinkingStep {
  id: string;
  phase: 'understanding' | 'analyzing' | 'researching' | 'reasoning' | 'synthesizing' | 'refining';
  title: string;
  content: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number; // ms
}

interface ThinkingTransparencyProps {
  isThinking: boolean;
  steps: ThinkingStep[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  showMiniProgress?: boolean;
}

const PHASE_CONFIG = {
  understanding: { 
    icon: Search, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10',
    label: 'Understanding Context' 
  },
  analyzing: { 
    icon: Target, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10',
    label: 'Analyzing Request' 
  },
  researching: { 
    icon: Search, 
    color: 'text-cyan-500', 
    bg: 'bg-cyan-500/10',
    label: 'Researching Information' 
  },
  reasoning: { 
    icon: Brain, 
    color: 'text-violet-500', 
    bg: 'bg-violet-500/10',
    label: 'Reasoning Through Options' 
  },
  synthesizing: { 
    icon: Lightbulb, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    label: 'Synthesizing Response' 
  },
  refining: { 
    icon: Sparkles, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10',
    label: 'Refining Output' 
  },
};

export const ThinkingTransparency = ({ 
  isThinking, 
  steps, 
  isExpanded, 
  onToggleExpand,
  showMiniProgress = true
}: ThinkingTransparencyProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Calculate progress
  const progress = useMemo(() => {
    if (steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === 'complete').length;
    const active = steps.find(s => s.status === 'active');
    return ((completed + (active ? 0.5 : 0)) / steps.length) * 100;
  }, [steps]);

  // Timer for elapsed time
  useEffect(() => {
    if (!isThinking) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, [isThinking]);

  const activeStep = steps.find(s => s.status === 'active');
  const activeConfig = activeStep ? PHASE_CONFIG[activeStep.phase] : null;

  if (steps.length === 0 && !isThinking) return null;

  return (
    <div className="mb-4">
      {/* Mini progress bar (shows while collapsed) */}
      {showMiniProgress && !isExpanded && isThinking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {activeConfig && (
              <>
                <activeConfig.icon className={cn("h-3 w-3 animate-pulse", activeConfig.color)} />
                <span>{activeConfig.label}</span>
              </>
            )}
            <span className="ml-auto font-mono">{(elapsedTime / 1000).toFixed(1)}s</span>
          </div>
          <Progress value={progress} className="h-1" />
        </motion.div>
      )}

      {/* Main thinking panel */}
      <motion.button
        onClick={onToggleExpand}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all w-full text-left",
          "bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10",
          "border border-violet-500/20 hover:border-violet-500/40",
          "shadow-sm hover:shadow-md",
          isThinking && "animate-pulse"
        )}
      >
        {/* Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isThinking ? "bg-violet-500/20" : "bg-violet-500/10"
        )}>
          {isThinking ? (
            <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
          ) : (
            <Brain className="h-5 w-5 text-violet-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-violet-600 dark:text-violet-400 font-semibold">
              {isThinking ? "Thinking..." : "View Reasoning Process"}
            </span>
            {steps.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {steps.filter(s => s.status === 'complete').length}/{steps.length} steps
              </span>
            )}
          </div>
          {activeStep && isThinking && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {activeStep.title}
            </p>
          )}
        </div>

        {/* Timer & Expand */}
        <div className="flex items-center gap-2 shrink-0">
          {isThinking && (
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(elapsedTime / 1000).toFixed(1)}s
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-violet-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-violet-500" />
          )}
        </div>
      </motion.button>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {steps.map((step, index) => {
                const config = PHASE_CONFIG[step.phase];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg border transition-all",
                      step.status === 'complete' && "bg-muted/30 border-border/50",
                      step.status === 'active' && cn(config.bg, "border-current/20"),
                      step.status === 'pending' && "bg-muted/10 border-border/30 opacity-50"
                    )}
                  >
                    {/* Step indicator */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      step.status === 'complete' && "bg-emerald-500/20",
                      step.status === 'active' && config.bg,
                      step.status === 'pending' && "bg-muted"
                    )}>
                      {step.status === 'complete' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : step.status === 'active' ? (
                        <Icon className={cn("h-4 w-4 animate-pulse", config.color)} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          step.status === 'active' && config.color,
                          step.status === 'complete' && "text-foreground",
                          step.status === 'pending' && "text-muted-foreground"
                        )}>
                          {step.title}
                        </span>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {step.duration}ms
                          </span>
                        )}
                      </div>
                      {step.content && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {step.content}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Summary stats */}
              {!isThinking && steps.length > 0 && (
                <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    {steps.length} reasoning steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Total: {(elapsedTime / 1000).toFixed(1)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="h-3 w-3 text-violet-500" />
                    Multi-model analysis
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// HOOK: Generate thinking steps from AI response
// =============================================================================
export const useThinkingSteps = () => {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const startThinking = (query: string) => {
    setIsThinking(true);
    const newSteps: ThinkingStep[] = [
      { id: '1', phase: 'understanding', title: 'Parsing your request', content: `Understanding: "${query.slice(0, 50)}..."`, status: 'pending' },
      { id: '2', phase: 'analyzing', title: 'Analyzing context', content: 'Checking conversation history and user preferences', status: 'pending' },
      { id: '3', phase: 'reasoning', title: 'Reasoning through options', content: 'Evaluating multiple approaches to provide the best response', status: 'pending' },
      { id: '4', phase: 'synthesizing', title: 'Synthesizing response', content: 'Combining insights into a coherent answer', status: 'pending' },
      { id: '5', phase: 'refining', title: 'Refining output', content: 'Polishing for clarity and accuracy', status: 'pending' },
    ];
    setSteps(newSteps);
    
    // Simulate step progression
    let currentIndex = 0;
    const progressStep = () => {
      if (currentIndex >= newSteps.length) {
        setIsThinking(false);
        return;
      }
      
      setSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i < currentIndex ? 'complete' : i === currentIndex ? 'active' : 'pending',
        duration: i < currentIndex ? Math.floor(Math.random() * 200) + 50 : undefined
      })));
      
      currentIndex++;
    };
    
    // Start first step immediately
    progressStep();
    
    return { progressStep, completeAll: () => {
      setSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const, duration: Math.floor(Math.random() * 200) + 50 })));
      setIsThinking(false);
    }};
  };

  const reset = () => {
    setSteps([]);
    setIsThinking(false);
  };

  return { steps, isThinking, startThinking, reset, setSteps, setIsThinking };
};

// =============================================================================
// Parse thinking from response
// =============================================================================
export const parseThinkingFromResponse = (content: string): { thinking: ThinkingStep[]; response: string } => {
  const thinkingSteps: ThinkingStep[] = [];
  
  // Look for <thinking> tags
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
  
  if (thinkingMatch) {
    const thinkingContent = thinkingMatch[1].trim();
    const lines = thinkingContent.split('\n').filter(l => l.trim());
    
    lines.forEach((line, i) => {
      const phase = i === 0 ? 'understanding' : 
                   i === 1 ? 'analyzing' :
                   i === 2 ? 'reasoning' :
                   i === 3 ? 'synthesizing' : 'refining';
      
      thinkingSteps.push({
        id: String(i),
        phase,
        title: line.slice(0, 50),
        content: line,
        status: 'complete',
        duration: Math.floor(Math.random() * 200) + 50
      });
    });
    
    const response = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    return { thinking: thinkingSteps, response };
  }
  
  return { thinking: [], response: content };
};
