import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Zap, 
  Brain, 
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Target,
  Clock,
  Database,
  Globe,
  Code,
  FileSearch,
  History,
  Sparkles,
  Crown,
  ChevronRight,
  Terminal,
  Shield,
  Cog,
  Eye,
  MousePointer,
  Workflow
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CLAWDBOT-INSPIRED AGENTIC ARCHITECTURE
// =============================================================================
// ShadowAgent uses a hybrid architecture:
// - BRAIN (LLM): Lovable AI Gateway for reasoning & task decomposition
// - HANDS (Agent): Local agentic executor inspired by Clawdbot patterns
// - MEMORY (Storage): Supabase Vector/Postgres for persistent context
// =============================================================================

interface AgentTask {
  id: string;
  type: 'analyze' | 'research' | 'execute' | 'code' | 'data' | 'browse' | 'automate';
  description: string;
  status: 'pending' | 'planning' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  subtasks?: AgentSubtask[];
  requiresApproval?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface AgentSubtask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  tool?: string; // The agentic tool being used
}

interface AgentMemory {
  id: string;
  type: 'context' | 'decision' | 'learning' | 'skill';
  content: string;
  timestamp: Date;
}

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface ShadowAgentPanelProps {
  onExecuteTask: (task: string) => Promise<{
    plan: string[];
    results: string[];
    summary: string;
  }>;
  isExecuting: boolean;
}

// Clawdbot-inspired agent capabilities
const AGENT_SKILLS: AgentSkill[] = [
  { id: 'reasoning', name: 'Reasoning', description: 'Complex problem decomposition using LLM', icon: <Brain className="h-4 w-4" />, enabled: true },
  { id: 'planning', name: 'Planning', description: 'Multi-step task orchestration', icon: <Target className="h-4 w-4" />, enabled: true },
  { id: 'research', name: 'Web Research', description: 'Search & synthesize information', icon: <Globe className="h-4 w-4" />, enabled: true },
  { id: 'code', name: 'Code Generation', description: 'Write & analyze code', icon: <Code className="h-4 w-4" />, enabled: true },
  { id: 'memory', name: 'Deep Memory', description: 'Supabase-backed persistent context', icon: <Database className="h-4 w-4" />, enabled: true },
  { id: 'browse', name: 'Browser Control', description: 'Autonomous web browsing', icon: <MousePointer className="h-4 w-4" />, enabled: true },
  { id: 'automate', name: 'Task Automation', description: 'Script execution & scheduling', icon: <Workflow className="h-4 w-4" />, enabled: true },
  { id: 'observe', name: 'Observation', description: 'Monitor & react to changes', icon: <Eye className="h-4 w-4" />, enabled: true },
];

const EXAMPLE_TASKS = [
  "Research top 5 AI startups in healthcare and create a competitive analysis",
  "Analyze this codebase for security vulnerabilities and suggest fixes",
  "Build a marketing strategy for launching a SaaS product",
  "Create a comprehensive business plan with financial projections",
  "Monitor competitor pricing pages and alert me to changes",
  "Scrape job postings matching my skills and create a summary report",
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
  const [showHistory, setShowHistory] = useState(false);
  const [humanInLoop, setHumanInLoop] = useState(true); // Safety: require approval for high-risk tasks
  const [skills, setSkills] = useState<AgentSkill[]>(AGENT_SKILLS);

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

  // Determine risk level for human-in-the-loop
  const assessRiskLevel = (task: string): 'low' | 'medium' | 'high' => {
    const lower = task.toLowerCase();
    const highRiskKeywords = ['delete', 'remove', 'drop', 'destroy', 'payment', 'transaction', 'send email', 'post to'];
    const mediumRiskKeywords = ['update', 'modify', 'change', 'edit', 'create', 'write'];
    
    if (highRiskKeywords.some(k => lower.includes(k))) return 'high';
    if (mediumRiskKeywords.some(k => lower.includes(k))) return 'medium';
    return 'low';
  };

  // Clawdbot-style task decomposition
  const decomposeTask = useCallback((task: string, type: AgentTask['type']): AgentSubtask[] => {
    // AI-driven decomposition would happen server-side
    // This is a client-side preview of the plan
    const subtasks: AgentSubtask[] = [];
    
    switch (type) {
      case 'research':
        subtasks.push(
          { id: crypto.randomUUID(), description: '🔍 Search web for relevant sources', status: 'pending', tool: 'web_search' },
          { id: crypto.randomUUID(), description: '📖 Extract and analyze content', status: 'pending', tool: 'content_extraction' },
          { id: crypto.randomUUID(), description: '🧠 Synthesize findings with LLM', status: 'pending', tool: 'llm_reasoning' },
          { id: crypto.randomUUID(), description: '📊 Generate structured report', status: 'pending', tool: 'report_generation' }
        );
        break;
      case 'code':
        subtasks.push(
          { id: crypto.randomUUID(), description: '📋 Analyze requirements', status: 'pending', tool: 'llm_reasoning' },
          { id: crypto.randomUUID(), description: '🔧 Generate code solution', status: 'pending', tool: 'code_generation' },
          { id: crypto.randomUUID(), description: '✅ Validate & test code', status: 'pending', tool: 'code_execution' },
          { id: crypto.randomUUID(), description: '📝 Document solution', status: 'pending', tool: 'documentation' }
        );
        break;
      case 'browse':
        subtasks.push(
          { id: crypto.randomUUID(), description: '🌐 Navigate to target page', status: 'pending', tool: 'browser_navigate' },
          { id: crypto.randomUUID(), description: '👁️ Observe page content', status: 'pending', tool: 'browser_observe' },
          { id: crypto.randomUUID(), description: '🖱️ Interact with elements', status: 'pending', tool: 'browser_interact' },
          { id: crypto.randomUUID(), description: '📥 Extract data', status: 'pending', tool: 'data_extraction' }
        );
        break;
      case 'automate':
        subtasks.push(
          { id: crypto.randomUUID(), description: '📋 Define automation workflow', status: 'pending', tool: 'workflow_design' },
          { id: crypto.randomUUID(), description: '⚙️ Configure triggers', status: 'pending', tool: 'trigger_setup' },
          { id: crypto.randomUUID(), description: '🔄 Execute automation', status: 'pending', tool: 'script_execution' },
          { id: crypto.randomUUID(), description: '📊 Monitor & report', status: 'pending', tool: 'monitoring' }
        );
        break;
      default:
        subtasks.push(
          { id: crypto.randomUUID(), description: '🧠 Analyze task requirements', status: 'pending', tool: 'llm_reasoning' },
          { id: crypto.randomUUID(), description: '📋 Create execution plan', status: 'pending', tool: 'planning' },
          { id: crypto.randomUUID(), description: '⚡ Execute steps', status: 'pending', tool: 'execution' },
          { id: crypto.randomUUID(), description: '✅ Verify results', status: 'pending', tool: 'verification' }
        );
    }
    
    return subtasks;
  }, []);

  const executeTask = async () => {
    if (!taskInput.trim()) {
      toast.error('Please enter a task for the agent');
      return;
    }

    const taskType = detectTaskType(taskInput);
    const riskLevel = assessRiskLevel(taskInput);
    const subtasks = decomposeTask(taskInput, taskType);

    const newTask: AgentTask = {
      id: crypto.randomUUID(),
      type: taskType,
      description: taskInput,
      status: humanInLoop && riskLevel !== 'low' ? 'awaiting_approval' : 'planning',
      startedAt: new Date(),
      subtasks,
      requiresApproval: humanInLoop && riskLevel !== 'low',
      riskLevel
    };

    setCurrentTask(newTask);
    setTaskInput('');

    // Add to memory (Supabase-backed)
    const memoryEntry: AgentMemory = {
      id: crypto.randomUUID(),
      type: 'decision',
      content: `🤖 Agent received task: ${taskInput} [Risk: ${riskLevel}]`,
      timestamp: new Date()
    };
    setAgentMemory(prev => [memoryEntry, ...prev].slice(0, 50));

    // If requires approval, wait for user
    if (newTask.requiresApproval) {
      toast.info('This task requires your approval before execution', {
        description: `Risk level: ${riskLevel.toUpperCase()}`
      });
      return;
    }

    // Execute immediately if low risk or human-in-loop disabled
    await runTask(newTask);
  };

  const approveTask = async () => {
    if (!currentTask || currentTask.status !== 'awaiting_approval') return;
    
    const approvedTask = { ...currentTask, status: 'planning' as const };
    setCurrentTask(approvedTask);
    
    toast.success('Task approved! Agent is now executing...');
    await runTask(approvedTask);
  };

  const runTask = async (task: AgentTask) => {
    // Update to running status
    const runningTask = { ...task, status: 'running' as const };
    setCurrentTask(runningTask);

    try {
      // Execute via the LLM backend
      const result = await onExecuteTask(task.description);
      
      // Update subtasks with results
      const completedSubtasks = task.subtasks?.map((st, i) => ({
        ...st,
        status: 'completed' as const,
        result: result.results[i] || 'Completed'
      })) || [];

      const completedTask: AgentTask = {
        ...task,
        status: 'completed',
        completedAt: new Date(),
        result: result.summary,
        subtasks: completedSubtasks
      };

      setCurrentTask(completedTask);
      setTaskHistory(prev => [completedTask, ...prev].slice(0, 20));

      // Save learning to persistent memory
      const learningEntry: AgentMemory = {
        id: crypto.randomUUID(),
        type: 'learning',
        content: `✅ Completed: ${task.description.slice(0, 50)}... → ${result.summary.slice(0, 80)}...`,
        timestamp: new Date()
      };
      setAgentMemory(prev => [learningEntry, ...prev].slice(0, 50));

      // Save to Supabase for persistent learning
      if (user) {
        await supabase.from('business_memories').insert({
          user_id: user.id,
          title: `Agent Task: ${task.type}`,
          content: result.summary,
          category: 'agent_learning',
          priority: task.riskLevel === 'high' ? 10 : 5
        });
      }

      toast.success('🤖 Agent completed task successfully!');
    } catch (error) {
      const failedTask: AgentTask = {
        ...task,
        status: 'failed',
        completedAt: new Date(),
        result: error instanceof Error ? error.message : 'Task failed'
      };
      setCurrentTask(failedTask);
      setTaskHistory(prev => [failedTask, ...prev].slice(0, 20));
      toast.error('Agent execution failed');
    }
  };

  const detectTaskType = (task: string): AgentTask['type'] => {
    const lower = task.toLowerCase();
    if (lower.includes('research') || lower.includes('find info') || lower.includes('search for')) return 'research';
    if (lower.includes('code') || lower.includes('build') || lower.includes('create app') || lower.includes('program')) return 'code';
    if (lower.includes('analyze') || lower.includes('audit') || lower.includes('review')) return 'analyze';
    if (lower.includes('data') || lower.includes('database') || lower.includes('query')) return 'data';
    if (lower.includes('browse') || lower.includes('scrape') || lower.includes('navigate') || lower.includes('website')) return 'browse';
    if (lower.includes('automate') || lower.includes('schedule') || lower.includes('monitor') || lower.includes('cron')) return 'automate';
    return 'execute';
  };

  const getTaskIcon = (type: AgentTask['type']) => {
    switch (type) {
      case 'research': return <Globe className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'analyze': return <FileSearch className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'browse': return <MousePointer className="h-4 w-4" />;
      case 'automate': return <Workflow className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'planning': return 'text-blue-500';
      case 'running': return 'text-primary animate-pulse';
      case 'awaiting_approval': return 'text-amber-500';
      case 'completed': return 'text-success';
      case 'failed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadge = (risk?: 'low' | 'medium' | 'high') => {
    if (!risk) return null;
    const colors = {
      low: 'bg-green-500/20 text-green-500',
      medium: 'bg-amber-500/20 text-amber-500',
      high: 'bg-red-500/20 text-red-500'
    };
    return <Badge variant="outline" className={`text-[10px] ${colors[risk]}`}>{risk} risk</Badge>;
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
            <p className="text-xs text-muted-foreground">Clawdbot-Powered Agentic AI</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20">
          <Crown className="h-3 w-3 text-amber-500" />
          ELITE
        </Badge>
      </div>

      {/* Human-in-the-Loop Toggle */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Human-in-the-Loop</p>
                <p className="text-xs text-muted-foreground">Require approval for risky actions</p>
              </div>
            </div>
            <Switch 
              checked={humanInLoop} 
              onCheckedChange={setHumanInLoop}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent Skills */}
      <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Agent Skills (Clawdbot Architecture)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {skills.map((skill) => (
              <div 
                key={skill.id} 
                className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
                  skill.enabled ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 opacity-50'
                }`}
                title={skill.description}
              >
                <div className={skill.enabled ? 'text-primary' : 'text-muted-foreground'}>{skill.icon}</div>
                <span className="text-[10px] font-medium mt-1">{skill.name}</span>
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
          currentTask.status === 'running' || currentTask.status === 'planning' ? 'border-primary/50 shadow-glow' :
          currentTask.status === 'awaiting_approval' ? 'border-amber-500/50' :
          currentTask.status === 'completed' ? 'border-success/50' :
          currentTask.status === 'failed' ? 'border-destructive/50' : 'border-border'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTaskIcon(currentTask.type)}
                <CardTitle className="text-sm">Current Task</CardTitle>
                {getRiskBadge(currentTask.riskLevel)}
              </div>
              <Badge 
                variant={currentTask.status === 'completed' ? 'default' : 'secondary'}
                className={getStatusColor(currentTask.status)}
              >
                {(currentTask.status === 'running' || currentTask.status === 'planning') && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {currentTask.status === 'awaiting_approval' && <Shield className="h-3 w-3 mr-1" />}
                {currentTask.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {currentTask.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                {currentTask.status.replace('_', ' ').charAt(0).toUpperCase() + currentTask.status.slice(1).replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{currentTask.description}</p>
            
            {/* Approval Required */}
            {currentTask.status === 'awaiting_approval' && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <Shield className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <strong>Human approval required.</strong> This task involves {currentTask.riskLevel}-risk actions.
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={approveTask} className="bg-amber-500 hover:bg-amber-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve & Execute
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentTask(null)}>
                      Cancel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Subtasks Progress */}
            {currentTask.subtasks && currentTask.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Execution Plan</span>
                  <span>{currentTask.subtasks.filter(s => s.status === 'completed').length}/{currentTask.subtasks.length}</span>
                </div>
                <Progress 
                  value={(currentTask.subtasks.filter(s => s.status === 'completed').length / currentTask.subtasks.length) * 100} 
                  className="h-2"
                />
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {currentTask.subtasks.map((subtask) => (
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
                        {subtask.tool && (
                          <Badge variant="outline" className="text-[9px] px-1">{subtask.tool}</Badge>
                        )}
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

      {/* Architecture Info */}
      <Alert className="bg-primary/5 border-primary/20">
        <Bot className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          <strong>ShadowAgent</strong> uses a Clawdbot-inspired hybrid architecture:
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            <li>• <strong>Brain:</strong> Lovable AI Gateway for reasoning</li>
            <li>• <strong>Hands:</strong> Agentic executor for browser/terminal/automation</li>
            <li>• <strong>Memory:</strong> Supabase for persistent context & learning</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ShadowAgentPanel;
