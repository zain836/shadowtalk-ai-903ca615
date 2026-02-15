import { Code, Languages, FileText, Lightbulb, Image, MessageSquare, Pen, Music, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const prompts = [
  {
    icon: <Code className="h-5 w-5" />,
    label: "Write code",
    description: "Generate clean, production-ready code",
    prompt: "Help me write a function that ",
    color: "text-blue-400",
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    label: "Brainstorm",
    description: "Generate creative ideas and solutions",
    prompt: "Give me 5 creative ideas for ",
    color: "text-amber-400",
    bg: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Summarize",
    description: "Distill key points from any text",
    prompt: "Summarize the following text: ",
    color: "text-emerald-400",
    bg: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    icon: <Pen className="h-5 w-5" />,
    label: "Debug code",
    description: "Find and fix bugs in your code",
    prompt: "Help me debug this error: ",
    color: "text-red-400",
    bg: "from-red-500/10 to-red-500/5",
    border: "border-red-500/20 hover:border-red-500/40",
  },
  {
    icon: <Image className="h-5 w-5" />,
    label: "Generate image",
    description: "Create AI-generated visuals",
    prompt: "/imagine ",
    color: "text-violet-400",
    bg: "from-violet-500/10 to-violet-500/5",
    border: "border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: "Explain",
    description: "Break down complex concepts",
    prompt: "Explain in simple terms: ",
    color: "text-pink-400",
    bg: "from-pink-500/10 to-pink-500/5",
    border: "border-pink-500/20 hover:border-pink-500/40",
  },
  {
    icon: <Languages className="h-5 w-5" />,
    label: "Translate",
    description: "Translate between any languages",
    prompt: "Translate this to Spanish: ",
    color: "text-cyan-400",
    bg: "from-cyan-500/10 to-cyan-500/5",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    icon: <Pen className="h-5 w-5" />,
    label: "Creative writing",
    description: "Stories, essays, and creative content",
    prompt: "Write a short story about ",
    color: "text-orange-400",
    bg: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500/40",
  },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16 px-4">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">How can I help you today?</h2>
        <p className="text-sm text-muted-foreground max-w-md">Choose a starting point or type your own message below</p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full max-w-2xl">
        {prompts.slice(0, 8).map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
            onClick={() => onSelect(p.prompt)}
            className={`group relative flex flex-col items-start gap-2 p-3 md:p-4 rounded-xl border bg-gradient-to-br ${p.bg} ${p.border} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left`}
          >
            <span className={`${p.color} transition-transform duration-200 group-hover:scale-110`}>
              {p.icon}
            </span>
            <div>
              <span className="text-xs md:text-sm font-medium block">{p.label}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground leading-tight hidden md:block mt-0.5">
                {p.description}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
