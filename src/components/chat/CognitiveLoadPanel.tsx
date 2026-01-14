import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Shield, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import EmailCalendarIntegration from './EmailCalendarIntegration';

interface Task {
  id: string;
  title: string;
  source: string;
  cls: number; // Cognitive Load Score 1-10
  summary?: string;
  actionRequired?: string;
  deadline?: string;
  status: 'pending' | 'processing' | 'done';
}

interface CognitiveLoadPanelProps {
  onAnalyzeTask: (task: string) => Promise<{
    cls: number;
    summary: string;
    actionRequired: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  isAnalyzing: boolean;
}

const CognitiveLoadPanel: React.FC<CognitiveLoadPanelProps> = ({ 
  onAnalyzeTask,
  isAnalyzing 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [deepWorkMode, setDeepWorkMode] = useState(false);
  const [clsThreshold, setClsThreshold] = useState(8);

  const getCLSColor = (cls: number) => {
    if (cls <= 3) return 'text-success';
    if (cls <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getCLSBadgeVariant = (cls: number) => {
    if (cls <= 3) return 'secondary';
    if (cls <= 6) return 'default';
    return 'destructive';
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    const taskId = crypto.randomUUID();
    const newTaskObj: Task = {
      id: taskId,
      title: newTask,
      source: 'Manual Entry',
      cls: 0,
      status: 'processing',
    };

    setTasks(prev => [...prev, newTaskObj]);
    setNewTask('');

    try {
      const analysis = await onAnalyzeTask(newTask);
      
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? {
              ...t,
              cls: analysis.cls,
              summary: analysis.summary,
              actionRequired: analysis.actionRequired,
              status: 'pending' as const,
            }
          : t
      ));
    } catch (error) {
      toast.error('Failed to analyze task');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const markDone = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'done' as const } : t
    ));
  };

  const handleImportTasks = async (source: string, items: string[]) => {
    for (const item of items) {
      const taskId = crypto.randomUUID();
      const newTaskObj: Task = {
        id: taskId,
        title: item,
        source,
        cls: 0,
        status: 'processing',
      };

      setTasks(prev => [...prev, newTaskObj]);

      try {
        const analysis = await onAnalyzeTask(item);
        
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? {
                ...t,
                cls: analysis.cls,
                summary: analysis.summary,
                actionRequired: analysis.actionRequired,
                status: 'pending' as const,
              }
            : t
        ));
      } catch (error) {
        // Keep task but mark as unanalyzed
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, cls: 5, status: 'pending' as const }
            : t
        ));
      }
    }
    toast.success(`Imported ${items.length} tasks from ${source}`);
  };

  const sortedTasks = [...tasks].sort((a, b) => b.cls - a.cls);
  const totalCognitiveLoad = tasks.reduce((sum, t) => sum + (t.status !== 'done' ? t.cls : 0), 0);
  const maxLoad = tasks.length * 10;
  const loadPercentage = maxLoad > 0 ? (totalCognitiveLoad / maxLoad) * 100 : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cognitive Load</p>
                <p className="text-2xl font-bold">{totalCognitiveLoad}</p>
              </div>
              <Brain className={`h-8 w-8 ${loadPercentage > 70 ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <Progress value={loadPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status !== 'done').length}</p>
              </div>
              <Zap className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email/Calendar Integration */}
      <EmailCalendarIntegration onImportTasks={handleImportTasks} />

      {/* Deep Work Shield */}
      <Card className={`transition-all ${deepWorkMode ? 'border-primary shadow-glow' : 'border-border'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${deepWorkMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <CardTitle className="text-base">Deep Work Shield</CardTitle>
            </div>
            <Switch 
              checked={deepWorkMode} 
              onCheckedChange={setDeepWorkMode}
            />
          </div>
        </CardHeader>
        <CardContent>
          {deepWorkMode ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Shield active! Only tasks with CLS ≥ {clsThreshold} will alert you.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Alert threshold:</span>
                <Input 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={clsThreshold}
                  onChange={(e) => setClsThreshold(Number(e.target.value))}
                  className="w-16 h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enable to filter low-priority interruptions during focused work.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Task */}
      <div className="flex gap-2">
        <Input 
          placeholder="Paste email, task, or message to analyze..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          disabled={isAnalyzing}
        />
        <Button onClick={addTask} disabled={isAnalyzing || !newTask.trim()}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Prioritized Tasks (by Cognitive Load)
        </h3>
        
        {sortedTasks.length === 0 ? (
          <Card className="bg-card/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Add tasks or paste content to analyze cognitive load</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map(task => (
              <Card 
                key={task.id} 
                className={`transition-all ${
                  task.status === 'done' ? 'opacity-50' : ''
                } ${
                  deepWorkMode && task.cls < clsThreshold ? 'border-muted' : ''
                }`}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getCLSBadgeVariant(task.cls)}>
                          CLS: {task.cls}
                        </Badge>
                        {task.cls >= 8 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            High Priority
                          </Badge>
                        )}
                        {deepWorkMode && task.cls < clsThreshold && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Shielded
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
                        {task.title.length > 100 ? task.title.slice(0, 100) + '...' : task.title}
                      </p>
                      
                      {task.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing cognitive load...
                        </div>
                      ) : task.summary && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                          <p className="text-muted-foreground">{task.summary}</p>
                          {task.actionRequired && (
                            <p className="text-primary font-medium">
                              ⚡ Action: {task.actionRequired}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {task.status !== 'done' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-success"
                          onClick={() => markDone(task.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitiveLoadPanel;
