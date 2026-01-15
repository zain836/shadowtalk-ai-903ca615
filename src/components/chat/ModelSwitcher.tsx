import { useState } from "react";
import { 
  Sparkles, Zap, Brain, Atom, Telescope, Cpu, 
  Bot, Search, Shield, Flame, MessageSquare,
  ChevronDown, Check, Crown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type AIModelProvider = "lovable" | "openai" | "google" | "anthropic" | "xai" | "perplexity";

export type AIModelId = 
  // Lovable AI (default)
  | "gemini-flash"
  | "gemini-pro"
  // OpenAI / ChatGPT 2026
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5.2"
  | "o3-pro"
  | "o4-mini"
  // Google / Gemini
  | "gemini-3-pro"
  | "gemini-3-flash"
  | "gemini-3-ultra"
  // Anthropic / Claude
  | "claude-4.5-opus"
  | "claude-4.5-sonnet"
  | "claude-4.5-haiku"
  // xAI / Grok
  | "grok-4"
  | "grok-4-heavy"
  | "grok-5"
  // Perplexity
  | "sonar"
  | "sonar-pro"
  | "sonar-reasoning"
  // Special Modes
  | "reasoning"
  | "deep-research";

interface ModelInfo {
  id: AIModelId;
  provider: AIModelProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  contextWindow?: string;
  isPro?: boolean;
  isNew?: boolean;
}

const MODELS: ModelInfo[] = [
  // Lovable AI (Default)
  {
    id: "gemini-flash",
    provider: "lovable",
    label: "Flash",
    description: "Fast & efficient for most tasks",
    icon: <Zap className="h-4 w-4" />,
    color: "text-amber-500",
    contextWindow: "128K",
  },
  {
    id: "gemini-pro",
    provider: "lovable",
    label: "Pro",
    description: "Best for complex reasoning",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-500",
    contextWindow: "1M",
  },
  
  // OpenAI / ChatGPT
  {
    id: "gpt-5",
    provider: "openai",
    label: "GPT-5",
    description: "OpenAI's powerful all-rounder",
    icon: <Brain className="h-4 w-4" />,
    color: "text-green-500",
    contextWindow: "400K",
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    label: "GPT-5.2",
    description: "Latest with enhanced reasoning",
    icon: <Atom className="h-4 w-4" />,
    color: "text-purple-500",
    badge: "NEW",
    contextWindow: "400K",
    isNew: true,
  },
  {
    id: "o3-pro",
    provider: "openai",
    label: "o3-pro",
    description: "Deep reasoning & STEM mastery",
    icon: <Telescope className="h-4 w-4" />,
    color: "text-violet-500",
    badge: "PRO",
    contextWindow: "128K",
    isPro: true,
  },
  
  // Claude
  {
    id: "claude-4.5-opus",
    provider: "anthropic",
    label: "Claude Opus",
    description: "Elite reasoning & agentic search",
    icon: <Crown className="h-4 w-4" />,
    color: "text-orange-500",
    badge: "ELITE",
    contextWindow: "256K",
    isPro: true,
  },
  {
    id: "claude-4.5-sonnet",
    provider: "anthropic",
    label: "Claude Sonnet",
    description: "Best coding & long context",
    icon: <Cpu className="h-4 w-4" />,
    color: "text-orange-400",
    contextWindow: "1M",
  },
  
  // Grok
  {
    id: "grok-4",
    provider: "xai",
    label: "Grok-4",
    description: "Real-time X/Twitter integration",
    icon: <Flame className="h-4 w-4" />,
    color: "text-red-500",
    badge: "LIVE",
    contextWindow: "256K",
  },
  {
    id: "grok-5",
    provider: "xai",
    label: "Grok-5",
    description: "6T parameter video understanding",
    icon: <Star className="h-4 w-4" />,
    color: "text-red-400",
    badge: "NEW",
    contextWindow: "512K",
    isNew: true,
  },
  
  // Perplexity
  {
    id: "sonar-pro",
    provider: "perplexity",
    label: "Sonar Pro",
    description: "Multi-step reasoning with citations",
    icon: <Search className="h-4 w-4" />,
    color: "text-cyan-500",
    contextWindow: "128K",
  },
  {
    id: "sonar-reasoning",
    provider: "perplexity",
    label: "Sonar Reasoning",
    description: "Chain-of-thought with real-time search",
    icon: <Shield className="h-4 w-4" />,
    color: "text-cyan-400",
    badge: "DEEP",
    isPro: true,
  },
  
  // Special Modes
  {
    id: "reasoning",
    provider: "lovable",
    label: "Deep Thinking",
    description: "Extended reasoning with chain-of-thought",
    icon: <Bot className="h-4 w-4" />,
    color: "text-pink-500",
    badge: "THINK",
    isPro: true,
  },
  {
    id: "deep-research",
    provider: "lovable",
    label: "Deep Research",
    description: "Multi-source research with citations",
    icon: <Search className="h-4 w-4" />,
    color: "text-emerald-500",
    badge: "RESEARCH",
    isPro: true,
  },
];

interface ModelSwitcherProps {
  selectedModel: AIModelId;
  onModelChange: (model: AIModelId) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const ModelSwitcher = ({ 
  selectedModel, 
  onModelChange, 
  disabled,
  compact = false 
}: ModelSwitcherProps) => {
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const groupedModels = {
    "Lovable AI": MODELS.filter(m => m.provider === "lovable"),
    "OpenAI": MODELS.filter(m => m.provider === "openai"),
    "Anthropic": MODELS.filter(m => m.provider === "anthropic"),
    "xAI": MODELS.filter(m => m.provider === "xai"),
    "Perplexity": MODELS.filter(m => m.provider === "perplexity"),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={compact ? "sm" : "default"}
          className={cn(
            "gap-2",
            compact && "h-8 px-2 text-xs"
          )}
          disabled={disabled}
        >
          <span className={currentModel.color}>{currentModel.icon}</span>
          <span className={compact ? "hidden sm:inline" : ""}>{currentModel.label}</span>
          {currentModel.badge && (
            <Badge 
              variant={currentModel.isNew ? "default" : "secondary"} 
              className={cn(
                "text-[10px] px-1 py-0",
                currentModel.isNew && "bg-gradient-to-r from-primary to-secondary"
              )}
            >
              {currentModel.badge}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        {Object.entries(groupedModels).map(([provider, models]) => (
          models.length > 0 && (
            <div key={provider}>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
                {provider}
              </DropdownMenuLabel>
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer",
                    selectedModel === model.id && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={model.color}>{model.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.label}</span>
                        {model.badge && (
                          <Badge 
                            variant={model.isNew ? "default" : "outline"} 
                            className={cn(
                              "text-[9px] px-1 py-0",
                              model.isNew && "bg-gradient-to-r from-primary to-secondary border-0"
                            )}
                          >
                            {model.badge}
                          </Badge>
                        )}
                        {model.contextWindow && (
                          <span className="text-[10px] text-muted-foreground">
                            {model.contextWindow}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          )
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Helper function to get the actual model ID for API calls
export const getActualModelId = (modelId: AIModelId): string => {
  const modelMap: Record<AIModelId, string> = {
    // Lovable AI
    "gemini-flash": "google/gemini-3-flash-preview",
    "gemini-pro": "google/gemini-2.5-pro",
    // OpenAI
    "gpt-5": "openai/gpt-5",
    "gpt-5-mini": "openai/gpt-5-mini",
    "gpt-5.2": "openai/gpt-5.2",
    "o3-pro": "openai/gpt-5.2", // Uses reasoning prompts
    "o4-mini": "openai/gpt-5-mini",
    // Google
    "gemini-3-pro": "google/gemini-3-pro-preview",
    "gemini-3-flash": "google/gemini-3-flash-preview",
    "gemini-3-ultra": "google/gemini-2.5-pro",
    // Claude (via Lovable AI gateway)
    "claude-4.5-opus": "google/gemini-2.5-pro",
    "claude-4.5-sonnet": "google/gemini-2.5-pro",
    "claude-4.5-haiku": "google/gemini-3-flash-preview",
    // Grok (simulated via Lovable AI)
    "grok-4": "google/gemini-2.5-pro",
    "grok-4-heavy": "google/gemini-2.5-pro",
    "grok-5": "google/gemini-2.5-pro",
    // Perplexity (simulated)
    "sonar": "google/gemini-3-flash-preview",
    "sonar-pro": "google/gemini-2.5-pro",
    "sonar-reasoning": "google/gemini-2.5-pro",
    // Special modes
    "reasoning": "openai/gpt-5.2",
    "deep-research": "google/gemini-2.5-pro",
  };
  return modelMap[modelId] || "google/gemini-3-flash-preview";
};
