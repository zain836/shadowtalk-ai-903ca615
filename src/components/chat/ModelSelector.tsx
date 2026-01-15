import { Sparkles, Zap, Brain, Atom, Telescope, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type AIModel = 
  | "gemini-flash" 
  | "gemini-pro" 
  | "gpt-5" 
  | "gpt-5-mini"
  | "gpt-5.2"
  | "reasoning";

interface ModelSelectorProps {
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

const models = [
  {
    value: "gemini-flash" as const,
    label: "Gemini 3 Flash",
    description: "Fast & efficient for most tasks",
    icon: <Zap className="h-4 w-4" />,
    color: "text-amber-500",
    badge: null,
  },
  {
    value: "gemini-pro" as const,
    label: "Gemini 2.5 Pro",
    description: "Best for complex reasoning",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-500",
    badge: null,
  },
  {
    value: "gpt-5" as const,
    label: "GPT-5",
    description: "OpenAI's powerful all-rounder",
    icon: <Brain className="h-4 w-4" />,
    color: "text-green-500",
    badge: null,
  },
  {
    value: "gpt-5-mini" as const,
    label: "GPT-5 Mini",
    description: "Fast OpenAI responses",
    icon: <Cpu className="h-4 w-4" />,
    color: "text-emerald-500",
    badge: null,
  },
  {
    value: "gpt-5.2" as const,
    label: "GPT-5.2",
    description: "Latest with enhanced reasoning",
    icon: <Atom className="h-4 w-4" />,
    color: "text-purple-500",
    badge: "NEW",
  },
  {
    value: "reasoning" as const,
    label: "Deep Thinking",
    description: "Extended reasoning with chain-of-thought",
    icon: <Telescope className="h-4 w-4" />,
    color: "text-violet-500",
    badge: "PRO",
  },
];

export const getModelId = (model: AIModel): string => {
  const modelMap: Record<AIModel, string> = {
    "gemini-flash": "google/gemini-3-flash-preview",
    "gemini-pro": "google/gemini-2.5-pro",
    "gpt-5": "openai/gpt-5",
    "gpt-5-mini": "openai/gpt-5-mini",
    "gpt-5.2": "openai/gpt-5.2",
    "reasoning": "openai/gpt-5.2", // Uses reasoning prompts
  };
  return modelMap[model];
};

export const ModelSelector = ({ model, onModelChange, disabled }: ModelSelectorProps) => {
  const currentModel = models.find(m => m.value === model) || models[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-8 px-2 text-xs"
          disabled={disabled}
        >
          <span className={currentModel.color}>{currentModel.icon}</span>
          <span className="hidden sm:inline">{currentModel.label}</span>
          {currentModel.badge && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">{currentModel.badge}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          Select Model
        </div>
        <DropdownMenuSeparator />
        {models.map((m) => (
          <DropdownMenuItem
            key={m.value}
            onClick={() => onModelChange(m.value)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer ${
              model === m.value ? "bg-primary/10" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={m.color}>{m.icon}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{m.label}</span>
                  {m.badge && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{m.badge}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
              </div>
            </div>
            {model === m.value && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
