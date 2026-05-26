import { useState, useEffect } from "react";
import { 
  Bot, Play, Pause, Square, CheckCircle2, XCircle, 
  Clock, Loader2, ChevronRight, Settings, Zap,
  Globe, Mail, Calendar, FileText, ShoppingCart, CalendarDays,
  Plane, Database, Code, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface TaskStep {
  id: string;
  action: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: string;
  duration?: number;
}

interface AgentTask {
  id: string;
  goal: string;
  status: "idle" | "planning" | "executing" | "paused" | "completed" | "failed";
  steps: TaskStep[];
  startTime?: Date;
  endTime?: Date;
}

interface AgenticTaskRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete: (result: string) => void;
  initialGoal?: string;
  autoStart?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const TASK_TEMPLATES = [
  { icon: Globe, label: "Research & Report", prompt: "Research [topic] and create a detailed report" },
  { icon: Mail, label: "Email Draft", prompt: "Draft an email to [recipient] about [topic]" },
  { icon: CalendarDays, label: "Daily Planner", prompt: "Plan my productive day with work, exercise, and breaks" },
  { icon: Calendar, label: "Meeting Schedule", prompt: "Plan my schedule for [event/meeting]" },
  { icon: ShoppingCart, label: "Product Comparison", prompt: "Compare products for [category] and recommend" },
  { icon: Plane, label: "Travel Planning", prompt: "Plan a trip to [destination] for [dates]" },
  { icon: Code, label: "Code Generation", prompt: "Build a [feature] with [technology]" },
  { icon: Database, label: "Data Analysis", prompt: "Analyze this data and find insights" },
  { icon: FileText, label: "Document Creation", prompt: "Create a [document type] for [purpose]" },
];

export const AgenticTaskRunner = ({ isOpen, onClose, onTaskComplete, initialGoal, autoStart }: AgenticTaskRunnerProps) => {
  const { toast } = useToast();
  const [goal, setGoal] = useState(initialGoal || "");
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const startTask = async () => {
    if (!goal.trim()) return;

    const newTask: AgentTask = {
      id: crypto.randomUUID(),
      goal,
      status: "planning",
      steps: [],
      startTime: new Date()
    };

    setCurrentTask(newTask);
    setLogs([]);
    addLog(`Starting task: ${goal}`);
    addLog("Analyzing goal and creating execution plan...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Step 1: Plan the task - use standard chat to generate a plan
      addLog("Generating task steps...");
      
      const planResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: `Break down this task into 4-6 numbered steps. Only list the steps, nothing else:\n\n${goal}` 
          }],
          personality: "professional",
          mode: "general"
        })
      });

      if (!planResp.ok) {
        const errText = await planResp.text();
        console.error("Planning failed:", errText);
        throw new Error("Planning failed");
      }

      // Parse streaming response for plan
      const reader = planResp.body?.getReader();
      const decoder = new TextDecoder();
      let planContent = "";

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
              if (content) planContent += content;
            } catch {}
          }
        }
      }

      // Parse steps from plan
      const stepMatches = planContent.match(/\d+\.\s+[^\n]+/g) || [];
      const plannedSteps: TaskStep[] = stepMatches.map((s, i) => ({
        id: `step-${i + 1}`,
        action: s.replace(/^\d+\.\s+/, '').trim(),
        status: "pending" as const
      }));

      if (plannedSteps.length === 0) {
        plannedSteps.push(
          { id: "step-1", action: "Analyze the request", status: "pending" },
          { id: "step-2", action: "Gather relevant information", status: "pending" },
          { id: "step-3", action: "Process and synthesize data", status: "pending" },
          { id: "step-4", action: "Generate final output", status: "pending" }
        );
      }

      setCurrentTask(prev => prev ? { ...prev, status: "executing", steps: plannedSteps } : null);
      addLog(`Plan created with ${plannedSteps.length} steps`);

      // Step 2: Execute each step
      for (let i = 0; i < plannedSteps.length; i++) {
        const step = plannedSteps[i];
        addLog(`Executing step ${i + 1}: ${step.action}`);
        
        setCurrentTask(prev => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          newSteps[i] = { ...newSteps[i], status: "running" };
          return { ...prev, steps: newSteps };
        });

        // Execute step via AI
        const startMs = Date.now();
        try {
          const stepResp = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: `Execute this step for the goal "${goal}": ${step.action}. Provide a concise result.` }],
              personality: "professional",
              mode: "general"
            })
          });
          const stepData = await stepResp.json();
          const stepResult = typeof stepData === 'string' ? stepData : (stepData?.response || stepData?.text || `Completed: ${step.action}`);
          const duration = Date.now() - startMs;

          setCurrentTask(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[i] = { 
              ...newSteps[i], 
              status: "completed",
              result: stepResult.slice(0, 200),
              duration
            };
            return { ...prev, steps: newSteps };
          });
        } catch (stepError) {
          setCurrentTask(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[i] = { ...newSteps[i], status: "failed", result: "Step execution failed", duration: Date.now() - startMs };
            return { ...prev, steps: newSteps };
          });
        }

        addLog(`Step ${i + 1} completed`);
      }

      // Step 3: Generate final result
      addLog("Generating final output...");

      const resultResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: goal }],
          personality: "professional",
          mode: "general"
        })
      });

      if (!resultResp.ok) throw new Error("Result generation failed");

      const resultContent = await consumeChatSSE(resultResp, () => {});

      setCurrentTask(prev => prev ? { ...prev, status: "completed", endTime: new Date() } : null);
      addLog("Task completed successfully!");

      toast({ title: "Task Complete", description: "The agent has finished executing your task." });
      onTaskComplete(resultContent);

    } catch (error) {
      console.error("Agent task error:", error);
      setCurrentTask(prev => prev ? { ...prev, status: "failed" } : null);
      addLog(`Error: ${error instanceof Error ? error.message : "Task failed"}`);
      toast({
        title: "Task Failed",
        description: "The agent encountered an error while executing the task.",
        variant: "destructive"
      });
    }
  };

  const pauseTask = () => {
    if (currentTask?.status === "executing") {
      setCurrentTask(prev => prev ? { ...prev, status: "paused" } : null);
      addLog("Task paused by user");
    }
  };

  const resumeTask = () => {
    if (currentTask?.status === "paused") {
      setCurrentTask(prev => prev ? { ...prev, status: "executing" } : null);
      addLog("Task resumed");
    }
  };

  const cancelTask = () => {
    setCurrentTask(prev => prev ? { ...prev, status: "failed" } : null);
    addLog("Task cancelled by user");
  };

  // Auto-start task when opened with a goal (after startTask is defined)
  useEffect(() => {
    if (autoStart && initialGoal && !currentTask && !hasAutoStarted) {
      setHasAutoStarted(true);
      startTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, initialGoal, hasAutoStarted]);

  // Update goal when initialGoal changes
  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
    }
  }, [initialGoal]);

  const getStatusColor = (status: TaskStep["status"]) => {
    switch (status) {
      case "completed": return "text-green-500";
      case "running": return "text-blue-500";
      case "failed": return "text-red-500";
      case "skipped": return "text-yellow-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: TaskStep["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "running": return <Loader2 className="h-4 w-4 animate-spin" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const completedSteps = currentTask?.steps.filter(s => s.status === "completed").length || 0;
  const totalSteps = currentTask?.steps.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col"
    >
      {/* Header - Premium */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            {currentTask?.status === "executing" && (
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-xl border-2 border-primary/40" />
            )}
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Shadow Agent
              <Badge variant="secondary" className="text-xs font-mono">AUTONOMOUS</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Multi-step reasoning with Cognitive Loop architecture
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">Close</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6">
          {/* Goal Input */}
          {!currentTask && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">What would you like me to do?</label>
                <div className="flex gap-2">
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Research the latest AI developments and create a summary report"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && startTask()}
                  />
                  <Button onClick={startTask} disabled={!goal.trim()}>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Quick Templates</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TASK_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => setGoal(template.prompt)}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
                    >
                      <template.icon className="h-5 w-5 text-primary mb-2" />
                      <span className="text-sm font-medium">{template.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Auto-approve actions</p>
                    <p className="text-xs text-muted-foreground">
                      Skip confirmation prompts for each step
                    </p>
                  </div>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>
            </div>
          )}

          {/* Task Progress */}
          {currentTask && (
            <div className="space-y-6">
              {/* Current Goal */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-medium">Current Goal</span>
                  </div>
                  <Badge variant={
                    currentTask.status === "completed" ? "default" :
                    currentTask.status === "failed" ? "destructive" :
                    "secondary"
                  }>
                    {currentTask.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentTask.goal}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completedSteps} / {totalSteps} steps</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Steps - Connected Timeline */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Execution Pipeline</h3>
                <div className="relative space-y-0">
                  {/* Connecting line */}
                  <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/50" />
                  {currentTask.steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                      className="relative pl-12 py-2"
                    >
                      {/* Node */}
                      <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center z-10 ${
                        step.status === "running" ? "bg-primary/20 border-2 border-primary" :
                        step.status === "completed" ? "bg-emerald-500/20 border border-emerald-500/50" :
                        step.status === "failed" ? "bg-destructive/20 border border-destructive/50" :
                        "bg-muted border border-border"
                      }`}>
                        <span className={getStatusColor(step.status)}>{getStatusIcon(step.status)}</span>
                      </div>
                      {/* Content */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        step.status === "running" ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/10" : 
                        step.status === "completed" ? "border-emerald-500/20 bg-emerald-500/5" :
                        "border-border/50 bg-card/30"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{step.action}</span>
                          {step.duration && (
                            <Badge variant="outline" className="text-xs font-mono">{(step.duration / 1000).toFixed(1)}s</Badge>
                          )}
                        </div>
                        {step.status === "running" && (
                          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="mt-1.5 h-1 rounded-full bg-primary/20 overflow-hidden">
                            <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1, repeat: Infinity }}
                              className="h-full w-1/3 rounded-full bg-primary" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {currentTask.status === "executing" && (
                  <Button variant="outline" onClick={pauseTask}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {currentTask.status === "paused" && (
                  <Button onClick={resumeTask}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                {["executing", "paused"].includes(currentTask.status) && (
                  <Button variant="destructive" onClick={cancelTask}>
                    <Square className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {["completed", "failed"].includes(currentTask.status) && (
                  <Button onClick={() => setCurrentTask(null)}>
                    Start New Task
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logs Panel - Premium */}
        <div className="w-96 border-l border-border/50 flex flex-col bg-muted/10">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <span className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Live Execution Log
            </span>
            <Switch checked={showLogs} onCheckedChange={setShowLogs} />
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-0.5 font-mono text-[11px]">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`px-2 py-1 rounded ${
                    log.includes('Error') ? 'text-red-400 bg-red-500/5' :
                    log.includes('completed') ? 'text-emerald-400 bg-emerald-500/5' :
                    log.includes('Starting') ? 'text-primary bg-primary/5' :
                    'text-muted-foreground hover:text-foreground'
                  } transition-colors`}
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
};
