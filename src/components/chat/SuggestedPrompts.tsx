import { Code, Languages, FileText, Lightbulb, Image, Pen, Music, Search, Globe, Brain, Bug, ArrowRight, Shield, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const capabilities = [
  { icon: Search, label: "Research", prompt: "Research and explain: ", description: "Deep dive into any topic" },
  { icon: Code, label: "Code", prompt: "Help me write a function that ", description: "Write, debug, or explain code" },
  { icon: Image, label: "Create Image", prompt: "/imagine ", description: "Generate images from text" },
  { icon: FileText, label: "Write Document", prompt: "Write a detailed document about ", description: "Articles, emails, reports" },
  { icon: Brain, label: "Explain", prompt: "Explain in simple terms: ", description: "Break down complex topics" },
  { icon: Globe, label: "Browse Web", prompt: "Search the web for latest info on ", description: "Real-time web search" },
];

const quickActions = [
  { icon: Bug, label: "Debug code", prompt: "Help me debug this error: " },
  { icon: Languages, label: "Translate", prompt: "Translate this to Spanish: " },
  { icon: Music, label: "Create music", prompt: "Generate a chill lo-fi track with " },
  { icon: Pen, label: "Write essay", prompt: "Write a detailed essay about " },
  { icon: Lightbulb, label: "Brainstorm", prompt: "Give me 5 creative ideas for " },
  { icon: Shield, label: "Security scan", prompt: "Run a security audit on " },
  { icon: Play, label: "Automate task", prompt: "Automate this workflow: " },
];

const greetings = [
  "What can I help you with today?",
  "Ready to create something great.",
  "Let's solve something together.",
  "How can I assist you?",
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(greeting.slice(0, i + 1));
      i++;
      if (i >= greeting.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [greeting]);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 select-none max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground/90 mb-1.5 min-h-[2rem]">
          {typedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-[2px] h-5 bg-primary ml-0.5 align-middle"
          />
        </h2>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Ask anything, or pick a suggestion below
        </p>
      </motion.div>

      {/* Capability Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mb-5">
        {capabilities.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.button
              key={cap.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              onClick={() => onSelect(cap.prompt)}
              className="group flex flex-col items-start gap-2 p-3 rounded-xl border border-border/20 bg-card/30 hover:bg-card/60 hover:border-border/40 cursor-pointer transition-all duration-200 text-left"
            >
              <Icon className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              <div>
                <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors block">{cap.label}</span>
                <span className="text-[11px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">{cap.description}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Quick action pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onSelect(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/10 hover:border-border/25 hover:bg-muted/10 transition-all duration-150 text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 cursor-pointer"
            >
              <Icon className="w-3 h-3" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Keyboard hint */}
      <div className="mt-5 flex items-center gap-3 text-[10px] text-muted-foreground/25 font-mono">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/10 bg-muted/10">⌘K</kbd>
          All tools
        </span>
        <span className="opacity-30">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/10 bg-muted/10">⇧R</kbd>
          Research
        </span>
      </div>
    </div>
  );
};
