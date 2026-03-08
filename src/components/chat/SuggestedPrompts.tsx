import { Code, Languages, FileText, Lightbulb, Image, Pen, Music, Search, Globe, Brain, Bug, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const capabilities = [
  { icon: Code, label: "Code", prompt: "Help me write a function that ", accent: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20 hover:border-blue-400/40", glow: "group-hover:shadow-blue-500/10" },
  { icon: Lightbulb, label: "Brainstorm", prompt: "Give me 5 creative ideas for ", accent: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20 hover:border-amber-400/40", glow: "group-hover:shadow-amber-500/10" },
  { icon: Image, label: "Imagine", prompt: "/imagine ", accent: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/20 hover:border-violet-400/40", glow: "group-hover:shadow-violet-500/10" },
  { icon: Search, label: "Research", prompt: "Research and explain: ", accent: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20 hover:border-emerald-400/40", glow: "group-hover:shadow-emerald-500/10" },
  { icon: Brain, label: "Explain", prompt: "Explain in simple terms: ", accent: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20 hover:border-pink-400/40", glow: "group-hover:shadow-pink-500/10" },
  { icon: Globe, label: "Browse", prompt: "Search the web for latest info on ", accent: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20 hover:border-cyan-400/40", glow: "group-hover:shadow-cyan-500/10" },
];

const quickActions = [
  { icon: FileText, label: "Summarize", prompt: "Summarize the following text: " },
  { icon: Bug, label: "Debug", prompt: "Help me debug this error: " },
  { icon: Languages, label: "Translate", prompt: "Translate this to Spanish: " },
  { icon: Music, label: "Music", prompt: "Generate a chill lo-fi track with " },
  { icon: Pen, label: "Write", prompt: "Write a detailed essay about " },
];

const greetings = [
  "What can I help you build today?",
  "Ready to create something extraordinary.",
  "Let's solve something together.",
  "Your intelligence engine awaits.",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(greeting.slice(0, i + 1));
      i++;
      if (i >= greeting.length) clearInterval(interval);
    }, 32);
    return () => clearInterval(interval);
  }, [greeting]);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 select-none max-w-2xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        {/* Minimal logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center backdrop-blur-sm"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.75" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Typed greeting */}
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground/90 mb-1.5 min-h-[2rem]">
          {typedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-[2px] h-5 bg-primary ml-0.5 align-middle"
          />
        </h2>
        <p className="text-xs text-muted-foreground/40 tracking-[0.2em] uppercase font-mono">
          sovereign intelligence engine
        </p>
      </motion.div>

      {/* Capability Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full mb-5"
      >
        {capabilities.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.button
              key={cap.label}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.92 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
                },
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(cap.prompt)}
              className={`group relative flex flex-col items-start gap-2.5 p-3.5 rounded-xl border ${cap.border} bg-card/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:bg-card/50 shadow-lg shadow-transparent ${cap.glow}`}
            >
              {/* Animated gradient accent top bar */}
              <motion.div
                className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${cap.accent} rounded-t-xl`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                style={{ originX: 0 }}
              />

              {/* Icon with subtle float */}
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center"
              >
                <Icon className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
              </motion.div>

              <div className="flex items-center justify-between w-full">
                <span className="text-[13px] font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
                  {cap.label}
                </span>
                <motion.div
                  initial={{ x: 0, opacity: 0.3 }}
                  whileHover={{ x: 3, opacity: 0.7 }}
                >
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground/50 transition-all" />
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Quick action pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
              onClick={() => onSelect(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/10 bg-muted/5 hover:bg-muted/15 hover:border-border/20 transition-all duration-200 text-[11px] text-muted-foreground/50 hover:text-foreground/70 cursor-pointer group"
            >
              <Icon className="w-3 h-3 text-primary/30 group-hover:text-primary/60 transition-colors" />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Keyboard shortcuts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-5 flex items-center gap-3 text-[10px] text-muted-foreground/20 font-mono"
      >
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/10 bg-muted/10">⌘K</kbd>
          Commands
        </span>
        <span className="opacity-30">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/10 bg-muted/10">⇧R</kbd>
          Deep Research
        </span>
      </motion.div>
    </div>
  );
};
