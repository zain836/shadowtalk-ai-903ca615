import { Code, Languages, FileText, Bug, Lightbulb, Image, MessageSquare, Pen, Music, Brain, Leaf, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ChatMode = 
  | "general"
  | "code"
  | "translate"
  | "summarize"
  | "debug"
  | "brainstorm"
  | "image"
  | "explain"
  | "creative"
  | "music"
  | "research"
  | "cpf"
  | "ppag"
  | "hsca";

interface ModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const modes: { value: ChatMode; label: string; icon: React.ReactNode; prompt: string; color: string }[] = [
  { 
    value: "general", 
    label: "General Chat", 
    icon: <MessageSquare className="h-4 w-4" />,
    prompt: "",
    color: "text-foreground"
  },
  { 
    value: "code", 
    label: "Write Code", 
    icon: <Code className="h-4 w-4" />,
    prompt: "You are in code writing mode. Write clean, well-commented, production-ready code. Always include explanations and best practices.",
    color: "text-blue-500"
  },
  { 
    value: "translate", 
    label: "Translate", 
    icon: <Languages className="h-4 w-4" />,
    prompt: "You are in translation mode. Translate text accurately while preserving meaning and tone. Auto-detect the source language if not specified.",
    color: "text-cyan-500"
  },
  { 
    value: "summarize", 
    label: "Summarize", 
    icon: <FileText className="h-4 w-4" />,
    prompt: "You are in summarization mode. Provide concise, clear summaries that capture the key points and main ideas.",
    color: "text-green-500"
  },
  { 
    value: "debug", 
    label: "Debug Code", 
    icon: <Bug className="h-4 w-4" />,
    prompt: "You are in debugging mode. Analyze code for bugs, suggest fixes, and explain the issues clearly. Provide corrected code.",
    color: "text-red-500"
  },
  { 
    value: "brainstorm", 
    label: "Brainstorm", 
    icon: <Lightbulb className="h-4 w-4" />,
    prompt: "You are in brainstorming mode. Generate creative ideas, explore possibilities, and think outside the box.",
    color: "text-yellow-500"
  },
  { 
    value: "image", 
    label: "Generate Image", 
    icon: <Image className="h-4 w-4" />,
    prompt: "You are in image description mode. Help users craft detailed image prompts for AI generation.",
    color: "text-purple-500"
  },
  { 
    value: "explain", 
    label: "Explain", 
    icon: <MessageSquare className="h-4 w-4" />,
    prompt: "You are in explanation mode. Explain concepts clearly and simply, using analogies and examples when helpful.",
    color: "text-pink-500"
  },
  { 
    value: "creative", 
    label: "Creative Writing", 
    icon: <Pen className="h-4 w-4" />,
    prompt: "You are in creative writing mode. Write engaging, imaginative content with vivid language and compelling narratives.",
    color: "text-orange-500"
  },
  { 
    value: "music", 
    label: "Recommend Music", 
    icon: <Music className="h-4 w-4" />,
    prompt: "You are in music recommendation mode. Suggest songs, artists, and playlists based on user preferences. Include YouTube or Spotify links when possible.",
    color: "text-rose-500"
  },
  { 
    value: "research", 
    label: "📚 Deep Research", 
    icon: <Search className="h-4 w-4" />,
    prompt: "You are in deep research mode. Conduct comprehensive research using multiple search queries, synthesize information from various sources, and provide in-depth analysis with citations.",
    color: "text-violet-500"
  },
  { 
    value: "cpf", 
    label: "🌊 Cognitive Filter", 
    icon: <Brain className="h-4 w-4" />,
    prompt: "You are in Cognitive Pollution Filter (CPF) mode. Help users manage digital overload by analyzing tasks, prioritizing them by cognitive load, and summarizing complex information into actionable items.",
    color: "text-cyan-400"
  },
  { 
    value: "ppag", 
    label: "🌍 Eco Actions", 
    icon: <Leaf className="h-4 w-4" />,
    prompt: "You are in Planetary Action Guide (PPAG) mode. Provide hyper-personalized, location-specific environmental actions with high impact. Calculate environmental return on investment for each action.",
    color: "text-emerald-500"
  },
  { 
    value: "hsca", 
    label: "🔒 Security Audit", 
    icon: <Shield className="h-4 w-4" />,
    prompt: "You are the Hyper-Security Contextual Auditor (HSCA). Analyze code for security vulnerabilities, trace data flows across stacks, generate proof-of-concept exploits, and provide secure code remediation.",
    color: "text-red-500"
  },
];

export const getModePrompt = (mode: ChatMode): string => {
  return modes.find(m => m.value === mode)?.prompt || "";
};

export const ModeSelector = ({ mode, onModeChange, disabled }: ModeSelectorProps) => {
  const currentMode = modes.find(m => m.value === mode) || modes[0];
  const standardModes = modes.filter(m => !['cpf', 'ppag', 'hsca', 'research'].includes(m.value));
  const specialModes = modes.filter(m => ['research', 'cpf', 'ppag', 'hsca'].includes(m.value));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9 px-3 border-border/50 hover:border-primary/50 transition-colors"
          disabled={disabled}
        >
          <span className={currentMode.color}>{currentMode.icon}</span>
          <span className="hidden sm:inline text-sm font-medium">{currentMode.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <div className="grid grid-cols-2 gap-1 p-1">
          {standardModes.map((m) => (
            <DropdownMenuItem
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-xs ${
                mode === m.value ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
              }`}
            >
              <span className={m.color}>{m.icon}</span>
              <span className="truncate">{m.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          Advanced Features
        </div>
        <div className="p-1 space-y-1">
          {specialModes.map((m) => (
            <DropdownMenuItem
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer ${
                mode === m.value 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-muted"
              }`}
            >
              <span className={m.color}>{m.icon}</span>
              <span className="font-medium">{m.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
