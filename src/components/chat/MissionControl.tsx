import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, X, Play, Pause, Square, CheckCircle2, XCircle,
  Clock, Loader2, ChevronRight, Settings, Zap, Plus,
  Globe, Mail, Calendar, FileText, ShoppingCart, Plane,
  Database, Code, MessageSquare, Shield, Eye, Trash2,
  RefreshCw, AlertTriangle, ArrowRight, Sparkles, Target
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
import { cn } from "@/lib/utils";

interface MissionControlProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionComplete?: (result: string) => void;
  initialGoal?: string;
}

const MISSION_TEMPLATES = [
  { icon: Globe, label: "Lead Generation", prompt: "Find 10 qualified leads for [industry] in [location]" },
  { icon: Mail, label: "Email Campaign", prompt: "Draft personalized outreach emails for [prospects]" },
  { icon: Calendar, label: "Schedule Optimizer", prompt: "Analyze my calendar and suggest optimizations" },
  { icon: FileText, label: "Report Generator", prompt: "Create a comprehensive report on [topic]" },
  { icon: ShoppingCart, label: "Market Research", prompt: "Research competitors and market trends for [product]" },
  { icon: Plane, label: "Travel Planner", prompt: "Plan a business trip to [destination]" },
  { icon: Database, label: "Data Analysis", prompt: "Analyze this dataset and extract insights" },
  { icon: Code, label: "Code Review", prompt: "Review code for security and performance" },
];

const getStatusColor = (status: Mission['status']) => {
  switch (status) {
    case 'completed': return 'text-green-500 bg-green-500/10';
    case 'running': return 'text-blue-500 bg-blue-500/10';
    case 'failed': return 'text-red-500 bg-red-500/10';
    case 'paused': return 'text-yellow-500 bg-yellow-500/10';
    case 'cancelled': return 'text-gray-500 bg-gray-500/10';
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

export const MissionControl = ({ isOpen, onClose, onMissionComplete, initialGoal }: MissionControlProps) => {
  const { toast } = useToast();
  const { missions, activeMission, actions, fetchActions, createMission, setActiveMission } = useMissions();
  const { isExecuting, executeMission, cancelExecution } = useMissionExecutor();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState(initialGoal || "");
  const [autoApprove, setAutoApprove] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

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

    const missionTitle = title.trim() || goal.slice(0, 50) + (goal.length > 50 ? '...' : '');
    const mission = await createMission(missionTitle, goal, { auto_approve: autoApprove });
    
    if (mission) {
      setActiveMission(mission);
      setActiveTab("active");
      setTitle("");
      setGoal("");
      
      // Auto-start execution
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                Sovereign Execution Engine
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
                  S.E.E.
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                Persistent background missions that work while you sleep
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="create" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Mission
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  <Target className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Create Mission Tab */}
              <TabsContent value="create" className="flex-1 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mission Title (optional)</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Karachi Real Estate Leads"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">What should S.E.E. accomplish?</label>
                    <Textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Find 10 real estate leads in Karachi, verify their phone numbers, and draft a personalized intro email in my tone. Save results to my Google Sheets."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Auto-approve actions</p>
                        <p className="text-xs text-muted-foreground">
                          Execute without manual confirmation
                        </p>
                      </div>
                    </div>
                    <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                  </div>

                  <Button 
                    onClick={handleCreateMission} 
                    disabled={!goal.trim() || isExecuting}
                    className="w-full h-12 gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5" />
                        Launch Mission
                      </>
                    )}
                  </Button>
                </div>

                {/* Templates */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Quick Templates</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MISSION_TEMPLATES.map((template) => (
                      <button
                        key={template.label}
                        onClick={() => setGoal(template.prompt)}
                        className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                      >
                        <template.icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{template.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Differentiator Card */}
                <Card className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">ChatGPT gives you a plan. S.E.E. gives you the result.</h3>
                        <p className="text-sm text-muted-foreground">
                          Close your laptop. S.E.E. works for hours in the background. 
                          Come back to completed tasks, not text suggestions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Active Mission Tab */}
              <TabsContent value="active" className="flex-1">
                {activeMission ? (
                  <div className="space-y-6">
                    {/* Mission Header */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{activeMission.title}</CardTitle>
                          </div>
                          <Badge className={cn("gap-1", getStatusColor(activeMission.status))}>
                            {getStatusIcon(activeMission.status)}
                            {activeMission.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{activeMission.goal}</p>
                        
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{activeMission.progress}%</span>
                          </div>
                          <Progress value={activeMission.progress} className="h-2" />
                        </div>

                        {/* Controls */}
                        {activeMission.status === 'running' && (
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={cancelExecution}>
                              <Square className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Steps */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Execution Steps</h3>
                      <div className="space-y-2">
                        {activeMission.steps.map((step, i) => (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              step.status === 'running' && "border-primary bg-primary/5",
                              step.status === 'completed' && "border-green-500/30 bg-green-500/5",
                              step.status === 'failed' && "border-red-500/30 bg-red-500/5",
                              step.status === 'pending' && "border-border"
                            )}
                          >
                            <span className={cn(
                              step.status === 'completed' && "text-green-500",
                              step.status === 'running' && "text-primary",
                              step.status === 'failed' && "text-red-500",
                            )}>
                              {step.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                              {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                              {step.status === 'failed' && <XCircle className="h-4 w-4" />}
                              {step.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                            </span>
                            <span className="flex-1 text-sm">{step.action}</span>
                            {step.duration_ms && (
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(step.duration_ms)}
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Action Stream */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Proof of Action Stream</h3>
                      <ScrollArea className="h-[200px] rounded-lg border border-border bg-muted/30 p-3">
                        <div className="space-y-2 font-mono text-xs">
                          {actions.map((action) => (
                            <div 
                              key={action.id} 
                              className={cn(
                                "flex items-center gap-2",
                                action.status === 'success' && "text-green-500",
                                action.status === 'failed' && "text-red-500",
                                action.status === 'running' && "text-blue-500",
                              )}
                            >
                              <span className="text-muted-foreground">
                                [{new Date(action.created_at).toLocaleTimeString()}]
                              </span>
                              <span className="capitalize">[{action.status}]</span>
                              <span>{action.action_name}</span>
                            </div>
                          ))}
                          {actions.length === 0 && (
                            <p className="text-muted-foreground">Waiting for actions...</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Result */}
                    {activeMission.status === 'completed' && activeMission.result && (
                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="h-5 w-5" />
                            Mission Complete
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm whitespace-pre-wrap">
                            {typeof activeMission.result === 'object' 
                              ? JSON.stringify(activeMission.result, null, 2)
                              : String(activeMission.result)
                            }
                          </pre>
                          <Button 
                            className="mt-4"
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Target className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Mission</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a new mission to get started
                    </p>
                    <Button onClick={() => setActiveTab("create")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mission
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {missions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Mission History</h3>
                        <p className="text-sm text-muted-foreground">
                          Your completed missions will appear here
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
                                  <h4 className="font-medium truncate">{mission.title}</h4>
                                  <Badge className={cn("shrink-0 gap-1", getStatusColor(mission.status))}>
                                    {getStatusIcon(mission.status)}
                                    {mission.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{mission.goal}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(mission.created_at).toLocaleDateString()} • 
                                  {mission.actual_duration_ms 
                                    ? ` ${formatDuration(mission.actual_duration_ms)}`
                                    : ' In progress'}
                                </p>
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
