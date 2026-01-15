import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  X,
  Loader2,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface Script {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: unknown;
  script_code: string;
  is_active: boolean;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

interface ScriptExecution {
  id: string;
  script_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  output: unknown;
  error: string | null;
}

interface ScriptAutomationProps {
  onClose: () => void;
  onRunScript: (prompt: string) => void;
}

export const ScriptAutomation: React.FC<ScriptAutomationProps> = ({
  onClose,
  onRunScript,
}) => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<ScriptExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    script_code: '',
    trigger_type: 'manual',
    trigger_config: {} as Record<string, unknown>
  });

  // Fetch scripts from database
  useEffect(() => {
    if (!user) return;
    
    const fetchScripts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('automation_scripts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setScripts(data || []);
      } catch (error) {
        console.error('Error fetching scripts:', error);
        toast.error('Failed to load scripts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScripts();
  }, [user]);

  // Fetch executions for a script
  const fetchExecutions = async (scriptId: string) => {
    try {
      const { data, error } = await supabase
        .from('script_executions')
        .select('*')
        .eq('script_id', scriptId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const handleCreateScript = async () => {
    if (!user) {
      toast.error('Please sign in to create scripts');
      return;
    }

    if (!newScript.name || !newScript.script_code) {
      toast.error('Please fill in the required fields');
      return;
    }

    setIsSaving(true);
    try {
      const insertData: {
        user_id: string;
        name: string;
        description: string | null;
        script_code: string;
        trigger_type: string;
        trigger_config: Record<string, string | number | boolean> | null;
        is_active: boolean;
        run_count: number;
      } = {
        user_id: user.id,
        name: newScript.name,
        description: newScript.description || null,
        script_code: newScript.script_code,
        trigger_type: newScript.trigger_type,
        trigger_config: null,
        is_active: true,
        run_count: 0
      };

      const { data, error } = await supabase
        .from('automation_scripts')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newScriptData: Script = {
        id: data.id,
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config,
        script_code: data.script_code,
        is_active: data.is_active ?? true,
        last_run_at: data.last_run_at,
        run_count: data.run_count ?? 0,
        created_at: data.created_at ?? new Date().toISOString()
      };

      setScripts(prev => [newScriptData, ...prev]);
      setIsCreating(false);
      setNewScript({ name: '', description: '', script_code: '', trigger_type: 'manual', trigger_config: {} });
      toast.success('Script created successfully');
    } catch (error) {
      console.error('Error creating script:', error);
      toast.error('Failed to create script');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScript = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_scripts')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.map(s =>
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
      toast.success(currentStatus ? 'Script paused' : 'Script activated');
    } catch (error) {
      console.error('Error toggling script:', error);
      toast.error('Failed to update script');
    }
  };

  const deleteScript = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success('Script deleted');
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Failed to delete script');
    }
  };

  const runScript = async (script: Script) => {
    if (!user) return;

    try {
      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from('script_executions')
        .insert({
          script_id: script.id,
          user_id: user.id,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (execError) throw execError;

      // Update script run count and last_run_at
      const { error: updateError } = await supabase
        .from('automation_scripts')
        .update({
          run_count: script.run_count + 1,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', script.id);

      if (updateError) throw updateError;

      // Update local state
      setScripts(prev => prev.map(s =>
        s.id === script.id
          ? { ...s, last_run_at: new Date().toISOString(), run_count: s.run_count + 1 }
          : s
      ));

      // Execute the script (send to AI)
      onRunScript(script.script_code);

      // Update execution status to completed
      await supabase
        .from('script_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: { message: 'Script sent to AI for processing' }
        })
        .eq('id', execution.id);

      toast.success(`Running: ${script.name}`);
      onClose();
    } catch (error) {
      console.error('Error running script:', error);
      toast.error('Failed to run script');
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive
      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
      : <Pause className="h-4 w-4 text-muted-foreground" />;
  };

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'manual': return 'Manual trigger';
      case 'schedule': return 'Scheduled';
      case 'webhook': return 'On webhook';
      case 'event': return 'On event';
      default: return triggerType;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Sign in required</p>
            <p className="text-muted-foreground mb-4">Please sign in to use Script Automation</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  value={newScript.script_code}
                  onChange={(e) => setNewScript(prev => ({ ...prev, script_code: e.target.value }))}
                  rows={3}
                />
                <Select
                  value={newScript.trigger_type}
                  onValueChange={(value) => setNewScript(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Trigger</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                    <SelectItem value="webhook">On Webhook</SelectItem>
                    <SelectItem value="event">On Event</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleCreateScript} className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No scripts yet</p>
                <p className="text-sm">Create your first automation script above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scripts.map(script => (
                  <Card key={script.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(script.is_active)}
                            <h4 className="font-medium truncate">{script.name}</h4>
                          </div>
                          {script.description && (
                            <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {getTriggerLabel(script.trigger_type)}
                            </Badge>
                            <Badge variant="outline">
                              <Zap className="h-3 w-3 mr-1" />
                              {script.run_count} runs
                            </Badge>
                            {script.last_run_at && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Last: {formatDate(script.last_run_at)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runScript(script)}
                            className="h-8"
                            title="Run script"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (showHistory === script.id) {
                                setShowHistory(null);
                              } else {
                                setShowHistory(script.id);
                                fetchExecutions(script.id);
                              }
                            }}
                            className="h-8"
                            title="View history"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleScript(script.id, script.is_active)}
                            className="h-8"
                            title={script.is_active ? 'Pause' : 'Activate'}
                          >
                            {script.is_active ? (
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
                            title="Delete script"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Execution History */}
                      {showHistory === script.id && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium mb-2">Recent Executions</p>
                          {executions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No executions yet</p>
                          ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {executions.map(exec => (
                                <div key={exec.id} className="flex items-center justify-between text-xs bg-background/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    {exec.status === 'completed' ? (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    ) : exec.status === 'failed' ? (
                                      <AlertCircle className="h-3 w-3 text-destructive" />
                                    ) : (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    <span className="capitalize">{exec.status}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {formatDate(exec.started_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
