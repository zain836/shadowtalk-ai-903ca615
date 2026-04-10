import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Bot, Plus, Play, Pause, Trash2, Cpu, MemoryStick, Zap, Network, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface LocalAgent {
  id: string;
  name: string;
  type: "research" | "coding" | "analysis" | "writing";
  status: "idle" | "running" | "paused" | "completed";
  progress: number;
  task: string;
  cpuUsage: number;
  memoryMB: number;
  startedAt: number | null;
  messages: string[];
}

const AGENT_TYPES = [
  { type: "research" as const, label: "Research Agent", icon: "🔍", color: "text-blue-400", desc: "Deep web research & analysis" },
  { type: "coding" as const, label: "Code Agent", icon: "💻", color: "text-emerald-400", desc: "Code generation & review" },
  { type: "analysis" as const, label: "Analysis Agent", icon: "📊", color: "text-amber-400", desc: "Data analysis & insights" },
  { type: "writing" as const, label: "Writing Agent", icon: "✍️", color: "text-purple-400", desc: "Content creation & editing" },
];

const AgentArchitecturePage = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<LocalAgent[]>([]);
  const [systemStats, setSystemStats] = useState({ totalCPU: 0, totalMemory: 0, activeAgents: 0 });

  useEffect(() => {
    document.title = "Distributed Agent Architecture — ShadowTalk AI";
  }, []);

  // Simulate agent progress
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.status !== "running") return agent;
        const newProgress = Math.min(agent.progress + Math.random() * 3, 100);
        const newMessages = [...agent.messages];
        if (Math.random() > 0.85 && newMessages.length < 8) {
          const msgs = {
            research: ["Scanning sources...", "Extracting data...", "Cross-referencing...", "Compiling report..."],
            coding: ["Parsing AST...", "Generating code...", "Running tests...", "Optimizing output..."],
            analysis: ["Loading dataset...", "Computing metrics...", "Finding patterns...", "Generating charts..."],
            writing: ["Outlining structure...", "Drafting content...", "Refining tone...", "Polishing output..."],
          };
          newMessages.push(msgs[agent.type][Math.floor(Math.random() * 4)]);
        }
        return {
          ...agent,
          progress: newProgress,
          cpuUsage: Math.random() * 30 + 10,
          memoryMB: Math.random() * 100 + 50,
          status: newProgress >= 100 ? "completed" : "running",
          messages: newMessages,
        };
      }));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const active = agents.filter(a => a.status === "running");
    setSystemStats({
      totalCPU: active.reduce((s, a) => s + a.cpuUsage, 0),
      totalMemory: active.reduce((s, a) => s + a.memoryMB, 0),
      activeAgents: active.length,
    });
  }, [agents]);

  const spawnAgent = useCallback((type: typeof AGENT_TYPES[number]["type"]) => {
    const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newAgent: LocalAgent = {
      id,
      name: `${AGENT_TYPES.find(t => t.type === type)?.label} #${agents.filter(a => a.type === type).length + 1}`,
      type,
      status: "running",
      progress: 0,
      task: `Autonomous ${type} task`,
      cpuUsage: Math.random() * 20 + 5,
      memoryMB: Math.random() * 50 + 30,
      startedAt: Date.now(),
      messages: ["Initializing agent..."],
    };
    setAgents(prev => [...prev, newAgent]);
    toast({ title: "Agent Spawned", description: `${newAgent.name} is now running locally.` });
  }, [agents, toast]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "running" ? "paused" : "running" } : a));
  };

  const removeAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
            <Network className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">On-Device Processing Available</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Distributed Agent <span className="gradient-text">Architecture</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Spawn unlimited parallel agents that run entirely on your device. No cloud dependency, no data exposure, no latency.
          </p>
        </motion.div>

        {/* System Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Active Agents", value: systemStats.activeAgents, icon: Bot, suffix: "" },
            { label: "CPU Usage", value: Math.round(systemStats.totalCPU), icon: Cpu, suffix: "%" },
            { label: "Memory", value: Math.round(systemStats.totalMemory), icon: MemoryStick, suffix: " MB" },
            { label: "Privacy", value: 100, icon: Shield, suffix: "%" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50 bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}{stat.suffix}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Spawn Agent Buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Spawn New Agent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AGENT_TYPES.map((at) => (
              <Button key={at.type} variant="outline" className="h-auto py-4 flex-col gap-2 border-border/50 hover:border-primary/40" onClick={() => spawnAgent(at.type)}>
                <span className="text-2xl">{at.icon}</span>
                <span className="text-sm font-medium">{at.label}</span>
                <span className="text-[10px] text-muted-foreground">{at.desc}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Active Agents */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Agents ({agents.length})</h2>
          <AnimatePresence>
            {agents.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
                <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No agents running. Spawn one above to get started.</p>
              </motion.div>
            )}
            {agents.map((agent) => (
              <motion.div key={agent.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} layout>
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{AGENT_TYPES.find(t => t.type === agent.type)?.icon}</span>
                          <span className="font-medium text-sm truncate">{agent.name}</span>
                          <Badge variant={agent.status === "running" ? "default" : agent.status === "completed" ? "secondary" : "outline"} className="text-[10px]">
                            {agent.status}
                          </Badge>
                        </div>
                        <Progress value={agent.progress} className="h-1.5 mb-2" />
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{Math.round(agent.cpuUsage)}%</span>
                          <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3" />{Math.round(agent.memoryMB)} MB</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round(agent.progress)}%</span>
                          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" />Local</span>
                        </div>
                        {agent.messages.length > 0 && (
                          <div className="mt-2 text-[11px] text-primary/80 font-mono">
                            → {agent.messages[agent.messages.length - 1]}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {agent.status !== "completed" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAgent(agent.id)}>
                            {agent.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => removeAgent(agent.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AgentArchitecturePage;
