import React, { useState } from 'react';
import { Bot, Play, Clock, Search, Calendar, Database, CheckCircle, Loader2, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
  inputPlaceholder: string;
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'research',
    name: 'Deep Research',
    description: 'Multi-step research with summarization and insights',
    icon: <Search className="h-5 w-5" />,
    steps: ['Analyze query', 'Search knowledge base', 'Synthesize findings', 'Generate report'],
    inputPlaceholder: 'What topic would you like to research?'
  },
  {
    id: 'schedule',
    name: 'Smart Scheduling',
    description: 'Analyze tasks and create optimized schedules',
    icon: <Calendar className="h-5 w-5" />,
    steps: ['Parse tasks', 'Estimate durations', 'Find optimal slots', 'Create schedule'],
    inputPlaceholder: 'List your tasks (comma-separated)'
  },
  {
    id: 'data-process',
    name: 'Data Processing',
    description: 'Extract, transform, and analyze data',
    icon: <Database className="h-5 w-5" />,
    steps: ['Parse input data', 'Clean & validate', 'Transform format', 'Generate insights'],
    inputPlaceholder: 'Paste your data or describe what you need'
  },
];

interface AIAgentWorkflowsProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: string) => void;
}

export const AIAgentWorkflows: React.FC<AIAgentWorkflowsProps> = ({ isOpen, onClose, onResult }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runWorkflow = async () => {
    if (!selectedWorkflow || !input.trim()) {
      toast({ title: 'Input required', description: 'Please provide input for the workflow', variant: 'destructive' });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    
    const workflowSteps: WorkflowStep[] = selectedWorkflow.steps.map((name, i) => ({
      id: `step-${i}`,
      name,
      status: 'pending'
    }));
    setSteps(workflowSteps);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (let i = 0; i < workflowSteps.length; i++) {
        setSteps(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'running' } : s
        ));
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            agentWorkflow: {
              workflowId: selectedWorkflow.id,
              stepIndex: i,
              stepName: workflowSteps[i].name,
              input: input,
              previousResults: workflowSteps.slice(0, i).map(s => s.result).filter(Boolean)
            }
          }),
        });

        if (!response.ok) throw new Error(`Step failed: ${workflowSteps[i].name}`);
        
        const result = await response.json();
        
        setSteps(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'completed', result: result.stepResult } : s
        ));
        
        setProgress(((i + 1) / workflowSteps.length) * 100);
        
        // Small delay between steps for UX
        if (i < workflowSteps.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // Generate final result
      const finalResult = steps.map(s => s.result).filter(Boolean).join('\n\n');
      onResult(`## ${selectedWorkflow.name} Results\n\n${finalResult || 'Workflow completed successfully.'}`);
      
      toast({ title: 'Workflow completed', description: `${selectedWorkflow.name} finished successfully` });
      
    } catch (error) {
      console.error('Workflow error:', error);
      setSteps(prev => prev.map(s => 
        s.status === 'running' ? { ...s, status: 'error' } : s
      ));
      toast({ title: 'Workflow failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  };

  const resetWorkflow = () => {
    setSelectedWorkflow(null);
    setInput('');
    setSteps([]);
    setProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Agent Workflows
            {selectedWorkflow && (
              <Button variant="ghost" size="sm" onClick={resetWorkflow} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!selectedWorkflow ? (
            <div className="grid gap-3 p-2">
              <p className="text-sm text-muted-foreground mb-2">
                Select a workflow to automate complex multi-step tasks
              </p>
              {WORKFLOWS.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {workflow.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {workflow.steps.map((step, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {step}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 p-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {selectedWorkflow.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedWorkflow.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Input</label>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedWorkflow.inputPlaceholder}
                  disabled={isRunning}
                />
              </div>

              {steps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  <div className="space-y-2 mt-4">
                    {steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        {step.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                        {step.status === 'running' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {step.status === 'error' && <X className="h-4 w-4 text-destructive" />}
                        <span className={`text-sm flex-1 ${step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.name}
                        </span>
                        <Badge variant={step.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {step.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={runWorkflow} 
                disabled={isRunning || !input.trim()} 
                className="w-full gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Workflow...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Workflow
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
