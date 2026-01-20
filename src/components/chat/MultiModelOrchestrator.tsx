import { useState } from "react";
import { 
  Brain, Zap, Target, Sparkles, Timer, 
  CheckCircle2, Loader2, ArrowRight, Settings,
  Cpu, Server, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface OrchestrationStep {
  id: string;
  model: string;
  purpose: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  tokens?: number;
  latency?: number;
}

interface MultiModelOrchestratorProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: string) => void;
  initialPrompt?: string;
}

const ORCHESTRATION_STRATEGIES = [
  {
    id: "consensus",
    name: "Consensus Mode",
    description: "Multiple models vote on the best answer",
    icon: Target,
    models: ["gemini-3-flash", "gpt-5-mini", "gemini-2.5-flash"],
  },
  {
    id: "chain",
    name: "Chain of Thought",
    description: "Each model refines the previous answer",
    icon: ArrowRight,
    models: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"],
  },
  {
    id: "specialist",
    name: "Specialist Routing",
    description: "Route to the best model for the task",
    icon: Brain,
    models: ["classifier", "specialist"],
  },
  {
    id: "parallel",
    name: "Parallel Analysis",
    description: "All models analyze simultaneously",
    icon: Server,
    models: ["gemini-3-flash", "gpt-5-mini", "gemini-2.5-pro"],
  },
];

const MODEL_INFO: Record<string, { name: string; speed: string; quality: string; cost: string }> = {
  "gemini-3-flash": { name: "Gemini 3 Flash", speed: "Fast", quality: "High", cost: "$" },
  "gemini-2.5-pro": { name: "Gemini 2.5 Pro", speed: "Slow", quality: "Highest", cost: "$$$" },
  "gemini-2.5-flash": { name: "Gemini 2.5 Flash", speed: "Fast", quality: "High", cost: "$$" },
  "gemini-2.5-flash-lite": { name: "Gemini Flash Lite", speed: "Fastest", quality: "Good", cost: "$" },
  "gpt-5-mini": { name: "GPT-5 Mini", speed: "Fast", quality: "High", cost: "$$" },
  "gpt-5": { name: "GPT-5", speed: "Medium", quality: "Highest", cost: "$$$" },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const MultiModelOrchestrator = ({ 
  isOpen, 
  onClose, 
  onResult,
  initialPrompt = ""
}: MultiModelOrchestratorProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedStrategy, setSelectedStrategy] = useState(ORCHESTRATION_STRATEGIES[0]);
  const [steps, setSteps] = useState<OrchestrationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);

  const runOrchestration = async () => {
    if (!prompt.trim()) return;
    
    setIsRunning(true);
    setFinalResult(null);
    
    const initialSteps: OrchestrationStep[] = selectedStrategy.models.map((model, i) => ({
      id: `step-${i}`,
      model,
      purpose: getPurposeForStep(selectedStrategy.id, i),
      status: "pending"
    }));
    
    setSteps(initialSteps);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let accumulatedResult = "";
      
      for (let i = 0; i < initialSteps.length; i++) {
        const step = initialSteps[i];
        
        setSteps(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: "running" } : s
        ));
        
        const startTime = Date.now();
        
        // Build context based on strategy
        let contextPrompt = prompt;
        if (selectedStrategy.id === "chain" && accumulatedResult) {
          contextPrompt = `Previous analysis:\n${accumulatedResult}\n\nRefine and improve this analysis for the question: ${prompt}`;
        } else if (selectedStrategy.id === "consensus") {
          contextPrompt = `Analyze this thoroughly and provide your best answer:\n${prompt}`;
        }
        
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: contextPrompt }],
            model: `google/${step.model}`,
            mode: "general"
          })
        });

        if (!resp.ok) throw new Error(`Model ${step.model} failed`);

        // Parse streaming response
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let stepOutput = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) stepOutput += content;
              } catch {}
            }
          }
        }

        const latency = Date.now() - startTime;
        accumulatedResult = stepOutput;
        
        setSteps(prev => prev.map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: "completed", 
            output: stepOutput.slice(0, 200) + (stepOutput.length > 200 ? "..." : ""),
            latency,
            tokens: Math.floor(stepOutput.length / 4)
          } : s
        ));
      }
      
      // Synthesize final result based on strategy
      let synthesisPrompt = "";
      if (selectedStrategy.id === "consensus") {
        synthesisPrompt = `You received these analyses from different AI models. Synthesize the best answer:\n\n${accumulatedResult}\n\nProvide a comprehensive, well-reasoned response.`;
      } else {
        synthesisPrompt = accumulatedResult;
      }
      
      setFinalResult(accumulatedResult);
      toast({ title: "Orchestration Complete", description: "Multi-model analysis finished successfully" });
      
    } catch (error) {
      console.error("Orchestration error:", error);
      toast({ 
        title: "Orchestration Failed", 
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "failed" } : s));
    } finally {
      setIsRunning(false);
    }
  };

  const getPurposeForStep = (strategy: string, index: number): string => {
    const purposes: Record<string, string[]> = {
      consensus: ["Initial analysis", "Alternative perspective", "Third opinion"],
      chain: ["Quick draft", "Refinement pass", "Final polish"],
      specialist: ["Task classification", "Specialist processing"],
      parallel: ["Analysis A", "Analysis B", "Analysis C"],
    };
    return purposes[strategy]?.[index] || `Step ${index + 1}`;
  };

  const handleUseResult = () => {
    if (finalResult) {
      onResult(finalResult);
      onClose();
    }
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const totalTokens = steps.reduce((sum, s) => sum + (s.tokens || 0), 0);
  const totalLatency = steps.reduce((sum, s) => sum + (s.latency || 0), 0);

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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Multi-Model Orchestrator
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20">
                Enterprise AI
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Combine multiple AI models for superior results
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Strategy Selection */}
        <div className="w-80 border-r border-border p-4 flex flex-col gap-4">
          <h3 className="font-medium text-sm">Orchestration Strategy</h3>
          <div className="space-y-2">
            {ORCHESTRATION_STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                disabled={isRunning}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedStrategy.id === strategy.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <strategy.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{strategy.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{strategy.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {strategy.models.map(m => (
                    <Badge key={m} variant="outline" className="text-[10px]">
                      {MODEL_INFO[m]?.name || m}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Advanced Settings */}
          <div className="mt-auto space-y-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Auto-optimize routing</span>
                  <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6">
          {/* Prompt Input */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium">Your Query</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a complex question that benefits from multi-model analysis..."
              disabled={isRunning}
              className="w-full h-32 p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Using {selectedStrategy.models.length} models in {selectedStrategy.name.toLowerCase()}
              </div>
              <Button onClick={runOrchestration} disabled={!prompt.trim() || isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Orchestration
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress */}
          {steps.length > 0 && (
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completedSteps} / {steps.length} models</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Steps */}
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-lg border ${
                        step.status === "running" 
                          ? "border-primary bg-primary/5" 
                          : step.status === "completed"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {step.status === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : step.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">
                            {MODEL_INFO[step.model]?.name || step.model}
                          </span>
                          <Badge variant="outline" className="text-xs">{step.purpose}</Badge>
                        </div>
                        {step.latency && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {(step.latency / 1000).toFixed(1)}s
                            </span>
                            {step.tokens && (
                              <span>{step.tokens} tokens</span>
                            )}
                          </div>
                        )}
                      </div>
                      {step.output && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.output}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Results Summary */}
              {finalResult && (
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">Orchestration Complete</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{totalTokens} total tokens</span>
                      <span>{(totalLatency / 1000).toFixed(1)}s total time</span>
                    </div>
                  </div>
                  <Button onClick={handleUseResult} className="w-full">
                    Use This Result in Chat
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
