import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Zap, 
  Brain, 
  Play,
  Pause,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Target,
  Clock,
  Database,
  Globe,
  Code,
  FileSearch,
  Send,
  History,
  Sparkles,
  Crown,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Terminal,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface AgentTask {
  id: string;
  type: 'analyze' | 'research' | 'execute' | 'code' | 'data';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  subtasks?: AgentSubtask[];
}

interface AgentSubtask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

interface AgentMemory {
  id: string;
  type: 'context' | 'decision' | 'learning';
  content: string;
  timestamp: Date;
}

interface ShadowAgentPanelProps {
  onExecuteTask: (task: string) => Promise<{
    plan: string[];
    results: string[];
    summary: string;
  }>;
  isExecuting: boolean;
}

const AGENT_CAPABILITIES = [
  { icon: <Brain className="h-4 w-4" />, label: 'Reasoning', desc: 'Complex problem decomposition' },
  { icon: <Target className="h-4 w-4" />, label: 'Planning', desc: 'Multi-step task planning' },
  { icon: <Globe className="h-4 w-4" />, label: 'Research', desc: 'Web search & synthesis' },
  { icon: <Code className="h-4 w-4" />, label: 'Code', desc: 'Generate & execute code' },
  { icon: <Database className="h-4 w-4" />, label: 'Memory', desc: 'Persistent context' },
  { icon: <Shield className="h-4 w-4" />, label: 'Autonomy', desc: 'Self-directed execution' },
];

const EXAMPLE_TASKS = [
  "Research top 5 AI startups in healthcare and create a competitive analysis",
  "Analyze my codebase for security vulnerabilities and fix them",
  "Build a marketing strategy for launching a SaaS product",
  "Create a comprehensive business plan with financial projections",
  "Automate my daily workflow: check emails, summarize, and prioritize tasks",
];

const ShadowAgentPanel: React.FC<ShadowAgentPanelProps> = ({ 
  onExecuteTask,
  isExecuting 
}) => {
  const { user } = useAuth();
  const [taskInput, setTaskInput] = useState('');
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [agentMemory, setAgentMemory] = useState<AgentMemory[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load agent memory from Supabase
  useEffect(() => {
    const loadMemory = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('business_memories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(10);
        
        if (data && !error) {
          setAgentMemory(data.map(m => ({
            id: m.id,
            type: 'context' as const,
            content: `${m.title}: ${m.content}`,
            timestamp: new Date(m.created_at)
          })));
        }
      } catch (e) {
        console.error('Failed to load agent memory:', e);
      }
    };
    
    loadMemory();
  }, [user]);

  const executeTask = async () => {
    if (!taskInput.trim()) {
      toast.error('Please enter a task for the agent');
      return;
    }

    const newTask: AgentTask = {
      id: crypto.randomUUID(),
      type: detectTaskType(taskInput),
      description: taskInput,
      status: 'running',
      startedAt: new Date(),
      subtasks: []
    };

    setCurrentTask(newTask);
    setTaskInput('');

    // Add to memory
    const memoryEntry: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'decision',
      content: `Started task: ${taskInput}`,
      timestamp: new Date()
    };
    setAgentMemory(prev => [memoryEntry, ...prev].slice(0, 50));

    try {
      // Execute the task
      const result = await onExecuteTask(taskInput);
      
      // Update task with results
      const completedTask: AgentTask = {
        ...newTask,
        status: 'completed',
        completedAt: new Date(),
        result: result.summary,
        subtasks: result.plan.map((step, i) => ({
          id: crypto.randomUUID(),
          description: step,
          status: 'completed' as const,
          result: result.results[i] || 'Completed'
        }))
      };

      setCurrentTask(completedTask);
      setTaskHistory(prev => [completedTask, ...prev].slice(0, 20));

      // Save learning to memory
      const learningEntry: AgentMemory = {
        id: crypto.randomUUID(),
        type: 'learning',
        content: `Completed: ${newTask.description} → ${result.summary.slice(0, 100)}...`,
        timestamp: new Date()
      };
      setAgentMemory(prev => [learningEntry, ...prev].slice(0, 50));

      toast.success('Task completed successfully!');
    } catch (error) {
      const failedTask: AgentTask = {
        ...newTask,
        status: 'failed',
        completedAt: new Date(),
        result: error instanceof Error ? error.message : 'Task failed'
      };
      setCurrentTask(failedTask);
      setTaskHistory(prev => [failedTask, ...prev].slice(0, 20));
      toast.error('Task execution failed');
    }
  };

  const detectTaskType = (task: string): AgentTask['type'] => {
    const lower = task.toLowerCase();
    if (lower.includes('research') || lower.includes('find') || lower.includes('search')) return 'research';
    if (lower.includes('code') || lower.includes('build') || lower.includes('create app')) return 'code';
    if (lower.includes('analyze') || lower.includes('audit') || lower.includes('review')) return 'analyze';
    if (lower.includes('data') || lower.includes('database') || lower.includes('query')) return 'data';
    return 'execute';
  };

  const getTaskIcon = (type: AgentTask['type']) => {
    switch (type) {
      case 'research': return <Globe className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'analyze': return <FileSearch className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'running': return 'text-primary animate-pulse';
      case 'completed': return 'text-success';
      case 'failed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-6 w-6 text-primary" />
            <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              ShadowAgent
            </h2>
            <p className="text-xs text-muted-foreground">Autonomous AI Execution Engine</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20">
          <Crown className="h-3 w-3 text-amber-500" />
          ELITE
        </Badge>
      </div>

      {/* Capabilities Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            {AGENT_CAPABILITIES.map((cap, i) => (
              <div key={i} className="flex flex-col items-center text-center p-2 rounded-lg bg-background/50">
                <div className="text-primary mb-1">{cap.icon}</div>
                <span className="text-xs font-medium">{cap.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Input */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Agent Command Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe your task... e.g., 'Research competitors and create a SWOT analysis' or 'Build a REST API for user management'"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isExecuting}
          />
          
          {/* Quick Task Suggestions */}
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_TASKS.slice(0, 3).map((task, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setTaskInput(task)}
                disabled={isExecuting}
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                {task.slice(0, 40)}...
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={executeTask}
              disabled={isExecuting || !taskInput.trim()}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent Working...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Task
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Task Execution */}
      {currentTask && (
        <Card className={`border-2 ${
          currentTask.status === 'running' ? 'border-primary/50 shadow-glow' :
          currentTask.status === 'completed' ? 'border-success/50' :
          currentTask.status === 'failed' ? 'border-destructive/50' : 'border-border'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTaskIcon(currentTask.type)}
                <CardTitle className="text-sm">Current Task</CardTitle>
              </div>
              <Badge 
                variant={currentTask.status === 'completed' ? 'default' : 'secondary'}
                className={getStatusColor(currentTask.status)}
              >
                {currentTask.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {currentTask.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {currentTask.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                {currentTask.status.charAt(0).toUpperCase() + currentTask.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{currentTask.description}</p>
            
            {/* Subtasks Progress */}
            {currentTask.subtasks && currentTask.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{currentTask.subtasks.filter(s => s.status === 'completed').length}/{currentTask.subtasks.length}</span>
                </div>
                <Progress 
                  value={(currentTask.subtasks.filter(s => s.status === 'completed').length / currentTask.subtasks.length) * 100} 
                  className="h-2"
                />
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {currentTask.subtasks.map((subtask, i) => (
                      <div 
                        key={subtask.id}
                        className={`flex items-center gap-2 text-xs p-2 rounded ${
                          subtask.status === 'running' ? 'bg-primary/10' :
                          subtask.status === 'completed' ? 'bg-success/10' :
                          subtask.status === 'failed' ? 'bg-destructive/10' : 'bg-muted/50'
                        }`}
                      >
                        {subtask.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        {subtask.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-success" />}
                        {subtask.status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                        {subtask.status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground" />}
                        <span className="flex-1">{subtask.description}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Result */}
            {currentTask.result && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Result:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentTask.result}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Memory */}
      {agentMemory.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Agent Memory
              <Badge variant="outline" className="text-xs">{agentMemory.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {agentMemory.slice(0, 5).map((mem) => (
                  <div key={mem.id} className="flex items-start gap-2 text-xs p-1">
                    {mem.type === 'context' && <Brain className="h-3 w-3 text-blue-500 mt-0.5" />}
                    {mem.type === 'decision' && <Target className="h-3 w-3 text-amber-500 mt-0.5" />}
                    {mem.type === 'learning' && <Sparkles className="h-3 w-3 text-purple-500 mt-0.5" />}
                    <span className="text-muted-foreground truncate">{mem.content}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Task History */}
      {showHistory && taskHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Task History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {taskHistory.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => setTaskInput(task.description)}
                  >
                    {getTaskIcon(task.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{task.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.completedAt?.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert className="bg-primary/5 border-primary/20">
        <Bot className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          <strong>ShadowAgent</strong> uses generative AI for analysis and agentic AI for autonomous execution. 
          It can research, code, analyze data, and execute multi-step tasks without manual intervention.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ShadowAgentPanel;
