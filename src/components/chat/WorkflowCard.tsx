import { useState } from "react";
import { Check, ChevronDown, ChevronUp, ExternalLink, FileText, MapPin, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  substeps?: string[];
  links?: { label: string; url: string }[];
  estimatedTime?: string;
  tips?: string[];
}

export interface Workflow {
  id: string;
  title: string;
  category: "legal" | "financial" | "government" | "healthcare" | "business" | "education";
  description: string;
  steps: WorkflowStep[];
  deadline?: string;
  eligibility?: string[];
  documents?: string[];
}

interface WorkflowCardProps {
  workflow: Workflow;
  onStepComplete: (workflowId: string, stepId: string) => void;
  onDismiss: () => void;
}

const categoryColors: Record<string, string> = {
  legal: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  financial: "bg-green-500/10 text-green-500 border-green-500/30",
  government: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  healthcare: "bg-red-500/10 text-red-500 border-red-500/30",
  business: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  education: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
};

const categoryIcons: Record<string, React.ReactNode> = {
  legal: <FileText className="h-3 w-3" />,
  financial: <FileText className="h-3 w-3" />,
  government: <MapPin className="h-3 w-3" />,
  healthcare: <AlertCircle className="h-3 w-3" />,
  business: <FileText className="h-3 w-3" />,
  education: <FileText className="h-3 w-3" />,
};

export const WorkflowCard = ({ workflow, onStepComplete, onDismiss }: WorkflowCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set([workflow.steps[0]?.id]));

  const completedSteps = workflow.steps.filter(s => s.completed).length;
  const progress = (completedSteps / workflow.steps.length) * 100;

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${categoryColors[workflow.category]} text-xs px-1.5 py-0`}>
                {categoryIcons[workflow.category]}
                <span className="ml-1 capitalize">{workflow.category}</span>
              </Badge>
              {workflow.deadline && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {workflow.deadline}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">{workflow.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 px-2 text-xs">
            Dismiss
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps}/{workflow.steps.length} steps</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Eligibility & Documents */}
        {(workflow.eligibility || workflow.documents) && (
          <div className="mb-3 p-2 rounded-md bg-muted/50 text-xs space-y-1">
            {workflow.eligibility && workflow.eligibility.length > 0 && (
              <div>
                <span className="font-medium">Eligibility: </span>
                <span className="text-muted-foreground">{workflow.eligibility.join(", ")}</span>
              </div>
            )}
            {workflow.documents && workflow.documents.length > 0 && (
              <div>
                <span className="font-medium">Documents needed: </span>
                <span className="text-muted-foreground">{workflow.documents.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2">
          {workflow.steps.map((step, index) => (
            <Collapsible
              key={step.id}
              open={expandedSteps.has(step.id)}
              onOpenChange={() => toggleStep(step.id)}
            >
              <div className={`rounded-md border ${step.completed ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-background'}`}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStepComplete(workflow.id, step.id);
                      }}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        step.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-muted-foreground/50 hover:border-primary'
                      }`}
                    >
                      {step.completed && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {index + 1}. {step.title}
                      </p>
                    </div>
                    {step.estimatedTime && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        ~{step.estimatedTime}
                      </span>
                    )}
                    {expandedSteps.has(step.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-2 pb-2 pt-0 pl-9 space-y-2">
                    <p className="text-xs text-muted-foreground">{step.description}</p>

                    {step.substeps && step.substeps.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {step.substeps.map((sub, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-muted-foreground">•</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {step.tips && step.tips.length > 0 && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Tips:</p>
                        <ul className="text-xs space-y-0.5">
                          {step.tips.map((tip, i) => (
                            <li key={i} className="text-amber-700 dark:text-amber-300">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.links && step.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {step.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {link.label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
