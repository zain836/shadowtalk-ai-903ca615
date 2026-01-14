import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Script {
  id: string;
  name: string;
  description: string;
  schedule: string;
  prompt: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  runsToday: number;
}

interface ScriptAutomationProps {
  onClose: () => void;
  onRunScript: (prompt: string) => void;
}

export const ScriptAutomation: React.FC<ScriptAutomationProps> = ({
  onClose,
  onRunScript,
}) => {
  const [scripts, setScripts] = useState<Script[]>([
    {
      id: '1',
      name: 'Daily Summary',
      description: 'Generate a daily summary of my tasks and priorities',
      schedule: 'Every day at 9:00 AM',
      prompt: 'Summarize my pending tasks and prioritize them for today based on urgency and importance.',
      status: 'active',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      runsToday: 1,
    },
    {
      id: '2',
      name: 'Code Review',
      description: 'Auto-review code commits for best practices',
      schedule: 'On new commits',
      prompt: 'Review the following code for security issues, performance problems, and best practices.',
      status: 'paused',
      runsToday: 0,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newScript, setNewScript] = useState({ name: '', description: '', prompt: '', schedule: 'manual' });

  const handleCreateScript = () => {
    if (!newScript.name || !newScript.prompt) {
      toast.error('Please fill in the required fields');
      return;
    }

    const script: Script = {
      id: crypto.randomUUID(),
      name: newScript.name,
      description: newScript.description,
      prompt: newScript.prompt,
      schedule: newScript.schedule === 'manual' ? 'Manual trigger' : newScript.schedule,
      status: 'active',
      runsToday: 0,
    };

    setScripts(prev => [script, ...prev]);
    setIsCreating(false);
    setNewScript({ name: '', description: '', prompt: '', schedule: 'manual' });
    toast.success('Script created successfully');
  };

  const toggleScript = (id: string) => {
    setScripts(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
    ));
  };

  const deleteScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    toast.success('Script deleted');
  };

  const runScript = (script: Script) => {
    onRunScript(script.prompt);
    setScripts(prev => prev.map(s =>
      s.id === script.id ? { ...s, lastRun: new Date().toISOString(), runsToday: s.runsToday + 1 } : s
    ));
    toast.success(`Running: ${script.name}`);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'paused': return <Pause className="h-4 w-4 text-muted-foreground" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Script Automation Engine</CardTitle>
              <p className="text-sm text-muted-foreground">Automate repetitive AI tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pro Feature</Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Create New Script */}
          {isCreating ? (
            <Card className="mb-4 border-primary/50">
              <CardContent className="pt-4 space-y-3">
                <Input
                  placeholder="Script name *"
                  value={newScript.name}
                  onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newScript.description}
                  onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                />
                <Textarea
                  placeholder="AI prompt to execute *"
                  value={newScript.prompt}
                  onChange={(e) => setNewScript(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateScript} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Script
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsCreating(true)} className="w-full mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create New Script
            </Button>
          )}

          {/* Scripts List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {scripts.map(script => (
                <Card key={script.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(script.status)}
                          <h4 className="font-medium truncate">{script.name}</h4>
                        </div>
                        {script.description && (
                          <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {script.schedule}
                          </Badge>
                          <Badge variant="outline">
                            <Zap className="h-3 w-3 mr-1" />
                            {script.runsToday} runs today
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runScript(script)}
                          className="h-8"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScript(script.id)}
                          className="h-8"
                        >
                          {script.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScript(script.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
