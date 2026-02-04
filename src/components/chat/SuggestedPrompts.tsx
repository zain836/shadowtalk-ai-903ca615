import { Sparkles, Code, FileText, Lightbulb, Image, MessageSquare, Languages, Pen, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const prompts = [
  {
    icon: <Code className="h-4 w-4" />,
    label: "Write code",
    prompt: "Help me write a function that ",
    color: "text-blue-500",
  },
  {
    icon: <Languages className="h-4 w-4" />,
    label: "Translate",
    prompt: "Translate this to Spanish: ",
    color: "text-cyan-500",
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: "Summarize",
    prompt: "Summarize the following text: ",
    color: "text-green-500",
  },
  {
    icon: <Pen className="h-4 w-4" />,
    label: "Debug code",
    prompt: "Help me debug this error: ",
    color: "text-red-500",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Brainstorm",
    prompt: "Give me 5 creative ideas for ",
    color: "text-yellow-500",
  },
  {
    icon: <Image className="h-4 w-4" />,
    label: "Generate image",
    prompt: "/imagine ",
    color: "text-purple-500",
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    label: "Explain",
    prompt: "Explain in simple terms: ",
    color: "text-pink-500",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: "Creative writing",
    prompt: "Write a short story about ",
    color: "text-orange-500",
  },
  {
    icon: <Music className="h-4 w-4" />,
    label: "Recommend music",
    prompt: "Recommend songs similar to ",
    color: "text-rose-500",
  },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  // Show fewer prompts on mobile
  const mobilePrompts = prompts.slice(0, 4);
  
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center py-2 md:py-4 px-2">
      {/* Mobile: show only 4 prompts */}
      <div className="flex flex-wrap gap-1.5 justify-center md:hidden">
        {mobilePrompts.map((p, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => onSelect(p.prompt)}
            className="gap-1.5 hover:bg-muted/80 transition-colors text-xs h-8 px-2"
          >
            <span className={p.color}>{p.icon}</span>
            {p.label}
          </Button>
        ))}
      </div>
      {/* Desktop: show all prompts */}
      <div className="hidden md:flex flex-wrap gap-2 justify-center">
        {prompts.map((p, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => onSelect(p.prompt)}
            className="gap-2 hover:bg-muted/80 transition-colors"
          >
            <span className={p.color}>{p.icon}</span>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
