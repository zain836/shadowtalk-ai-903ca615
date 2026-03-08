import { Code, Languages, FileText, Lightbulb, Image, Pen, Music, Sparkles, Brain, Search, Globe, Bug } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const orbitActions = [
  { icon: Code, label: "Code", prompt: "Help me write a function that ", color: "#3b82f6" },
  { icon: Lightbulb, label: "Brainstorm", prompt: "Give me 5 creative ideas for ", color: "#f59e0b" },
  { icon: Image, label: "Imagine", prompt: "/imagine ", color: "#8b5cf6" },
  { icon: Search, label: "Research", prompt: "Research and explain: ", color: "#10b981" },
  { icon: Brain, label: "Explain", prompt: "Explain in simple terms: ", color: "#ec4899" },
  { icon: Globe, label: "Browse", prompt: "Search the web for latest info on ", color: "#06b6d4" },
];

const quickChips = [
  { icon: FileText, label: "Summarize text", prompt: "Summarize the following text: " },
  { icon: Bug, label: "Debug code", prompt: "Help me debug this error: " },
  { icon: Languages, label: "Translate", prompt: "Translate this to Spanish: " },
  { icon: Music, label: "Generate music", prompt: "Generate a chill lo-fi track with " },
  { icon: Pen, label: "Write essay", prompt: "Write a detailed essay about " },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center py-2 md:py-4 px-4 select-none">
      
      {/* Central Orb + Orbiting Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-[260px] h-[260px] md:w-[300px] md:h-[300px] mb-2"
      >
        {/* Central Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Hexagonal grid pulse */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={`hex-${i}`}
                animate={{ scale: [1, 2.4 + i * 0.4], opacity: [0.3 - i * 0.08, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: i * 0.7 }}
                className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full border border-primary/30"
                style={{ clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
              />
            ))}

            {/* Rotating double orbit */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute w-24 h-24 md:w-28 md:h-28"
            >
              <div className="absolute inset-0 rounded-full border border-dashed border-primary/10" />
              {/* Orbit dot 1 */}
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              />
              {/* Orbit dot 2 */}
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.6)]"
              />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute w-22 h-22 md:w-26 md:h-26"
            >
              <div className="absolute inset-0 rounded-full border border-secondary/8" />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_hsl(var(--secondary)/0.5)]"
              />
            </motion.div>

            {/* Breathing glow */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-6 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl"
            />

            {/* Core body */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/30 via-background to-secondary/20 flex items-center justify-center shadow-2xl shadow-primary/20 backdrop-blur-xl overflow-hidden">
              {/* Sweeping shimmer */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
                style={{ background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.12) 10%, transparent 20%)" }}
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Orbiting Action Nodes */}
        {orbitActions.map((action, i) => {
          const Icon = action.icon;
          const total = orbitActions.length;
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const radius = 95;
          const mdRadius = 115;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const mdX = Math.cos(angle) * mdRadius;
          const mdY = Math.sin(angle) * mdRadius;
          const isHovered = hoveredIdx === i;

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelect(action.prompt)}
              className="absolute group cursor-pointer"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Connection line to core */}
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: "1px",
                  height: "1px",
                  overflow: "visible",
                }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={-x}
                  y2={-y}
                  stroke={action.color}
                  strokeOpacity={isHovered ? 0.3 : 0.06}
                  strokeWidth="1"
                  strokeDasharray={isHovered ? "0" : "4 4"}
                  className="transition-all duration-300"
                />
              </svg>

              {/* Node */}
              <motion.div
                animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative flex flex-col items-center gap-1.5"
              >
                {/* Glow ring on hover */}
                <div
                  className="absolute -inset-2 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                  style={{ backgroundColor: action.color }}
                />
                
                <div
                  className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center border border-border/20 bg-card/60 backdrop-blur-md group-hover:border-opacity-50 transition-all duration-300 shadow-lg"
                  style={{
                    borderColor: isHovered ? action.color : undefined,
                    boxShadow: isHovered ? `0 0 20px ${action.color}30` : undefined,
                  }}
                >
                  <Icon
                    className="h-5 w-5 transition-colors duration-300"
                    style={{ color: action.color }}
                  />
                </div>
                
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="text-[10px] md:text-[11px] font-medium text-muted-foreground/50 group-hover:text-foreground/80 transition-colors duration-200 whitespace-nowrap"
                >
                  {action.label}
                </motion.span>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Title below the orb */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-3"
      >
        <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground/90 mb-1">
          What shall we build?
        </h2>
        <p className="text-[11px] text-muted-foreground/40 tracking-widest uppercase font-mono">
          Select a node or type below
        </p>
      </motion.div>

      {/* Quick chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-2 max-w-md"
      >
        {quickChips.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.04, duration: 0.3 }}
              onClick={() => onSelect(c.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/10 bg-card/20 hover:bg-card/50 hover:border-primary/20 transition-all duration-200 text-[11px] text-muted-foreground/50 hover:text-foreground/80 cursor-pointer group"
            >
              <Icon className="h-3 w-3 text-primary/40 group-hover:text-primary/70 transition-colors" />
              <span>{c.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground/20 font-mono"
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