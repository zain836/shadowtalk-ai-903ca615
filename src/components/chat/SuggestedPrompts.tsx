import { Code, Languages, FileText, Lightbulb, Image, MessageSquare, Pen, Music, Sparkles, ArrowRight, Brain, Search, Globe, Zap } from "lucide-react";
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
    color: "text-blue-400",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    label: "Brainstorm",
    prompt: "Give me 5 creative ideas for ",
    color: "text-amber-400",
    glow: "group-hover:shadow-amber-500/20",
  },
  {
    icon: <Image className="h-5 w-5" />,
    label: "Generate image",
    prompt: "/imagine ",
    color: "text-violet-400",
    glow: "group-hover:shadow-violet-500/20",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Research",
    prompt: "Research and explain: ",
    color: "text-emerald-400",
    glow: "group-hover:shadow-emerald-500/20",
  },
];

const expandedPrompts = [
  {
    icon: <FileText className="h-4 w-4" />,
    label: "Summarize text",
    prompt: "Summarize the following text: ",
    color: "text-cyan-400",
  },
  {
    icon: <Pen className="h-4 w-4" />,
    label: "Debug code",
    prompt: "Help me debug this error: ",
    color: "text-red-400",
  },
  {
    icon: <Languages className="h-4 w-4" />,
    label: "Translate",
    prompt: "Translate this to Spanish: ",
    color: "text-sky-400",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    label: "Explain concept",
    prompt: "Explain in simple terms: ",
    color: "text-pink-400",
  },
  {
    icon: <Globe className="h-4 w-4" />,
    label: "Web search",
    prompt: "Search the web for latest info on ",
    color: "text-green-400",
  },
  {
    icon: <Music className="h-4 w-4" />,
    label: "Generate music",
    prompt: "Generate a chill lo-fi track with ",
    color: "text-orange-400",
  },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-10 md:mb-14"
      >
        {/* Animated logo */}
        <motion.div 
          className="relative w-16 h-16 mx-auto mb-5"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-secondary blur-xl opacity-40" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center shadow-2xl shadow-primary/30">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </motion.div>
          </div>
        </motion.div>

        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2.5">
          What can I help with?
        </h2>
        <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto leading-relaxed">
          Ask anything, generate images, write code, or explore the web
        </p>
      </motion.div>

      {/* Primary Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-6">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onSelect(action.prompt)}
            className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:bg-card/70 hover:border-border/50 hover:shadow-lg ${action.glow} hover:-translate-y-0.5 active:scale-[0.98] text-left`}
          >
            <div className={`${action.color} transition-transform duration-300 group-hover:scale-110`}>
              {action.icon}
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-sm font-medium">{action.label}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all duration-300 ml-auto group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Secondary Quick Links */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-2 max-w-xl"
      >
        {expandedPrompts.map((p, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 + i * 0.04, duration: 0.3 }}
            onClick={() => onSelect(p.prompt)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/20 bg-muted/20 hover:bg-muted/40 hover:border-border/40 transition-all duration-200 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className={p.color}>{p.icon}</span>
            <span>{p.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Keyboard shortcut hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[10px] text-muted-foreground/30 mt-8 font-mono flex items-center gap-2"
      >
        <kbd className="px-1.5 py-0.5 rounded border border-border/20 bg-muted/20">⌘K</kbd>
        <span>Command palette</span>
        <span className="opacity-50">·</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border/20 bg-muted/20">⇧R</kbd>
        <span>Deep Research</span>
      </motion.p>
    </div>
  );
};
