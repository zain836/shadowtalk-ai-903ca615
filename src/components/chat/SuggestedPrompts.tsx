import { Code, Languages, FileText, Lightbulb, Image, Pen, Music, Sparkles, ArrowRight, Brain, Search, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const quickActions = [
  {
    icon: <Code className="h-5 w-5" />,
    label: "Write code",
    prompt: "Help me write a function that ",
    gradient: "from-blue-500/20 to-blue-600/5",
    borderGlow: "hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    label: "Brainstorm",
    prompt: "Give me 5 creative ideas for ",
    gradient: "from-amber-500/20 to-amber-600/5",
    borderGlow: "hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    icon: <Image className="h-5 w-5" />,
    label: "Generate image",
    prompt: "/imagine ",
    gradient: "from-violet-500/20 to-violet-600/5",
    borderGlow: "hover:border-violet-500/40",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Research",
    prompt: "Research and explain: ",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderGlow: "hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
];

const expandedPrompts = [
  { icon: <FileText className="h-3.5 w-3.5" />, label: "Summarize", prompt: "Summarize the following text: ", color: "text-cyan-400" },
  { icon: <Pen className="h-3.5 w-3.5" />, label: "Debug", prompt: "Help me debug this error: ", color: "text-red-400" },
  { icon: <Languages className="h-3.5 w-3.5" />, label: "Translate", prompt: "Translate this to Spanish: ", color: "text-sky-400" },
  { icon: <Brain className="h-3.5 w-3.5" />, label: "Explain", prompt: "Explain in simple terms: ", color: "text-pink-400" },
  { icon: <Globe className="h-3.5 w-3.5" />, label: "Web search", prompt: "Search the web for latest info on ", color: "text-green-400" },
  { icon: <Music className="h-3.5 w-3.5" />, label: "Music", prompt: "Generate a chill lo-fi track with ", color: "text-orange-400" },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pb-4">
      {/* Hero */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-8"
      >
        {/* Animated logo */}
        <motion.div
          className="relative w-14 h-14 mx-auto mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-secondary blur-2xl opacity-50 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center shadow-2xl shadow-primary/25 ring-1 ring-white/10">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </motion.div>
          </div>
        </motion.div>

        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-1.5 text-foreground">
          What can I help with?
        </h2>
        <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
          Ask anything, generate images, write code, or explore the web
        </p>
      </motion.div>

      {/* Primary Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full max-w-xl mb-5">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onSelect(action.prompt)}
            className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border/20 bg-gradient-to-b ${action.gradient} backdrop-blur-sm transition-all duration-300 ${action.borderGlow} hover:shadow-xl hover:-translate-y-1 active:scale-[0.97]`}
          >
            <div className={`${action.iconBg} ${action.iconColor} p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110 ring-1 ring-white/5`}>
              {action.icon}
            </div>
            <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Secondary Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-1.5 max-w-lg"
      >
        {expandedPrompts.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + i * 0.03, duration: 0.25 }}
            onClick={() => onSelect(p.prompt)}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/10 bg-card/20 hover:bg-card/50 hover:border-border/30 transition-all duration-200 text-[11px] text-muted-foreground/70 hover:text-foreground"
          >
            <span className={`${p.color} opacity-70 group-hover:opacity-100 transition-opacity`}>{p.icon}</span>
            <span>{p.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
