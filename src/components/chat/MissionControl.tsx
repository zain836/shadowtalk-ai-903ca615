import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, X, Play, Pause, Square, CheckCircle2, XCircle,
  Clock, Loader2, ChevronRight, Settings, Zap, Plus,
  Globe, Mail, Calendar, FileText, ShoppingCart, Plane,
  Database, Code, MessageSquare, Shield, Eye, Trash2,
  RefreshCw, AlertTriangle, ArrowRight, Sparkles, Target,
  Brain, Workflow, Bot, Activity, TrendingUp, Users,
  Search, Image, Mic, PenTool, BarChart3, Network,
  GitBranch, ArrowDown, Circle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMissions, Mission } from "@/hooks/useMissions";
import { useMissionExecutor } from "@/hooks/useMissionExecutor";
import { useMissionQuota, MISSION_LIMITS } from "@/hooks/useMissionQuota";
import { cn } from "@/lib/utils";

interface MissionControlProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionComplete?: (result: string) => void;
  initialGoal?: string;
}

// ─── Template Categories ───
const TEMPLATE_CATEGORIES = [
  { key: "research", label: "Research & Analysis", icon: Search },
  { key: "content", label: "Content & Creation", icon: PenTool },
  { key: "business", label: "Business & Growth", icon: TrendingUp },
  { key: "engineering", label: "Engineering & Code", icon: Code },
] as const;

const MISSION_TEMPLATES = [
  { icon: Globe, label: "Lead Generation", prompt: "Find 10 qualified leads for [industry] in [location], verify contact info, and draft intro emails", category: "business" },
  { icon: Mail, label: "Email Campaign", prompt: "Draft personalized outreach emails for [prospects] with A/B variants and send scheduling", category: "business" },
  { icon: ShoppingCart, label: "Market Research", prompt: "Research competitors, market trends, and pricing strategies for [product]", category: "research" },
  { icon: BarChart3, label: "Competitor Analysis", prompt: "Deep-dive competitive analysis: features, pricing, reviews, and market positioning for [competitor]", category: "research" },
  { icon: Search, label: "Deep Research", prompt: "Multi-source research with citations on [topic] — synthesize 10+ sources into executive brief", category: "research" },
  { icon: TrendingUp, label: "SEO Audit", prompt: "Complete SEO audit of [website]: keywords, backlinks, technical issues, and action plan", category: "business" },
  { icon: FileText, label: "Report Generator", prompt: "Create a comprehensive report on [topic] with charts, insights, and recommendations", category: "content" },
  { icon: Image, label: "Content Pipeline", prompt: "Generate a week of social media content: captions, hashtags, and image prompts for [brand]", category: "content" },
  { icon: PenTool, label: "Blog Writer", prompt: "Research and write a 2000-word SEO-optimized blog post on [topic] with sources", category: "content" },
  { icon: Mic, label: "Podcast Prep", prompt: "Research guest [name], prepare 20 interview questions, and create show notes outline", category: "content" },
  { icon: Code, label: "Code Review", prompt: "Security and performance review of [repo/code] with fix suggestions and priority ranking", category: "engineering" },
  { icon: Database, label: "Data Analysis", prompt: "Analyze this dataset, find patterns, create visualizations, and extract actionable insights", category: "engineering" },
  { icon: Network, label: "API Integration", prompt: "Research [API] documentation, generate integration code, and create test suite", category: "engineering" },
  { icon: Shield, label: "Security Audit", prompt: "Comprehensive security audit: OWASP top 10, dependency vulnerabilities, and remediation plan", category: "engineering" },
  { icon: Calendar, label: "Schedule Optimizer", prompt: "Analyze my calendar and suggest optimizations for deep work blocks and meeting efficiency", category: "business" },
  { icon: Users, label: "Talent Sourcing", prompt: "Find 15 candidates for [role] on LinkedIn, GitHub, rank by fit, and draft outreach", category: "business" },
];

// ─── Status Helpers ───
const getStatusColor = (status: Mission['status']) => {
  switch (status) {
    case 'completed': return 'text-green-500 bg-green-500/10';
    case 'running': return 'text-blue-500 bg-blue-500/10';
    case 'failed': return 'text-red-500 bg-red-500/10';
    case 'paused': return 'text-yellow-500 bg-yellow-500/10';
    case 'cancelled': return 'text-muted-foreground bg-muted';
    default: return 'text-muted-foreground bg-muted';
  }
};

const getStatusIcon = (status: Mission['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-4 w-4" />;
    case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'failed': return <XCircle className="h-4 w-4" />;
    case 'paused': return <Pause className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getNodeStatusStyles = (status: string) => {
  switch (status) {
    case 'completed': return 'border-green-500/50 bg-green-500/10 shadow-green-500/20';
    case 'running': return 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/20 shadow-lg';
    case 'failed': return 'border-red-500/50 bg-red-500/10 shadow-red-500/20';
    default: return 'border-border bg-muted/30';
  }
};

// ─── Node Pipeline Component ───
const NodePipeline = ({ steps, actions }: { steps: Mission['steps']; actions: any[] }) => {
  return (
    <div className="relative flex flex-col gap-1 py-2">
      {steps.map((step, i) => {
        const relatedActions = actions.filter(a => a.action_name?.toLowerCase().includes(step.action?.toLowerCase().slice(0, 15)));
        const isActive = step.status === 'running';
        
        return (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {i > 0 && (
              <div className="absolute left-6 -top-1 w-px h-2 bg-gradient-to-b from-border to-transparent" />
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-xl border transition-all",
                getNodeStatusStyles(step.status),
                isActive && "ring-1 ring-blue-500/30"
              )}
            >
              {/* Node indicator */}
              <div className="relative shrink-0 mt-0.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                  step.status === 'completed' && "bg-green-500/20 text-green-500",
                  step.status === 'running' && "bg-blue-500/20 text-blue-500",
                  step.status === 'failed' && "bg-red-500/20 text-red-500",
                  step.status === 'pending' && "bg-muted text-muted-foreground",
                )}>
                  {step.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                  {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {step.status === 'failed' && <XCircle className="h-4 w-4" />}
                  {step.status === 'pending' && <span>{i + 1}</span>}
                </div>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border border-blue-500/50"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{step.action}</span>
                  {step.duration_ms && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {step.duration_ms > 60000 
                        ? `${Math.floor(step.duration_ms / 60000)}m ${Math.floor((step.duration_ms % 60000) / 1000)}s`
                        : `${Math.floor(step.duration_ms / 1000)}s`
                      }
                    </span>
                  )}
                </div>

                {/* Live action log for running step */}
                {isActive && relatedActions.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="mt-2 p-2 rounded-lg bg-background/50 border border-border/50 font-mono text-[11px] space-y-1 max-h-24 overflow-y-auto"
                  >
                    {relatedActions.slice(-3).map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate text-muted-foreground">{a.action_name}</span>
                        <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Error display */}
                {step.status === 'failed' && (
                  <div className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Step failed — retry available</span>
                  </div>
                )}
              </div>

              {/* Dependency arrows */}
              {i < steps.length - 1 && (
                <div className="absolute left-6 -bottom-1 w-px h-2 bg-gradient-to-b from-transparent to-border" />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Intelligence Sidebar Stats ───
const IntelligenceSidebar = ({ missions }: { missions: Mission[] }) => {
  const completed = missions.filter(m => m.status === 'completed').length;
  const totalDuration = missions.reduce((sum, m) => sum + (m.actual_duration_ms || 0), 0);
  const avgDuration = completed > 0 ? totalDuration / completed : 0;
  const successRate = missions.length > 0 ? (completed / missions.length * 100) : 0;

  const stats = [
    { label: "Missions Run", value: missions.length, icon: Rocket, color: "text-primary" },
    { label: "Success Rate", value: `${Math.round(successRate)}%`, icon: Target, color: "text-green-500" },
    { label: "Avg Duration", value: avgDuration > 0 ? `${Math.round(avgDuration / 60000)}m` : "—", icon: Clock, color: "text-blue-500" },
    { label: "Tasks Automated", value: missions.reduce((s, m) => s + m.steps.length, 0), icon: Workflow, color: "text-amber-500" },
  ];

  return (
    <div className="w-64 border-l border-border p-4 space-y-4 hidden lg:block">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Agent Intelligence</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-3 rounded-xl border border-border bg-muted/30 text-center">
            <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
            <div className="text-lg font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capabilities</h4>
        {[
          { label: "Web Browsing", active: true },
          { label: "Code Execution", active: true },
          { label: "File Generation", active: true },
          { label: "Multi-Model AI", active: true },
          { label: "Offline Mode", active: true },
          { label: "HITL Safety", active: true },
        ].map(cap => (
          <div key={cap.label} className="flex items-center gap-2 text-xs">
            <CheckCircle2 className={cn("h-3 w-3", cap.active ? "text-green-500" : "text-muted-foreground")} />
            <span className={cap.active ? "" : "text-muted-foreground"}>{cap.label}</span>
          </div>
        ))}
      </div>

      {/* Differentiator */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
        <p className="text-[11px] text-center">
          <span className="font-semibold text-primary">S.E.E.</span>
          <span className="text-muted-foreground"> runs </span>
          <span className="font-semibold text-green-500">offline</span>
          <span className="text-muted-foreground"> — Manus can't.</span>
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───
export const MissionControl = ({ isOpen, onClose, onMissionComplete, initialGoal }: MissionControlProps) => {
  const { toast } = useToast();
  const { missions, activeMission, actions, fetchActions, createMission, setActiveMission } = useMissions();
  const { isExecuting, executeMission, cancelExecution } = useMissionExecutor();
  const { quotaInfo, canCreateMission, consumeMission, maxRetries } = useMissionQuota();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState(initialGoal || "");
  const [autoApprove, setAutoApprove] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (initialGoal) setGoal(initialGoal);
  }, [initialGoal]);

  useEffect(() => {
    if (activeMission) {
      fetchActions(activeMission.id);
    }
  }, [activeMission, fetchActions]);

  const handleCreateMission = async () => {
    if (!goal.trim()) return;

    if (!canCreateMission) {
      toast({
        title: "Mission quota reached",
        description: `You've used all ${quotaInfo?.limit} missions this month. Upgrade for more.`,
        variant: "destructive",
      });
      return;
    }

    const missionTitle = title.trim() || goal.slice(0, 50) + (goal.length > 50 ? '...' : '');
    const mission = await createMission(missionTitle, goal, { auto_approve: autoApprove });
    
    if (mission) {
      setActiveMission(mission);
      setActiveTab("active");
      setTitle("");
      setGoal("");
      await consumeMission();
      executeMission(mission);
    }
  };

  const handleViewMission = (mission: Mission) => {
    setActiveMission(mission);
    setActiveTab("active");
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const filteredTemplates = selectedCategory === "all"
    ? MISSION_TEMPLATES
    : MISSION_TEMPLATES.filter(t => t.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col"
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              <Rocket className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                Sovereign Execution Engine
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
                  S.E.E. v2
                </Badge>
                {isExecuting && (
                  <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1 animate-pulse">
                    <Activity className="h-3 w-3" />
                    LIVE
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Autonomous agent that works while you sleep — offline capable, privacy-first
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* ─── Main Content ─── */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
                <TabsTrigger value="create" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Mission
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2 relative">
                  <Target className="h-4 w-4" />
                  Pipeline
                  {isExecuting && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="h-4 w-4" />
                  History ({missions.length})
                </TabsTrigger>
              </TabsList>

              {/* ─── Create Mission Tab ─── */}
              <TabsContent value="create" className="flex-1 space-y-6">
                <div className="max-w-2xl space-y-4">
                  {/* NL Input — primary focus */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      What should the agent accomplish?
                    </label>
                    <Textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Describe any complex goal in natural language. The agent will decompose it into steps, execute autonomously, and deliver results.

Example: Find 10 SaaS companies in Berlin, analyze their pricing pages, compare features, and generate a competitive landscape report with charts."
                      className="min-h-[140px] resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mission Title (optional)</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Auto-generated from your goal if left empty"
                      className="h-10"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Auto-approve</p>
                          <p className="text-[10px] text-muted-foreground">Skip manual confirmations</p>
                        </div>
                      </div>
                      <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                    </div>

                    {quotaInfo && (
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
                        <Target className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            {quotaInfo.remaining}/{quotaInfo.limit === Infinity ? '∞' : quotaInfo.limit}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Remaining</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateMission}
                    disabled={!goal.trim() || isExecuting || !canCreateMission}
                    className="w-full h-12 gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Agent Executing...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5" />
                        Launch Autonomous Mission
                      </>
                    )}
                  </Button>
                </div>

                {/* ─── Agent Templates ─── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      One-Click Agent Workflows
                    </label>
                  </div>

                  {/* Category pills */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="h-7 text-xs"
                    >
                      All
                    </Button>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <Button
                        key={cat.key}
                        variant={selectedCategory === cat.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.key)}
                        className="h-7 text-xs gap-1"
                      >
                        <cat.icon className="h-3 w-3" />
                        {cat.label}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {filteredTemplates.map((template) => (
                      <motion.button
                        key={template.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGoal(template.prompt)}
                        className="p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                      >
                        <template.icon className="h-4 w-4 text-primary mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium block">{template.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Differentiator */}
                <Card className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20 max-w-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Manus gives you a sandbox. S.E.E. gives you sovereignty.</h3>
                        <p className="text-xs text-muted-foreground">
                          Close your laptop. S.E.E. can run with on-device models when enabled.
                          Sensitive steps stay local; cloud steps use encrypted transport. Come back to completed tasks, not cloud bills.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Active Pipeline Tab ─── */}
              <TabsContent value="active" className="flex-1">
                {activeMission ? (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Pipeline — left 3 cols */}
                    <div className="lg:col-span-3 space-y-4">
                      {/* Mission header card */}
                      <Card className={cn(
                        "border-l-4",
                        activeMission.status === 'running' && "border-l-blue-500",
                        activeMission.status === 'completed' && "border-l-green-500",
                        activeMission.status === 'failed' && "border-l-red-500",
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{activeMission.title}</h3>
                            </div>
                            <Badge className={cn("gap-1", getStatusColor(activeMission.status))}>
                              {getStatusIcon(activeMission.status)}
                              {activeMission.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{activeMission.goal}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Progress value={activeMission.progress} className="h-2" />
                            </div>
                            <span className="text-sm font-mono font-bold">{activeMission.progress}%</span>
                          </div>
                          {activeMission.status === 'running' && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" onClick={cancelExecution} className="gap-1">
                                <Square className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Visual Pipeline */}
                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-primary" />
                          Execution Pipeline
                        </h3>
                        <NodePipeline steps={activeMission.steps} actions={actions} />
                      </div>
                    </div>

                    {/* Proof of Action — right 2 cols */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Proof of Action Stream
                      </h3>
                      <ScrollArea className="h-[400px] rounded-xl border border-border bg-muted/20 p-3">
                        <div className="space-y-1.5 font-mono text-[11px]">
                          {actions.map((action) => (
                            <motion.div
                              key={action.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-lg",
                                action.status === 'success' && "text-green-500 bg-green-500/5",
                                action.status === 'failed' && "text-red-500 bg-red-500/5",
                                action.status === 'running' && "text-blue-500 bg-blue-500/5",
                              )}
                            >
                              <span className="text-muted-foreground shrink-0">
                                {new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="capitalize shrink-0">[{action.status}]</span>
                              <span className="break-all">{action.action_name}</span>
                            </motion.div>
                          ))}
                          {actions.length === 0 && (
                            <div className="flex flex-col items-center py-8 text-muted-foreground">
                              <Activity className="h-8 w-8 mb-2 opacity-30" />
                              <p>Waiting for actions...</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* Result */}
                      {activeMission.status === 'completed' && activeMission.result && (
                        <Card className="border-green-500/30 bg-green-500/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-green-500">
                              <CheckCircle2 className="h-4 w-4" />
                              Mission Complete
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {typeof activeMission.result === 'object'
                                ? JSON.stringify(activeMission.result, null, 2)
                                : String(activeMission.result)
                              }
                            </pre>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => {
                                if (onMissionComplete && activeMission.result) {
                                  onMissionComplete(
                                    typeof activeMission.result === 'object'
                                      ? JSON.stringify(activeMission.result, null, 2)
                                      : String(activeMission.result)
                                  );
                                }
                                onClose();
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send to Chat
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Target className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium mb-2">No Active Mission</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a mission and watch the agent execute it step-by-step
                    </p>
                    <Button onClick={() => setActiveTab("create")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Mission
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ─── History Tab ─── */}
              <TabsContent value="history" className="flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {missions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="h-16 w-16 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Mission History</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed missions will appear here with full execution logs
                        </p>
                      </div>
                    ) : (
                      missions.map((mission) => (
                        <Card
                          key={mission.id}
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => handleViewMission(mission)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate text-sm">{mission.title}</h4>
                                  <Badge className={cn("shrink-0 gap-1 text-[10px]", getStatusColor(mission.status))}>
                                    {getStatusIcon(mission.status)}
                                    {mission.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{mission.goal}</p>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                  <span>{new Date(mission.created_at).toLocaleDateString()}</span>
                                  {mission.actual_duration_ms && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(mission.actual_duration_ms)}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Workflow className="h-3 w-3" />
                                    {mission.steps.length} steps
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* ─── Intelligence Sidebar ─── */}
          <IntelligenceSidebar missions={missions} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
