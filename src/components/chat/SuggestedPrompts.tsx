import { Code, Languages, FileText, Lightbulb, Image, Pen, Music, Sparkles, Brain, Search, Globe, Wand2, BookOpen, Bug, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const quickActions = [
  {
    icon: Code,
    label: "Write code",
    desc: "Functions, APIs, scripts",
    prompt: "Help me write a function that ",
    accent: "from-blue-500/15 to-blue-500/5 border-blue-500/20 hover:border-blue-400/40",
    iconClass: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm",
    desc: "Ideas & strategies",
    prompt: "Give me 5 creative ideas for ",
    accent: "from-amber-500/15 to-amber-500/5 border-amber-500/20 hover:border-amber-400/40",
    iconClass: "text-amber-400 bg-amber-500/10",
  },
  {
    icon: Image,
    label: "Generate image",
    desc: "AI art & visuals",
    prompt: "/imagine ",
    accent: "from-violet-500/15 to-violet-500/5 border-violet-500/20 hover:border-violet-400/40",
    iconClass: "text-violet-400 bg-violet-500/10",
  },
  {
    icon: Search,
    label: "Research",
    desc: "Deep web analysis",
    prompt: "Research and explain: ",
    accent: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-400/40",
    iconClass: "text-emerald-400 bg-emerald-500/10",
  },
];

const chips = [
  { icon: FileText, label: "Summarize", prompt: "Summarize the following text: " },
  { icon: Bug, label: "Debug", prompt: "Help me debug this error: " },
  { icon: Languages, label: "Translate", prompt: "Translate this to Spanish: " },
  { icon: Brain, label: "Explain", prompt: "Explain in simple terms: " },
  { icon: Globe, label: "Web search", prompt: "Search the web for latest info on " },
  { icon: Music, label: "Music", prompt: "Generate a chill lo-fi track with " },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 select-none">
      {/* Logo + Title */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-12"
      >
        <motion.div
          className="relative w-[72px] h-[72px] mx-auto mb-6"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          {/* Outer glow ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 blur-2xl opacity-60" />
          {/* Icon container */}
          <div className="relative w-full h-full rounded-[22px] bg-gradient-to-br from-primary via-primary/85 to-secondary flex items-center justify-center shadow-2xl shadow-primary/20 ring-1 ring-white/[0.08]">
            <motion.div
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-8 w-8 text-primary-foreground drop-shadow-sm" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          What can I help with?
        </h1>
        <p className="text-sm text-muted-foreground/50 max-w-md mx-auto leading-relaxed tracking-wide">
          Ask anything, generate images, write code, or explore the web
        </p>
      </motion.div>

      {/* Action Cards — 4-column grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-[640px] mb-8">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => onSelect(action.prompt)}
              className={`group relative flex flex-col items-start gap-4 p-4 rounded-2xl border bg-gradient-to-b ${action.accent} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] text-left cursor-pointer`}
            >
              <div className={`${action.iconClass} p-2 rounded-xl ring-1 ring-white/[0.06] transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{action.label}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <span className="text-[11px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">{action.desc}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Chip row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-2 max-w-lg"
      >
        {chips.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.04, duration: 0.3 }}
              onClick={() => onSelect(c.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/15 bg-card/25 hover:bg-card/50 hover:border-border/35 transition-all duration-200 text-xs text-muted-foreground/60 hover:text-foreground/80 cursor-pointer"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{c.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Keyboard shortcuts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-10 flex items-center gap-3 text-[10px] text-muted-foreground/25 font-mono"
      >
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md border border-border/15 bg-muted/15 font-mono">⌘K</kbd>
          Command palette
        </span>
        <span className="opacity-40">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md border border-border/15 bg-muted/15 font-mono">⇧R</kbd>
          Deep Research
        </span>
      </motion.div>
    </div>
  );
};